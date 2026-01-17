#!/bin/bash
set -e

# Setup script for git worktrees
# Copies .env files and installs dependencies

WORKTREE_PATH="$1"
MAIN_REPO_PATH="$2"

if [ -z "$WORKTREE_PATH" ] || [ -z "$MAIN_REPO_PATH" ]; then
  echo "Usage: setup-worktree.sh <worktree-path> <main-repo-path>"
  echo ""
  echo "Example: setup-worktree.sh .worktrees/feature-branch /Users/bd/Documents/GitHub/ww"
  exit 1
fi

if [ ! -d "$WORKTREE_PATH" ]; then
  echo "Error: Worktree directory not found: $WORKTREE_PATH"
  exit 1
fi

echo "Setting up worktree: $WORKTREE_PATH"
echo ""

# Copy root .env if it exists
if [ -f "$MAIN_REPO_PATH/.env" ]; then
  echo "Copying root .env..."
  cp "$MAIN_REPO_PATH/.env" "$WORKTREE_PATH/.env"
  echo "  ✓ Copied .env to $WORKTREE_PATH/.env"
fi

# Copy apps/website/.env if it exists
if [ -f "$MAIN_REPO_PATH/apps/website/.env" ]; then
  echo "Copying apps/website/.env..."
  mkdir -p "$WORKTREE_PATH/apps/website"
  cp "$MAIN_REPO_PATH/apps/website/.env" "$WORKTREE_PATH/apps/website/.env"
  echo "  ✓ Copied apps/website/.env"
fi

# Copy any other app .env files that exist
for env_file in "$MAIN_REPO_PATH"/apps/*/.env; do
  if [ -f "$env_file" ]; then
    app_name=$(basename "$(dirname "$env_file")")
    if [ "$app_name" != "website" ]; then
      echo "Copying apps/$app_name/.env..."
      mkdir -p "$WORKTREE_PATH/apps/$app_name"
      cp "$env_file" "$WORKTREE_PATH/apps/$app_name/.env"
      echo "  ✓ Copied apps/$app_name/.env"
    fi
  fi
done

# Copy .dev.vars files (used by Cloudflare Workers/Wrangler)
for dev_vars_file in "$MAIN_REPO_PATH"/apps/*/.dev.vars; do
  if [ -f "$dev_vars_file" ]; then
    app_name=$(basename "$(dirname "$dev_vars_file")")
    echo "Copying apps/$app_name/.dev.vars..."
    mkdir -p "$WORKTREE_PATH/apps/$app_name"
    cp "$dev_vars_file" "$WORKTREE_PATH/apps/$app_name/.dev.vars"
    echo "  ✓ Copied apps/$app_name/.dev.vars"
  fi
done

echo ""

# Install dependencies
echo "Installing dependencies with pnpm..."
cd "$WORKTREE_PATH"
pnpm install

echo ""
echo "✓ Worktree setup complete!"
echo ""
echo "Worktree path: $WORKTREE_PATH"
echo "To start development: cd $WORKTREE_PATH && pnpm dev"
