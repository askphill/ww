# PRD: Notification Center

## Introduction

Customers landing on the website should be aware of new happenings—new product launches, blog posts, or announcements. A notification center next to the cart icon will display a subtle dot indicator when there's something new, with a dropdown panel (similar to the navigation menu) showing the notifications.

## Goals

- Alert customers to new content (products, blog posts) without being intrusive
- Drive engagement with new products and content
- Follow existing UI patterns (NavigationDropdown style)
- Use manual MDX-based content for full control over notifications

## User Stories

### US-001: Create NotificationIcon component

As a developer, I want a bell/notification icon in the shared UI package so that it matches the existing icon pack style.

- Acceptance: Icon added at `packages/ui/src/icons/NotificationIcon.tsx`
- Acceptance: Icon exported from `packages/ui/src/icons/index.ts`
- Acceptance: Icon follows same props pattern as `BagIcon` (className, size, etc.)
- Acceptance: Typecheck passes (`pnpm typecheck`)

### US-002: Create notifications MDX content file

As a content editor, I want an MDX file to define notifications so that I can manually control what notifications appear.

- Acceptance: File created at `apps/website/app/content/notifications.mdx`
- Acceptance: Exports a `notifications` array with structure: `{ id, type, title, description, href, date }`
- Acceptance: Type can be `'product'` or `'blog'`
- Acceptance: Contains 2-3 example notifications
- Acceptance: Typecheck passes (`pnpm typecheck`)

### US-003: Create API route for notifications

As a developer, I want an API endpoint that returns the notifications list so that the dropdown can fetch data dynamically.

- Acceptance: Route created at `apps/website/app/routes/api.notifications.tsx`
- Acceptance: Returns JSON array of notifications from the MDX content
- Acceptance: Each notification includes: id, type, title, description, href, date
- Acceptance: Typecheck passes (`pnpm typecheck`)

### US-004: Create NotificationDropdown component

As a developer, I want a dropdown panel component that displays notifications so that users can see what's new.

- Acceptance: Component created at `apps/website/app/components/NotificationDropdown.tsx`
- Acceptance: Matches NavigationDropdown animation pattern (grid-template-rows transition)
- Acceptance: Shows list of notifications with title, description, and type indicator
- Acceptance: Each notification links to the relevant page (product or blog post)
- Acceptance: Clicking a notification calls `onClose` and marks it as read
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### US-005: Create useNotifications hook with localStorage

As a developer, I want a hook to manage notification read state so that users don't see the badge after viewing notifications.

- Acceptance: Hook created at `apps/website/app/hooks/useNotifications.ts`
- Acceptance: Fetches notifications from `/api/notifications`
- Acceptance: Tracks read notification IDs in localStorage (key: `wakey-read-notifications`)
- Acceptance: Exposes: `notifications`, `unreadCount`, `hasUnread`, `markAsRead`, `markAllAsRead`
- Acceptance: `hasUnread` returns true if any notification ID is not in localStorage
- Acceptance: Typecheck passes (`pnpm typecheck`)

### US-006: Add notification icon with badge to Header

As a user, I want to see a notification icon next to the cart so that I know there's something new to check.

- Acceptance: NotificationIcon added to Header component next to cart/bag icon
- Acceptance: Dot badge appears when `hasUnread` is true (positioned top-right of icon)
- Acceptance: Badge uses `bg-softorange` color for visibility
- Acceptance: Clicking icon toggles NotificationDropdown open/closed
- Acceptance: Only one dropdown can be open at a time (nav or notifications)
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### US-007: Add close-on-outside-click behavior

As a user, I want the notification dropdown to close when I click outside so that I can dismiss it easily.

- Acceptance: Clicking outside the dropdown closes it
- Acceptance: Clicking the notification icon when open closes it
- Acceptance: Pressing Escape key closes the dropdown
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### US-008: Style notification items with type indicators

As a user, I want to visually distinguish product vs blog notifications so that I know what type of content is new.

- Acceptance: Product notifications show a small product icon or "New Product" label
- Acceptance: Blog notifications show a small article icon or "New Post" label
- Acceptance: Unread notifications have a subtle highlight or dot indicator
- Acceptance: Read notifications appear slightly dimmed
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

## Non-Goals

- Automatic notifications from Shopify webhooks (future feature)
- Push notifications or email notifications
- Customer account-based notification storage
- Notification expiration/archival
- Admin UI for managing notifications (manual MDX editing only)

## Design Considerations

- Icon placement: Right side of header, between nav toggle and cart icon
- Badge: Small dot (not a number), using `softorange` color for visibility on dark header
- Dropdown: Same width and animation as NavigationDropdown (~600px max, centered)
- Mobile: Full-width dropdown below header, same as nav menu
- Accessibility: Proper ARIA labels, keyboard navigation, focus management

## Technical Considerations

### Component Structure
```
packages/ui/src/icons/NotificationIcon.tsx    # New icon
apps/website/app/
├── content/notifications.mdx                  # MDX notification data
├── routes/api.notifications.tsx               # API endpoint
├── hooks/useNotifications.ts                  # State management hook
└── components/NotificationDropdown.tsx        # Dropdown UI
```

### MDX Content Format
```typescript
// notifications.mdx exports
export const notifications = [
  {
    id: 'deodorant-launch-2025',
    type: 'product',
    title: 'New Deodorant Launched',
    description: 'Our mighty citrus deodorant is now available',
    href: '/products/deodorant',
    date: '2025-01-10',
  },
  {
    id: 'sustainability-blog',
    type: 'blog',
    title: 'Our Sustainability Journey',
    description: 'Learn about our eco-friendly packaging',
    href: '/blog/sustainability',
    date: '2025-01-08',
  },
];
```

### localStorage Schema
```typescript
// Key: 'wakey-read-notifications'
// Value: JSON array of notification IDs
['deodorant-launch-2025', 'sustainability-blog']
```

### Dependencies
- Existing: NavigationDropdown pattern, icon components, Header component
- New: NotificationIcon from Centralicons pack

## Success Metrics

- Notification icon displays correctly with badge
- Dropdown opens/closes smoothly matching nav dropdown behavior
- Read state persists across page refreshes
- Badge disappears after user views notifications
- No impact on Core Web Vitals (lazy load notifications data)

## Open Questions

1. Should notifications auto-mark as read when dropdown opens, or require clicking each one?
   - **Recommendation**: Mark all as read when dropdown closes (simpler UX)

2. How many notifications should we show at once?
   - **Recommendation**: Show all (MDX will be manually curated, unlikely to exceed 5-10)

3. Should there be a "View all" link to a dedicated page?
   - **Recommendation**: Not for v1, keep it simple with just the dropdown
