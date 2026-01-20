#!/bin/bash
# Ralph - Autonomous AI Agent Loop for Claude Code
# Spawns fresh Claude instances until all PRD stories are complete

set -e

# Configuration
MAX_ITERATIONS="${1:-10}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
PROMPT_FILE="$SCRIPT_DIR/../prompt.md"
BACKLOG_DIR="$PROJECT_ROOT/backlog"
BACKLOG_FILE="$BACKLOG_DIR/backlog.json"
PROGRESS_FILE="$BACKLOG_DIR/progress.txt"
BRANCH_FILE="$PROJECT_ROOT/.last-ralph-branch"
ARCHIVE_DIR="$PROJECT_ROOT/archive"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[ralph]${NC} $1"
}

error() {
    echo -e "${RED}[ralph]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[ralph]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[ralph]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    if ! command -v claude &> /dev/null; then
        error "Claude CLI not found. Install it with: npm install -g @anthropic-ai/claude-code"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        error "jq not found. Install it with: brew install jq"
        exit 1
    fi

    if [ ! -f "$BACKLOG_FILE" ]; then
        error "backlog.json not found at $BACKLOG_FILE"
        error "Generate one with: claude \"/ralph tasks/prd-[feature].md\""
        exit 1
    fi

    if [ ! -f "$PROMPT_FILE" ]; then
        error "prompt.md not found at $PROMPT_FILE"
        exit 1
    fi
}

# Archive previous run if branch changed
archive_if_needed() {
    local current_branch
    current_branch=$(jq -r '.branch' "$BACKLOG_FILE")

    if [ -f "$BRANCH_FILE" ]; then
        local last_branch
        last_branch=$(cat "$BRANCH_FILE")

        if [ "$last_branch" != "$current_branch" ] && [ -f "$PROGRESS_FILE" ]; then
            local archive_name
            archive_name="$(date +%Y-%m-%d)-${last_branch//\//-}"
            local archive_path="$ARCHIVE_DIR/$archive_name"

            log "Archiving previous run to $archive_path"
            mkdir -p "$archive_path"

            [ -f "$BACKLOG_FILE" ] && cp "$BACKLOG_FILE" "$archive_path/"
            [ -f "$PROGRESS_FILE" ] && mv "$PROGRESS_FILE" "$archive_path/"
        fi
    fi

    echo "$current_branch" > "$BRANCH_FILE"
}

# Initialize progress file
init_progress() {
    mkdir -p "$BACKLOG_DIR"
    if [ ! -f "$PROGRESS_FILE" ]; then
        log "Creating backlog/progress.txt"
        cat > "$PROGRESS_FILE" << 'EOF'
# Ralph Progress Log

## Codebase Patterns
<!-- Ralph will add discovered patterns here -->

---

## Iterations

EOF
    fi
}

# Check if all stories are complete
all_stories_complete() {
    local incomplete
    incomplete=$(jq '[.userStories[] | select(.passes == false)] | length' "$BACKLOG_FILE")
    [ "$incomplete" -eq 0 ]
}

# Get summary of story status
get_status_summary() {
    local total passed
    total=$(jq '.userStories | length' "$BACKLOG_FILE")
    passed=$(jq '[.userStories[] | select(.passes == true)] | length' "$BACKLOG_FILE")
    echo "$passed/$total stories complete"
}

# Run a single iteration
run_iteration() {
    local iteration=$1
    local prompt
    prompt=$(cat "$PROMPT_FILE")

    log "Starting iteration $iteration/$MAX_ITERATIONS ($(get_status_summary))"

    # Create a temp file to capture output
    local output_file
    output_file=$(mktemp)

    # Run Claude with the prompt, piping to tee for real-time output
    # --dangerously-skip-permissions bypasses permission prompts for autonomous operation
    if echo "$prompt" | claude --print --dangerously-skip-permissions 2>&1 | tee "$output_file"; then
        # Check for completion signal
        if grep -q "<promise>COMPLETE</promise>" "$output_file"; then
            rm "$output_file"
            return 0  # All done
        fi
    else
        warn "Claude exited with non-zero status"
    fi

    rm "$output_file"
    return 1  # Continue iterating
}

# Main loop
main() {
    log "Ralph - Autonomous Agent Loop"
    log "Max iterations: $MAX_ITERATIONS"
    log "Project root: $PROJECT_ROOT"
    echo ""

    check_prerequisites
    archive_if_needed
    init_progress

    # Check if already complete
    if all_stories_complete; then
        success "All stories already complete!"
        exit 0
    fi

    local iteration=1
    while [ $iteration -le $MAX_ITERATIONS ]; do
        echo ""
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        if run_iteration $iteration; then
            success "All stories complete!"
            exit 0
        fi

        # Check if complete after iteration
        if all_stories_complete; then
            success "All stories complete!"
            exit 0
        fi

        iteration=$((iteration + 1))

        if [ $iteration -le $MAX_ITERATIONS ]; then
            log "Waiting 2 seconds before next iteration..."
            sleep 2
        fi
    done

    error "Reached maximum iterations ($MAX_ITERATIONS) without completing all stories"
    warn "Status: $(get_status_summary)"
    warn "Run again with: $0 $MAX_ITERATIONS"
    exit 1
}

main
