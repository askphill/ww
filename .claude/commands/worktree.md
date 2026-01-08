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

3. **Install dependencies** in the new worktree:
   ```bash
   cd .worktrees/<branch-name> && npm install
   ```

4. **Copy the .env file** from the main project to the worktree:
   ```bash
   cp .env .worktrees/<branch-name>/.env
   ```

5. **Confirm completion** and provide the path to the new worktree.

## Example Usage

```
/worktree feature/new-homepage
```

This creates:
- `.worktrees/feature/new-homepage/` - The worktree directory
- A new branch `feature/new-homepage` (or uses existing)
- Copies `.env` for local development

## Notes

- The `.worktrees/` directory should be in `.gitignore`
- Each worktree has its own `node_modules` after `npm install`
- You can work on multiple branches simultaneously with worktrees
