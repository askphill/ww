# Worktree Skill

Manage git worktrees for parallel development.

## Scripts

### setup-worktree.sh

Sets up a new worktree with environment files and dependencies.

**Usage:**
```bash
bash .claude/skills/worktree/scripts/setup-worktree.sh <worktree-path> <main-repo-path>
```

**Example:**
```bash
bash .claude/skills/worktree/scripts/setup-worktree.sh .worktrees/my-feature $(pwd)
```

**What it does:**
1. Copies `.env` from root (if exists)
2. Copies `apps/website/.env` (if exists)
3. Copies any other `apps/*/.env` files
4. Runs `pnpm install`

## Usage via Command

Use the `/worktree` command to create and set up a worktree automatically:

```
/worktree feature/my-branch
```

## Manual Worktree Commands

```bash
# List worktrees
git worktree list

# Remove a worktree
git worktree remove .worktrees/<branch-name>

# Prune stale worktrees
git worktree prune
```
