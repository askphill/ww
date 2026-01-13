# PRD: Navigation Redesign with Announcement Bar

## Introduction
Redesign the navigation experience to feel more integrated with the header. Add an announcement bar below the header for promotional messaging, and change the mobile menu from a side drawer to a dropdown panel that slides down from under the header. Both elements should feel like cohesive parts of the header system.

## Goals
- Create a unified header + navigation experience
- Add promotional announcement capability with marquee scrolling text
- Improve navigation discoverability with clearer Shop/Learn categories
- Maintain design system consistency across all new components

## User Stories

### US-001: Create AnnouncementBar component
As a user, I want to see promotional messages below the header so that I'm aware of current offers.

**Implementation notes:**
- Create `apps/website/app/components/AnnouncementBar.tsx`
- Same horizontal padding as header (`px-4` mobile, `md:px-6` desktop)
- Same max-width as header (`max-w-[600px]`)
- Use `rounded-card` for border radius
- Background: `bg-ocher` (#E3B012)
- Text: `text-black font-display text-small`
- Gap between header and bar: `mt-2`
- Hardcoded text prop for now

**Acceptance criteria:**
- Bar appears below header with matching width and padding
- Uses `rounded-card` border radius
- Background is ocher, text is black
- Centered horizontally like header
- Typecheck passes (`pnpm typecheck`)
- Verify in browser using chrome-devtools MCP

---

### US-002: Add marquee animation to AnnouncementBar
As a user, I want the announcement text to scroll continuously so that longer messages fit and create visual interest.

**Implementation notes:**
- Use CSS animation for infinite horizontal scroll
- Duplicate text content to create seamless loop
- Use existing `@keyframes marquee` from theme (30s linear infinite)
- Hide overflow on container
- Text should scroll left continuously

**Acceptance criteria:**
- Text scrolls smoothly from right to left
- Animation loops seamlessly without jumps
- Works on both mobile and desktop
- Typecheck passes (`pnpm typecheck`)
- Verify in browser using chrome-devtools MCP

---

### US-003: Create NavigationDropdown component structure
As a user, I want to see a clean navigation panel when I tap the menu button so that I can browse products and learn more about Wakey.

**Implementation notes:**
- Create `apps/website/app/components/NavigationDropdown.tsx`
- Two columns/sections: "Shop" and "Learn"
- Shop items (shown immediately, no click needed):
  - Wakey Deodorant → `/products/deodorant`
  - Natural Deodorant → `/products/natural-deodorant`
- Learn items (shown immediately):
  - About us → `/about`
  - FAQ → `/faq`
  - Blog → `/blog`
- Section labels: `text-body-small font-display uppercase tracking-wide text-black/60`
- Nav links: `text-h3 font-display` with hover translate effect
- Background: `bg-sand`
- Same padding as header (`px-4` mobile, `md:px-6` desktop)
- Use `rounded-card` border radius

**Acceptance criteria:**
- Component renders Shop and Learn sections
- All links are visible immediately (no accordion)
- Uses design system typography (text-h3 for links, text-body-small for labels)
- Background is sand color
- Typecheck passes (`pnpm typecheck`)

---

### US-004: Position NavigationDropdown below header
As a user, I want the navigation to appear directly under the header so that it feels like part of the same element.

**Implementation notes:**
- Position dropdown in same container/wrapper as header
- Dropdown appears directly below header with small gap (`mt-2`)
- Same max-width as header (`max-w-[600px]`)
- Centered horizontally to align with header
- When open, dropdown overlays the announcement bar (higher z-index)
- Dropdown z-index should be between header and announcement bar

**Acceptance criteria:**
- Dropdown aligns perfectly with header edges
- Small gap between header and dropdown
- Dropdown covers announcement bar when open
- Maintains centered position
- Typecheck passes (`pnpm typecheck`)
- Verify in browser using chrome-devtools MCP

---

### US-005: Add slide-down animation to NavigationDropdown
As a user, I want the menu to slide down smoothly so that it feels natural and connected to the header.

**Implementation notes:**
- Initial state: `opacity-0 -translate-y-4 scale-y-0` with `origin-top`
- Open state: `opacity-100 translate-y-0 scale-y-100`
- Use `ease-out-expo` easing (existing CSS variable)
- Duration: 300-400ms
- Content should push page content down (not overlay)
- Animate height or use transform for smooth effect

**Acceptance criteria:**
- Menu slides down from under header
- Animation is smooth with no jank
- Page content moves down when menu opens
- Uses existing ease-out-expo easing
- Typecheck passes (`pnpm typecheck`)
- Verify in browser using chrome-devtools MCP

---

### US-006: Implement menu toggle behavior
As a user, I want to open and close the menu with the hamburger button so that I can access navigation when needed.

**Implementation notes:**
- Track open/closed state in Header component or parent
- Hamburger icon toggles menu state on click
- When menu is open, consider changing icon to CrossIcon (optional)
- Pass `isOpen` and `onToggle` props to NavigationDropdown

**Acceptance criteria:**
- Clicking hamburger opens closed menu
- Clicking hamburger again closes open menu
- State is properly managed
- Typecheck passes (`pnpm typecheck`)
- Verify in browser using chrome-devtools MCP

---

### US-007: Implement click-outside-to-close behavior
As a user, I want the menu to close when I click outside it so that I can easily dismiss it.

**Implementation notes:**
- Add click handler on backdrop/overlay or document
- Detect clicks outside header + dropdown container
- Close menu when outside click detected
- Don't close when clicking inside menu or header

**Acceptance criteria:**
- Clicking outside menu area closes it
- Clicking inside menu does not close it
- Clicking on nav links closes menu (after navigation)
- Typecheck passes (`pnpm typecheck`)
- Verify in browser using chrome-devtools MCP

---

### US-008: Remove old Aside mobile menu component
As a developer, I want to remove the old side-drawer menu so that the codebase is clean and there's only one navigation pattern.

**Implementation notes:**
- Remove `MobileMenuAside` from `PageLayout.tsx`
- Remove mobile menu type from `Aside.tsx` if no longer needed
- Update any references to old mobile menu
- Keep cart aside functionality (different component)

**Acceptance criteria:**
- Old side drawer menu code is removed
- Cart drawer still works
- No TypeScript errors
- Typecheck passes (`pnpm typecheck`)
- Verify in browser that old menu doesn't appear

---

### US-009: Integrate AnnouncementBar into PageLayout
As a user, I want to see the announcement bar on all pages so that I always see current promotions.

**Implementation notes:**
- Add AnnouncementBar to `PageLayout.tsx`
- Position after header, before main content
- Pass announcement text as prop or hardcode initially
- Example text: "Free shipping on orders over €50"

**Acceptance criteria:**
- Announcement bar visible on all pages
- Positioned correctly below header
- Does not interfere with page content
- Typecheck passes (`pnpm typecheck`)
- Verify in browser using chrome-devtools MCP

---

### US-010: Handle body scroll when menu is open
As a user, I want the page to not scroll when the menu is open so that I can focus on navigation.

**Implementation notes:**
- When menu opens, add `overflow-hidden` to body
- When menu closes, remove overflow restriction
- Use effect cleanup to ensure scroll is restored
- Consider existing pattern from Aside component

**Acceptance criteria:**
- Body scroll is locked when menu is open
- Scroll is restored when menu closes
- Works correctly on navigation (scroll restored)
- Typecheck passes (`pnpm typecheck`)

---

## Non-Goals
- Shopify metafield configuration for announcement text (hardcoded for now)
- Multiple rotating announcement messages
- Different navigation on desktop vs mobile (same pattern for both)
- Animation/transition for announcement bar itself
- Search functionality in navigation

## Design Considerations
- All new components must use existing design system tokens
- Typography: `text-h3` for nav links, `text-body-small` for labels, `text-small` for announcement
- Colors: `bg-sand` for dropdown, `bg-ocher` for announcement bar
- Spacing: Match header padding (`px-4`/`md:px-6`)
- Border radius: Use `rounded-card` utility everywhere
- Animations: Use existing `ease-out-expo` easing

## Technical Considerations
- NavigationDropdown should be a controlled component (receives isOpen prop)
- Consider using React Portal if z-index stacking becomes complex
- Reuse existing CrossIcon, HamburgerIcon from @wakey/ui
- Follow existing hover patterns (`transition-transform duration-300 md:hover:translate-x-1`)

## Success Metrics
- Navigation feels integrated with header (not a separate drawer)
- Announcement bar is visible and readable
- Menu opens/closes smoothly without layout shifts
- All interactions work on mobile and desktop

## Open Questions
- None - requirements are clear
