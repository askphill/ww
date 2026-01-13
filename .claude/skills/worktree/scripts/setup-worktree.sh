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

# Copy apps/website/.env if it exists (main env file for Hydrogen)
if [ -f "$MAIN_REPO_PATH/apps/website/.env" ]; then
  echo "Copying apps/website/.env..."
  mkdir -p "$WORKTREE_PATH/apps/website"
  cp "$MAIN_REPO_PATH/apps/website/.env" "$WORKTREE_PATH/apps/website/.env"
  echo "  ✓ Copied apps/website/.env"
fi

# Copy apps/website/.shopify directory if it exists (contains linked storefront info)
if [ -d "$MAIN_REPO_PATH/apps/website/.shopify" ]; then
  echo "Copying apps/website/.shopify/..."
  mkdir -p "$WORKTREE_PATH/apps/website/.shopify"
  cp -r "$MAIN_REPO_PATH/apps/website/.shopify/"* "$WORKTREE_PATH/apps/website/.shopify/"
  echo "  ✓ Copied apps/website/.shopify/"
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
