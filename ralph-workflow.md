# Ralph Workflow

Ralph is an autonomous AI agent loop that implements features by executing fresh Claude instances until all PRD items are complete.

## Prerequisites

```bash
# Claude Code CLI
npm install -g @anthropic-ai/claude-code

# jq for JSON parsing
brew install jq
```

## Quick Start

```bash
# Generate a PRD
claude "/prd Add dark mode toggle to settings page"

# Convert PRD to JSON format
claude "/ralph tasks/prd-dark-mode.md"

# Run the autonomous loop (10 iterations max)
./.claude/skills/ralph/scripts/ralph.sh 10
```

## Detailed Workflow

### Step 1: Generate PRD

Use the `/prd` skill to create a detailed Product Requirements Document:

```bash
claude "/prd [your feature description]"
```

Claude will ask clarifying questions, then generate a PRD at `tasks/prd-[feature-name].md`.

**Example:**

```bash
claude "/prd Add priority levels (high/medium/low) to task items with colored badges"
```

### Step 2: Convert to JSON

Use the `/ralph` skill to convert the markdown PRD to `prd.json`:

```bash
claude "/ralph tasks/prd-[feature-name].md"
```

This creates `prd.json` at the project root with structured user stories.

### Step 3: Run Ralph Loop

Execute the autonomous loop:

```bash
./.claude/skills/ralph/scripts/ralph.sh [max_iterations]
```

Default is 10 iterations. Each iteration:

1. Spawns a fresh Claude instance
2. Reads PRD and progress log
3. Implements one user story
4. Runs quality checks
5. Commits changes
6. Records learnings
7. Exits (next iteration continues)

Loop ends when:

- All stories have `passes: true`
- Max iterations reached
- Manual interruption (Ctrl+C)

## Checking Progress

During or after a run:

```bash
# See story completion status
jq '.userStories[] | {id, title, passes}' prd.json

# Read accumulated learnings
cat progress.txt

# View recent commits
git log --oneline -10
```

## File Reference

| File             | Purpose                             |
| ---------------- | ----------------------------------- |
| `prd.json`       | User stories with completion status |
| `progress.txt`   | Append-only log of learnings        |
| `AGENTS.md`      | Codebase patterns (Ralph maintains) |
| `tasks/prd-*.md` | Generated PRD documents             |
| `archive/`       | Previous runs (auto-archived)       |

## Tips

### Right-Sized Stories

Stories should be completable in one iteration (~15-30 min). Split large features:

- "Build settings page" → schema, API, form, validation, tests
- "Add dark mode" → theme vars, toggle, persistence, apply to components

### Quality Gates

All stories require passing quality checks:

```bash
pnpm typecheck
pnpm build
```

UI stories must also verify in browser using chrome-devtools MCP.

### Restart After Issues

If Ralph gets stuck:

1. Check `progress.txt` for error details
2. Fix any blocking issues manually
3. Re-run: `./.claude/skills/ralph/scripts/ralph.sh 10`

### Archive Management

When starting a new feature with a different branch name, Ralph automatically archives the previous run to `archive/YYYY-MM-DD-[branch-name]/`.

## Troubleshooting

**"prd.json not found"**

```bash
claude "/ralph tasks/prd-[your-feature].md"
```

**"jq not found"**

```bash
brew install jq
```

**"Claude CLI not found"**

```bash
npm install -g @anthropic-ai/claude-code
```

**Stories not completing**

- Check `progress.txt` for errors
- Ensure stories are small enough for one iteration
- Verify quality checks pass locally first

## References

- Original Ralph pattern: [github.com/snarktank/ralph](https://github.com/snarktank/ralph)
- Geoffrey Huntley's article: [ghuntley.com/ralph](https://ghuntley.com/ralph)
