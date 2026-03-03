# Context Hub

Always-current docs and skills for AI agents. One CLI to search, fetch, and use up-to-date documentation — so your agent stops hallucinating deprecated APIs.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@aisuite/chub)](https://www.npmjs.com/package/@aisuite/chub)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

## The Problem

Your AI coding agent was trained months ago. The API you're using shipped a breaking change last week. The agent doesn't know — it writes code against the old API, you debug for 20 minutes, then paste the docs into chat yourself.

## The Solution

```bash
npm install -g @aisuite/chub
```

```bash
chub update                                    # download the registry
chub search "stripe"                           # find what's available
chub get stripe/api --lang js                  # fetch current docs
```

That's it. Search, fetch, use. No hallucinated parameters, no outdated patterns.

## How Agents Use It

```bash
# Agent searches for current docs:
ID=$(chub search "stripe payments" --json | jq -r '.results[0].id')

# Agent fetches and reads them:
chub get "$ID" --lang python -o .context/stripe.md

# Now it writes correct code against the latest API.
```

For reusable patterns — login flows, deployment scripts, auth integrations — agents fetch skills:

```bash
chub get playwright-community/login-flows -o .claude/skills/login-flows/SKILL.md
```

The skill is installed. The agent discovers it automatically in every future session.

## Commands

| Command | Purpose |
|---------|---------|
| `chub search [query]` | Search docs and skills (no query = list all) |
| `chub get <ids...>` | Fetch docs or skills by ID |
| `chub feedback <id> <up\|down>` | Rate a doc or skill |
| `chub update` | Refresh the cached registry |
| `chub cache status\|clear` | Manage the local cache |
| `chub build <content-dir>` | Build registry from content directory |

Every command supports `--json` for machine-readable output, making it easy to pipe into agents.

### Key Flags

```bash
--json                 # Structured JSON output
--tags <csv>           # Filter by tags
--lang <language>      # Language variant (js, py, ts)
--full                 # Fetch all files, not just the entry point
-o, --output <path>    # Write content to file or directory
```

## Two Content Types

- **Docs** ("what to know") — API/SDK reference documentation. Large, detailed, versioned per language. Fetched on-demand for a specific task.
- **Skills** ("how to do it") — Behavioral instructions, coding patterns, automation playbooks. Smaller, actionable, installable into agent skill directories.

Both follow the [Agent Skills](https://agentskills.io) open standard — compatible with Claude Code, Cursor, Codex, and 30+ other tools.

## Configuration

Config lives at `~/.chub/config.yaml`:

```yaml
sources:
  - name: community
    url: https://cdn.aichub.org/v1           # Public registry
  - name: internal
    path: /path/to/local/docs                # Your private docs

source: "official,maintainer,community"       # Trust policy
refresh_interval: 86400                       # Cache TTL (24h)
telemetry: true                               # Anonymous usage analytics (opt-out)
```

## Bring Your Own Docs

Build and serve your team's internal documentation alongside the public registry:

```bash
# Create content with DOC.md / SKILL.md frontmatter
chub build my-content/ -o .chub-local/

# Add as a local source
# In ~/.chub/config.yaml:
#   sources:
#     - name: internal
#       path: /path/to/.chub-local
```

Now `chub search` covers both public and private content. See [docs/byod-guide.md](docs/byod-guide.md) for the full guide.

## Why Context Hub

**Curated, not auto-scraped.** Every doc is written by humans who understand the library — structured, complete, and optimized for how LLMs read. Not disconnected code snippets from a scraping pipeline.

**Local-first, offline-capable.** Everything is cached locally. Works offline, in CI/CD, in air-gapped environments. No hosted service dependency.

**Open and transparent.** The registry is open. Every doc is a markdown file you can read, fork, and modify. No opaque scoring systems or proprietary enrichment pipelines.

## Telemetry

Context Hub collects anonymous usage analytics to improve the registry. No personally identifiable information is collected — only a hashed machine identifier.

Opt out anytime:
```yaml
# ~/.chub/config.yaml
telemetry: false
```

Or via environment variable: `CHUB_TELEMETRY=0`

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Code contribution guidelines
- How to contribute docs and skills

## License

[MIT](LICENSE)
