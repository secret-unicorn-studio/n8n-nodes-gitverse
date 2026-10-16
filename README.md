# n8n-nodes-gitverse

Custom [n8n](https://n8n.io) nodes for interacting with [Gitverse](https://gitverse.ru) (Gitea 1.23) API.

## Features

- **Repository** — Get, list repositories
- **Branch** — Get, list, create branches
- **File** — Get, create/update file contents
- **Pull Request** — Get, list, create PRs, compare branches
- **Commit** — List commits
- **Webhook** — Receive push events from Gitverse

## Installation

### Via environment variable (n8n >= 2.21)

Add to your `docker-compose.yml`:

```yaml
environment:
  N8N_COMMUNITY_PACKAGES_ENABLED: 'true'
  N8N_COMMUNITY_PACKAGES_MANAGED_BY_ENV: 'true'
  N8N_COMMUNITY_PACKAGES: '[{"name":"n8n-nodes-gitverse","version":"0.1.0"}]'
```

### Manual installation

```bash
docker exec -it n8n sh
mkdir ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-gitverse
# Restart n8n
```

## Setup

1. Create **Gitverse API** credentials in n8n:
   - **Base URL**: `https://gitverse.ru` (or `https://git.sustudio.ru` inside VPN)
   - **Personal Access Token**: PAT with `repo` scope

2. Add the **Gitverse** node to your workflow and select the credentials.

3. Choose **resource** and **operation**.

## Nodes

### Gitverse

Main node for all Gitverse API operations.

#### Resources & Operations

| Resource | Operation | Description |
|----------|-----------|-------------|
| Repository | Get | Get repository details |
| Repository | Get Many | List user's repositories |
| Branch | Get | Get branch info |
| Branch | Get Many | List branches |
| Branch | Create | Create new branch from base |
| File | Get | Get file content |
| File | Create or Update | Create or update a file |
| Pull Request | Get | Get PR details |
| Pull Request | Get Many | List PRs |
| Pull Request | Create | Create a new PR |
| Pull Request | Compare | Compare two branches |
| Commit | Get Many | List commits |

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

# Watch mode
npm run watch
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

## License

MIT
