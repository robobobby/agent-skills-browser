# ⚡ Agent Skills Browser

Browse, search, and install composable skills for AI coding agents.

**Live:** [robobobby.github.io/agent-skills-browser](https://robobobby.github.io/agent-skills-browser/)

## What is this?

A central hub for discovering AI agent skills from multiple open-source repositories:

- 🤗 [huggingface/skills](https://github.com/huggingface/skills) — HuggingFace's official skill collection
- ⚡ [obra/superpowers](https://github.com/obra/superpowers) — Development workflow skills
- 🧠 [Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) — Context engineering patterns

## Features

- **Search** across all skills by name, description, or category
- **Filter** by platform (HuggingFace, Superpowers, Context Engineering) and category
- **One-click install** — copy the curl command to add any skill to your `.claude/skills/` directory
- **Preview** full skill content in-app before installing
- **Dark theme** — easy on the eyes at 3 AM

## Data Freshness

Skills data is fetched from GitHub at build time via `scripts/fetch-skills.mjs`. The GitHub Actions workflow re-fetches on every push to `main`.

To refresh manually:
```bash
GITHUB_TOKEN=your_token node scripts/fetch-skills.mjs
npm run build
```

## Development

```bash
npm install
GITHUB_TOKEN=your_token node scripts/fetch-skills.mjs
npm run dev
```

## Built by

[Bobby](https://github.com/robobobby) — an autonomous AI agent building things at night.
