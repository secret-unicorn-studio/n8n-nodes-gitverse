# n8n-nodes-gitverse

Custom [n8n](https://n8n.io) nodes for interacting with the [Gitverse](https://gitverse.ru) public API.

## API notes

The Gitverse API lives on `https://api.gitverse.ru` — the web UI host (`gitverse.ru`)
does **not** serve `/api/v1/...`, so requests to it fail with 404. Two more details
that the node handles for you:

- Requests must send `Accept: application/vnd.gitverse.object+json;version=1`, otherwise
  the API answers `415`.
- Authentication is `Authorization: Bearer <token>`; the `token <token>` scheme is rejected
  with `401`.
- Lists are paginated with `page` / `per_page` (max 100). The `Link` header points at a host
  that does not respond, so the node reads only the `page` number from `rel="last"` and
  rebuilds the request itself.
- Errors are nested: `{"error":{"code":"NOT_FOUND","message":"Not found",...}}`. The node
  surfaces them as `[Gitverse 404] NOT_FOUND: Not found`.
- `429` and `5xx` responses are retried with exponential backoff, honouring `Retry-After`.
  The budget is configurable through the **Max Retries** credential field.
- Review listings (`/pulls/{n}/reviews`) are the exception to the pagination rule: they take
  `limit` instead of `per_page` and reject `sort`.

Legacy credential values that point at the web host (`https://gitverse.ru`,
`https://gitverse.ru/api/v1`) are rewritten to `https://api.gitverse.ru` automatically;
self-hosted base URLs are used as-is.

### Pull request specifics

Observed against the live API while building the pull request operations:

- Creating a pull request fails with `400 VALIDATION_ERROR` when the head branch has no
  commits that the base branch is missing — there has to be something to merge.
- `base` may be any branch, not only the default one.
- `PUT /pulls/{n}/update-branch` answers `202` when it starts merging the base into the head,
  and `422 UNPROCESSABLE_ENTITY` when the head is already up to date.
- `GET /pulls/{n}/merge` is documented as `204` (mergeable) / `404` (not mergeable), but it
  answered `404` for both clean and conflicting pull requests in our tests, so
  **Get Merge Status** currently reports `mergeable: false` for every pull request we tried.
  `403` means the token has no access to the repository and is surfaced as an error.

### Issue and label specifics

Observed against the live API while building the issue and label operations:

- The public API has **no endpoint for creating an issue** (`POST /issues` answers `403`), so
  issues can only be listed, read, updated and commented on.
- Omitting `state` on `GET /issues` returns only the *open* issues, contrary to the
  documentation. The node therefore always sends `state`, defaulting to `all`.
- `GET /issues/{n}/comments` takes no pagination at all, only the `since` / `before` filters.
  The timeline (`GET /issues/{n}/timeline`) is paginated normally.
- Renaming a label uses `name` in the request body. The documentation names the field
  `new_name`, which the server accepts and silently ignores.
- Label listings paginate with `limit` instead of `per_page`, and there is **no endpoint for
  deleting a label**: every `DELETE` shape answers `400`.
- Attachments are uploaded as `multipart/form-data` with a single `attachment` part, exactly as
  the documented `curl -F "attachment=@file"` example. The test repository rejects every upload
  with an empty `422`, verified with `curl` too, so the request shape could only be checked
  locally. There is no documented endpoint for listing attachments (`GET .../attachments`
  answers `400`).
- The "Issues 2.0" endpoints (create, sub-issues, parent, development links, reactions, bulk
  operations) only accept real tasks. A pull-request-backed issue answers `422` to all of them.
- Creating a task through the API is disabled for our account: `POST /issues`,
  `POST /issues/bulk/values` and `DELETE /issues/bulk/delete` answer an empty `403` on the test
  repository. Every route was checked and none answers `404`, but these operations could not be
  verified end to end. The account needs the feature enabled before they can be used.
- `DELETE /issues/{n}/sub_issues` takes `sub_issue_id` as a query parameter, while
  `DELETE /issues/{n}/development` takes the links in the request body.
- `POST /issues/bulk/update` is documented without a request body contract (the page only lists
  the response codes), so it is **not** implemented.

### Release specifics

- On a repository without releases, `GET /releases` answers `404 REPO_NOT_FOUND` instead of an
  empty array, so **Get Many** fails with "Repository not found" on an empty repository.
- Creating a release also creates its tag, but deleting the release leaves the tag behind. There
  is no documented tags endpoint (`GET /tags` answers `400`); tags live under
  `GET /repos/{o}/{r}/git/matching-refs/tags` and can be removed with
  `DELETE /repos/{o}/{r}/git/refs/tags/{tag}`, which answers `204`.
- Release assets are uploaded as `multipart/form-data` with a `name` field next to the
  `attachment` file, and there uploads work — unlike issue attachments on the same repository.

### Webhook specifics

- Only seven events can be registered on a hook: `create`, `delete`, `fork`, `push`,
  `pull_request`, `pull_request_comment` and `pull_request_review`. Every other value, the
  wildcard `*` included, is rejected with `400`.
- The `type` of a hook is always `repository`, whatever is sent; only webhooks are supported.
- A hook carries no secret, so deliveries cannot be verified by a signature. The optional
  `authorization_header` and `branch_filter` settings are the only way to authenticate and to
  narrow the deliveries.
- `PATCH` accepts `events` to replace the list and `add_events` / `remove_events` to change it
  incrementally, which is what the **Update** operation exposes.

## Features

- **Repository** — Get, list (own or organization), create, update, delete, fork, language
  breakdown, list and add collaborators
- **Branch** — Get, list, create from a base branch, delete
- **File** — Read a file or list a directory, create/update, delete
- **Commit** — Get, list (branch and path filters), compare two references
- **Pull Request** — Get, list, create, update, update head branch, merge status, changed
  files, commits, comments, reviews (create, list, submit, delete)
- **Issue** — Get, list (state, assignee, type, creator, labels, sort, since), create, update,
  labels, comments (create, list, get by ID, update, delete), reactions, attachments, timeline,
  parent and sub-issues, development links, bulk values and bulk delete
- **Label** — Get, list, create, update (rename included)
- **Release** — Get by ID or tag, list, create, update, delete by ID or tag, list assets, upload
  an asset, delete an asset
- **Hook** — Get, list, create, update (events, config, activation), delete
- **Webhook** — Trigger node receiving the Gitverse webhook deliveries

Repository and branch fields are searchable pickers: select from a list, paste a repository URL,
or type `owner/repo` / a branch name directly.

## Installation

### Local Docker (development)

Mount the package into the container and point `N8N_CUSTOM_EXTENSIONS` at it:

```yaml
services:
  n8n:
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/custom-nodes/n8n-nodes-gitverse
    volumes:
      - ./custom_nodes/n8n-nodes-gitverse:/home/node/custom-nodes/n8n-nodes-gitverse
```

Run `npm install && npm run build` on the host first — n8n loads the compiled
files from `dist/`. This is how the node is wired in
`n8n-automation/docker-compose.yml`.

### From npm (once the package is published)

```bash
docker exec -it n8n sh
cd ~/.n8n/nodes
npm install n8n-nodes-gitverse
# Restart n8n
```

`N8N_COMMUNITY_PACKAGES` and `N8N_COMMUNITY_PACKAGES_MANAGED_BY_ENV` are not
supported environment variables, so they cannot be used to install this node.

## Setup

1. Create **Gitverse API** credentials in n8n:
   - **Base URL**: `https://api.gitverse.ru` (self-hosted instances need their own prefix,
     for example `https://git.sustudio.ru/api/v1`)
   - **Personal Access Token**: PAT with the scopes your workflows need
   - **Max Retries**: how many times to retry `429` / `5xx` responses (default `3`, `0` disables)

2. Add the **Gitverse** node to your workflow and select the credentials.

3. Choose **resource** and **operation**.

## Nodes

### Gitverse

Main node for all Gitverse API operations.

#### Resources & Operations

| Resource | Operations |
|----------|------------|
| Repository | Get, Get Many, Create, Update, Delete, Fork, Get Languages, Get Collaborators, Add Collaborator |
| Branch | Get, Get Many, Create, Delete |
| File | Get, Create or Update, Delete |
| Commit | Get, Get Many, Compare |
| Pull Request | Get, Get Many, Create, Update, Update Branch, Get Merge Status, Get Changed Files, Get Commits, Create Comment, Get Reviews, Create Review, Submit Review, Delete Review |
| Issue | Get, Get Many, Create, Update, Get Labels, Get Comments, Get Comment, Create Comment, Update Comment, Delete Comment, Add Comment Reaction, Delete Comment Reaction, Get Timeline, Add Attachment, Delete Attachment, Add Comment Attachment, Delete Comment Attachment, Add Reaction, Get Parent, Get Sub-Issues, Add Sub-Issue, Remove Sub-Issue, Get Development, Link Development, Unlink Development, Get Bulk Values, Delete Many |
| Label | Get, Get Many, Create, Update |
| Release | Get, Get Many, Get by Tag, Create, Update, Delete, Delete by Tag, Get Assets, Upload Asset, Delete Asset |
| Hook | Get, Get Many, Create, Update, Delete |

### Gitverse Webhook

Trigger node for receiving Gitverse webhook deliveries. Point a **Hook** resource at the
production URL of this node, or register the hook by hand.

#### Supported Events

`create`, `delete`, `fork`, `push`, `pull_request`, `pull_request_comment`,
`pull_request_review` — the same list the API accepts when a hook is created — plus an
**All Events** wildcard that is handled by the node itself.

Gitverse sends the event name in a header that is not part of the public documentation, so the
node looks at `X-Gitea-Event`, `X-Gitverse-Event`, `X-Gitea-Hook`, `X-Forgejo-Event` and
`X-GitHub-Event` in turn, and falls back to the shape of the payload when none of them is set.
Reviews and comments arrive under the `pull_request` event and are refined from the payload.
The output item carries `event`, `delivery`, `repository`, `payload` and `timestamp`.

The **Repository** filter is optional: leave it empty to accept every repository, or set it to
`owner/repo` (or just `repo`) to only run the workflow for one repository.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Coverage report (thresholds enforced)
npm run test:coverage

# Re-run tests on change
npm run test:watch
```

## Project Structure

```
n8n-nodes-gitverse/
├── credentials/
│   └── GitverseApi.credentials.ts  # PAT credentials
├── nodes/
│   ├── Gitverse/
│   │   ├── Gitverse.node.ts        # Main node
│   │   ├── Gitverse.node.json      # Metadata
│   │   ├── Gitverse.node.properties.ts  # Node fields
│   │   ├── Gitverse.node.execute.ts     # Execute logic
│   │   ├── Gitverse.node.operations.ts  # API operations
│   │   └── gitverse.svg            # Node icon
│   └── GitverseWebhook/
│       ├── GitverseWebhook.node.ts  # Webhook trigger
│       └── gitverse.svg            # Node icon
├── utils/
│   └── api.ts                      # API client utilities
├── index.ts                        # Exports
├── package.json
├── tsconfig.json
└── README.md
```

Unit tests are colocated with the sources as `*.test.ts` files.

## License

MIT
