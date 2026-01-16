# Worktree Skill

Create a new git worktree for isolated development work.

## Arguments

- `$ARGUMENTS` - Branch name for the worktree (required)

## Instructions

When the user runs `/worktree <branch-name>`, perform these steps:

1. **Create the worktree directory** if it doesn't exist:

   ```bash
   mkdir -p .worktrees
   ```

2. **Add the git worktree** in `.worktrees/<branch-name>`:

   ```bash
   git worktree add .worktrees/<branch-name> -b <branch-name>
   ```

   If the branch already exists, use:

   ```bash
   git worktree add .worktrees/<branch-name> <branch-name>
   ```

3. **Run the setup script** to copy .env files and install dependencies:

   ```bash
   bash .claude/skills/worktree/scripts/setup-worktree.sh .worktrees/<branch-name> $(pwd)
   ```

   This script automatically:
   - Copies `.env` from the root (if exists)
   - Copies `apps/website/.env` (if exists)
   - Copies any other `apps/*/.env` files
   - Runs `pnpm install` in the worktree

4. **Confirm completion** and provide the path to the new worktree.

## Example Usage

```
/worktree feature/new-homepage
```

This creates:

- `.worktrees/feature/new-homepage/` - The worktree directory
- A new branch `feature/new-homepage` (or uses existing)
- Copies all `.env` files for local development
- Installs dependencies with pnpm

## Notes

- The `.worktrees/` directory should be in `.gitignore`
- Each worktree has its own `node_modules` after `pnpm install`
- You can work on multiple branches simultaneously with worktrees
- Environment files are copied from the main repo automatically
