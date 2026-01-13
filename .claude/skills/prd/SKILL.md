# PRD Generator Skill

Generate detailed Product Requirements Documents for features. Output is structured for implementation by developers or AI agents.

## Invocation
```
/prd [feature description]
```

## Workflow

### Step 1: Gather Requirements
Ask 3-5 clarifying questions to understand:
- What problem does this solve?
- Who is the target user?
- What are the core features vs nice-to-haves?
- What are the success criteria?
- Any technical constraints or preferences?

Format questions with lettered options (A-D) for quick responses:
```
1. What's the primary use case?
   A) Admin dashboard feature
   B) Customer-facing feature
   C) Developer tooling
   D) Other (please specify)
```

### Step 2: Generate PRD
Create a markdown file at `tasks/prd-[feature-name].md` with these sections:

```markdown
# PRD: [Feature Name]

## Introduction
Brief overview of the feature and why it's needed.

## Goals
- Primary goal
- Secondary goals

## User Stories
US-001: As a [user type], I want [action] so that [benefit]
- Acceptance: [Specific, verifiable criterion]
- Acceptance: [Another criterion]

US-002: ...

## Functional Requirements
- FR-001: [Requirement]
- FR-002: [Requirement]

## Non-Goals
What this feature explicitly does NOT include.

## Design Considerations
UI/UX notes, accessibility requirements.

## Technical Considerations
Architecture notes, dependencies, constraints.

## Success Metrics
How we'll measure if this feature is successful.

## Open Questions
Unresolved items that need answers.
```

## User Story Guidelines

### Right-Sized Stories
Each story must be completable in a single Claude iteration (~15-30 min of work).

Good examples:
- Add a database column with default value
- Create a UI component with specific props
- Add an API endpoint with defined inputs/outputs
- Update a form with new field validation

Bad examples (too large):
- "Build the entire settings page"
- "Implement user authentication"
- "Add dark mode" (should be split into theme setup, toggle component, persistence, etc.)

### Verifiable Acceptance Criteria
Every criterion must be checkable, not vague.

Good:
- "Button displays confirmation dialog before deleting"
- "Form shows error message when email is invalid"
- "API returns 404 when product not found"

Bad:
- "Works correctly"
- "Handles edge cases"
- "Is performant"

### Required Criteria
All stories should include:
- "Typecheck passes (`pnpm typecheck`)"

UI stories must include:
- "Verify in browser using chrome-devtools MCP"

Logic-heavy stories should include:
- "Tests pass (`pnpm test`)" (if tests exist)

## Example Output

```markdown
# PRD: Add Priority Levels to Tasks

## Introduction
Users need to prioritize their tasks to focus on what's most important. This feature adds priority levels (high, medium, low) to task items.

## Goals
- Allow users to set priority on tasks
- Visually distinguish priority levels
- Filter tasks by priority

## User Stories

US-001: Add priority column to database
As a developer, I want a priority column in the tasks table so that priority data can be stored.
- Acceptance: Migration adds `priority` column with type enum ('high', 'medium', 'low')
- Acceptance: Default value is 'medium'
- Acceptance: Typecheck passes

US-002: Display priority badges on task cards
As a user, I want to see colored badges showing task priority so that I can quickly identify important tasks.
- Acceptance: High priority shows red badge
- Acceptance: Medium priority shows yellow badge
- Acceptance: Low priority shows gray badge
- Acceptance: Badge is visible without hovering
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

US-003: Add priority selector to task edit form
As a user, I want to change task priority in the edit modal so that I can update priorities as needed.
- Acceptance: Dropdown shows all three priority options
- Acceptance: Selecting option updates task immediately
- Acceptance: Current priority is pre-selected
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

## Non-Goals
- Priority-based task sorting (future feature)
- Custom priority levels
- Priority notifications

## Technical Considerations
- Use existing dropdown component from @wakey/ui
- Follow existing form patterns in the codebase
```

## Notes
- Use kebab-case for filenames: `prd-dark-mode.md`, `prd-user-settings.md`
- Keep stories ordered by dependency (database first, then backend, then UI)
- If a feature is too large, suggest splitting into multiple PRDs
