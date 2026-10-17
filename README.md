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

## Features

- **Repository** — Get, list (own or organization), create, update, delete, fork, language
  breakdown, list and add collaborators
- **Branch** — Get, list, create from a base branch, delete
- **File** — Read a file or list a directory, create/update, delete
- **Commit** — Get, list (branch and path filters), compare two references
- **Pull Request** — Get, list, create, update, update head branch, merge status, changed
  files, commits, comments, reviews (create, list, submit, delete)
- **Issue** — Get, list (state, assignee, type, creator, labels, sort, since), update,
  comments (create, list, get by ID, update, delete), reactions, attachments, timeline
- **Label** — Get, list, create, update (rename included)
- **Webhook** — Receive push events from Gitverse

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
| Issue | Get, Get Many, Update, Get Comments, Get Comment, Create Comment, Update Comment, Delete Comment, Add Comment Reaction, Delete Comment Reaction, Get Timeline, Add Comment Attachment, Delete Comment Attachment |
| Label | Get, Get Many, Create, Update |

### Gitverse Webhook

Trigger node for receiving Gitverse webhook events.

#### Supported Events

- `push` — Code push events
- `pull_request` — PR events
- `issues` — Issue events

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
