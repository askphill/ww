# Agents

This file provides guidance for AI agents working on this codebase.

## Documentation

For codebase patterns, conventions, and project structure, see:

- **[CLAUDE.md](./CLAUDE.md)** - Main project documentation and coding standards

## Skills

Custom skills are available in `.claude/skills/`:

| Skill | Description | Invocation |
|-------|-------------|------------|
| `ralph` | Convert PRDs to backlog and run autonomous agent loop | `/ralph [path-to-prd.md]` |
| `prd` | Create product requirement documents | `/prd` |
| `shopify-admin` | Fetch data from Shopify Admin API | `/shopify-admin` |
| `tone-of-voice` | Write copy following Wakey brand guidelines | `/tone-of-voice` |

See each skill's `SKILL.md` for detailed usage instructions.

## Backlog

Active work items are tracked in:

- `backlog/backlog.json` - User stories with completion status
- `backlog/progress.txt` - Learnings from previous iterations
