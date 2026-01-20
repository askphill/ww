# Ralph PRD Converter Skill

Convert a markdown PRD into `backlog/backlog.json` format for the Ralph autonomous agent loop.

## Invocation

```
/ralph [path-to-prd.md]
```

Example:

```
/ralph tasks/prd-dark-mode.md
```

## Workflow

### Step 1: Read the PRD

Read the specified markdown PRD file and extract all user stories.

### Step 2: Check for Existing Work

If `backlog/backlog.json` exists and has a different branch name:

1. Archive the previous run to `archive/YYYY-MM-DD-[branch-name]/`
2. Move `backlog/backlog.json`, `backlog/progress.txt` to the archive

### Step 3: Generate backlog.json

Create `backlog/backlog.json` with this structure:

```json
{
  "branch": "ralph/[feature-name]",
  "description": "[Feature description from PRD]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [user], I want [action] so that [benefit]",
      "acceptance": ["[Criterion 1]", "[Criterion 2]", "Typecheck passes"],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

## Story Sizing Rules

Each story must be completable in ONE Ralph iteration (fresh Claude instance with no memory of previous work).

### Right-Sized Examples

- Add database column with migration
- Create single UI component
- Add one API endpoint
- Update form validation logic
- Add one filter or sort option

### Too-Large Examples (Split These)

- "Build entire dashboard" → Split into: schema, data queries, card component, list component, filters
- "Add authentication" → Split into: schema, login form, session logic, protected routes, logout
- "Implement dark mode" → Split into: theme variables, toggle component, persistence, apply to components

## Dependency Ordering

Stories execute sequentially by priority number. Order them so earlier stories don't depend on later ones:

1. Database/schema changes
2. Backend logic/API
3. Core UI components
4. Feature-specific UI
5. Polish and edge cases

## Acceptance Criteria Rules

Every criterion must be verifiable by the agent:

**Good:**

- "Column exists with default value 'pending'"
- "Button triggers confirmation dialog"
- "API returns 404 for missing resource"
- "Typecheck passes"

**Bad:**

- "Works correctly"
- "Is fast"
- "Handles edge cases"

### Required Criteria

All stories need:

- "Typecheck passes"

UI stories need:

- "Verify in browser using chrome-devtools MCP"

## Output Location

- `backlog/backlog.json` - Created in backlog folder
- `backlog/progress.txt` - Created when ralph.sh runs (append-only log)

## Example Conversion

Input PRD excerpt:

```markdown
US-001: Add priority column to database
As a developer, I want a priority column so data can be stored.

- Acceptance: Migration adds priority column
- Acceptance: Default is 'medium'
- Acceptance: Typecheck passes
```

Output JSON:

```json
{
  "id": "US-001",
  "title": "Add priority column to database",
  "description": "As a developer, I want a priority column so data can be stored.",
  "acceptance": [
    "Migration adds priority column with type enum ('high', 'medium', 'low')",
    "Default value is 'medium'",
    "Typecheck passes"
  ],
  "priority": 1,
  "passes": false,
  "notes": ""
}
```

## After Conversion

Tell the user to run:

```bash
./.claude/skills/ralph/scripts/ralph.sh 10
```
