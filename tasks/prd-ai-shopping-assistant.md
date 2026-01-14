# PRD: AI Shopping Assistant

## Introduction
An immersive, futuristic shopping experience that guides customers through personalized product recommendations. When activated, the page transforms into a fluid, brand-colored environment where a friendly assistant helps users discover the perfect Wakey routine through conversational questions about their lifestyle, needs, and preferences.

## Goals
- Create a memorable, differentiated shopping experience that feels futuristic yet warm
- Increase conversion by guiding undecided customers to the right products
- Collect valuable customer preference data for personalization
- Build email list through natural value exchange
- Enable customers to share their personalized routines as gifts

## User Stories

### Phase 1: Foundation & UI Shell

**US-001: Add AI assistant icon to @wakey/ui**
As a developer, I want a SparkleIcon component so that the AI assistant button has a distinctive, futuristic appearance.
- Acceptance: New `SparkleIcon` component in `packages/ui/src/icons/`
- Acceptance: Icon exported from `packages/ui/src/icons/index.ts`
- Acceptance: Icon uses `currentColor` for fill, accepts `className` prop
- Acceptance: Typecheck passes (`pnpm typecheck`)

**US-002: Add AI assistant button to header**
As a user, I want to see an AI button in the header so that I can access the shopping assistant.
- Acceptance: Button appears between menu and logo in header
- Acceptance: Uses `SparkleIcon` from US-001
- Acceptance: Button follows existing `HeaderButton` pattern (same sizing, hover effects)
- Acceptance: Clicking button triggers `onAssistantOpen` callback
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-003: Create full-screen overlay container**
As a user, I want the page to dissolve into an immersive background when I open the assistant so that I feel transported into a focused experience.
- Acceptance: New `AssistantOverlay` component in `apps/website/app/components/assistant/`
- Acceptance: Overlay covers full viewport with `fixed inset-0 z-40` (below header z-50)
- Acceptance: Background uses animated gradient with brand colors (black, sand, softorange, ocher, skyblue)
- Acceptance: Gradient has subtle blur/glow effect using CSS filters
- Acceptance: Page content fades out with 300ms transition when overlay opens
- Acceptance: Header remains visible and functional above overlay
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-004: Add overlay open/close state management**
As a user, I want smooth transitions when opening/closing the assistant so that the experience feels polished.
- Acceptance: Overlay animates in (fade + scale) over 400ms
- Acceptance: Pressing Escape closes overlay
- Acceptance: Close button (X) in top-right of overlay content area
- Acceptance: Body scroll locked when overlay is open
- Acceptance: Browser back button closes overlay without navigation
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### Phase 2: Conversation Flow Engine

**US-005: Create conversation state machine**
As a developer, I want a state machine to manage the conversation flow so that the assistant can guide users through questions predictably.
- Acceptance: New `useAssistantFlow` hook in `apps/website/app/hooks/`
- Acceptance: Hook manages current step, answers collected, and navigation history
- Acceptance: Supports `next()`, `back()`, and `reset()` actions
- Acceptance: Stores answers in a typed object (not localStorage yet)
- Acceptance: Typecheck passes (`pnpm typecheck`)

**US-006: Create conversation step definitions**
As a developer, I want step configurations defined so that the flow is data-driven and easy to modify.
- Acceptance: New `assistantSteps.ts` file in `apps/website/app/lib/`
- Acceptance: Each step has: id, type (text|choice|input), content, options (if choice)
- Acceptance: Steps include: welcome, interest-area, lifestyle, age-range, name-email, recommendation, summary
- Acceptance: Steps are typed with TypeScript
- Acceptance: Typecheck passes (`pnpm typecheck`)

**US-007: Create message bubble component**
As a user, I want to see assistant messages appear as chat bubbles so that the conversation feels natural.
- Acceptance: New `AssistantMessage` component
- Acceptance: Messages appear with typing indicator animation (3 dots) before text reveals
- Acceptance: Text reveals with fade-in after 800ms "typing" delay
- Acceptance: Bubbles have `bg-sand/90 text-black rounded-card` styling
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-008: Create choice card component**
As a user, I want to select options from visual cards so that choices feel interactive and clear.
- Acceptance: New `AssistantChoiceCard` component
- Acceptance: Cards show option label and optional description
- Acceptance: Cards have hover state with scale transform
- Acceptance: Selected card shows visual indicator (border or background change)
- Acceptance: Cards animate in sequentially (staggered 100ms)
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-009: Create text input step component**
As a user, I want to enter my name and email so that I can receive my personalized routine.
- Acceptance: New `AssistantInput` component for text/email inputs
- Acceptance: Input has floating label pattern
- Acceptance: Email field has basic validation (shows error if invalid format)
- Acceptance: Submit button disabled until valid input
- Acceptance: Inputs styled consistently with brand (sand background, black text)
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-010: Implement back navigation**
As a user, I want to go back to previous questions so that I can change my answers.
- Acceptance: Back arrow button visible on all steps except welcome
- Acceptance: Clicking back returns to previous step with previous answer pre-selected
- Acceptance: Back button positioned top-left of conversation area
- Acceptance: Smooth transition when navigating back
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### Phase 3: Question Flow Content

**US-011: Implement welcome step**
As a user, I want to see a warm welcome message so that I understand what the assistant offers.
- Acceptance: Welcome message: "Hey there, welcome to Wakey! I'm here to help you discover your perfect morning routine. Ready to find products that match your lifestyle?"
- Acceptance: Single "Let's go" button to proceed
- Acceptance: Wakey logo or sparkle animation accompanies message
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-012: Implement interest area step**
As a user, I want to tell the assistant what I'm interested in so that recommendations are relevant.
- Acceptance: Question: "What brings you to Wakey today?"
- Acceptance: Options: "Deodorant that actually works", "Building a morning routine", "Just exploring"
- Acceptance: Each option has a brief description
- Acceptance: Selection advances to next step
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-013: Implement lifestyle step**
As a user, I want to share my lifestyle so that product recommendations fit my daily reality.
- Acceptance: Question: "Tell me a bit about your daily life"
- Acceptance: Options: "Active & athletic", "Busy professional", "Parent life", "Student vibes"
- Acceptance: Multi-select allowed (user can pick multiple)
- Acceptance: "Next" button appears after at least one selection
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-014: Implement age range step**
As a user, I want to share my age range so that recommendations suit my needs.
- Acceptance: Question: "What age range are you in?"
- Acceptance: Options: "18-25", "26-35", "36-50", "50+"
- Acceptance: Single select with immediate advancement
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-015: Implement name and email step**
As a user, I want to provide my details so that I can save and share my routine.
- Acceptance: Message: "Almost there! What should I call you?"
- Acceptance: Name input field (required)
- Acceptance: Email input field (required, validated)
- Acceptance: "See my routine" button to proceed
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### Phase 4: Product Recommendation

**US-016: Create recommendation logic**
As a developer, I want logic that maps answers to product recommendations so that users get personalized results.
- Acceptance: New `getRecommendation` function in `apps/website/app/lib/`
- Acceptance: Function takes answers object, returns recommended product handle(s)
- Acceptance: For MVP: always returns "deodorant" with quantity based on lifestyle
- Acceptance: Returns discount percentage based on set size (5% for 1, 10% for 2, 15% for 3+)
- Acceptance: Typecheck passes (`pnpm typecheck`)

**US-017: Implement recommendation display step**
As a user, I want to see my personalized product recommendation so that I can add it to cart.
- Acceptance: Shows personalized message: "Based on your [lifestyle], here's your perfect Wakey routine, [name]!"
- Acceptance: Displays recommended product(s) with image, title, and price
- Acceptance: Shows original price crossed out with discounted price
- Acceptance: Discount badge shows percentage saved
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-018: Add recommended set to cart**
As a user, I want to add my recommended set to cart so that I can purchase it.
- Acceptance: "Add to bag" button on recommendation step
- Acceptance: Clicking adds product(s) with correct quantity to cart
- Acceptance: Button shows loading state during add
- Acceptance: Success confirmation appears after adding
- Acceptance: Discount code automatically applied (or included in cart note)
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### Phase 5: Save & Share

**US-019: Create routine summary view**
As a user, I want to see a summary of my routine so that I can review before sharing.
- Acceptance: Summary shows: user name, selected preferences, recommended products
- Acceptance: Displays as a "routine card" with brand styling
- Acceptance: Shows personalized routine name: "[Name]'s Morning Ritual"
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-020: Save routine to user profile**
As a developer, I want to persist routine data so that returning users see their preferences.
- Acceptance: Routine data saved to localStorage with key `wakey_routine`
- Acceptance: Data includes: name, email, answers, recommendedProducts, createdAt
- Acceptance: Also creates/updates Shopify customer if logged in (future consideration)
- Acceptance: Typecheck passes (`pnpm typecheck`)

**US-021: Send routine via email**
As a user, I want to email my routine to myself or someone else so that I can save or gift it.
- Acceptance: "Send routine" button on summary step
- Acceptance: Modal to enter recipient email (defaults to user's email)
- Acceptance: Optional personal message field
- Acceptance: Calls API route to send email
- Acceptance: Success/error feedback after sending
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-022: Create shareable routine link**
As a user, I want to copy a link to my routine so that I can share it on social or messaging apps.
- Acceptance: "Copy link" button on summary step
- Acceptance: Generates unique URL: `/routine/[encoded-id]`
- Acceptance: Link copies to clipboard with toast confirmation
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-023: Create shared routine page**
As a visitor, I want to view a shared routine so that I can see what was recommended.
- Acceptance: New route at `apps/website/app/routes/routine.$id.tsx`
- Acceptance: Decodes routine from URL parameter
- Acceptance: Displays routine card with products and "Get this routine" CTA
- Acceptance: "Get this routine" adds products to cart with discount
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

### Phase 6: Polish & Analytics

**US-024: Add conversation animations**
As a user, I want smooth animations throughout so that the experience feels premium.
- Acceptance: Messages slide up and fade in
- Acceptance: Choice cards stagger in from bottom
- Acceptance: Step transitions have crossfade effect
- Acceptance: Background gradient subtly animates (slow color shift)
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-025: Add progress indicator**
As a user, I want to see my progress so that I know how many steps remain.
- Acceptance: Progress dots or bar at top of conversation area
- Acceptance: Current step highlighted
- Acceptance: Completed steps shown differently from upcoming
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

**US-026: Track assistant analytics**
As a business owner, I want to track assistant usage so that I can measure its effectiveness.
- Acceptance: Track event: "assistant_opened"
- Acceptance: Track event: "assistant_step_completed" with step name
- Acceptance: Track event: "assistant_add_to_cart" with product and discount
- Acceptance: Track event: "assistant_routine_shared"
- Acceptance: Events sent to existing analytics setup (if any)
- Acceptance: Typecheck passes (`pnpm typecheck`)

## Non-Goals
- Real AI/LLM integration (this is visual flow only, no Claude API)
- Product recommendations beyond deodorant (MVP is single product)
- User accounts or login requirements
- Integration with Shopify customer accounts (future enhancement)
- A/B testing of question flows
- Multiple language support

## Design Considerations

### Visual Design
- **Background**: Animated mesh gradient using brand colors (black base with sand, softorange, ocher, skyblue flowing through)
- **Blur effect**: Subtle Gaussian blur (8-12px) on gradient edges
- **Typography**: `font-display` for assistant messages, `font-body` for user inputs
- **Spacing**: Generous padding, centered content area max-width ~600px
- **Cards**: `rounded-card` with `bg-sand/90` for glass-morphism effect

### Animations
- Message typing indicator: 3 bouncing dots
- Card entrance: fade-up with 100ms stagger
- Step transition: 300ms crossfade
- Background: 30-second slow gradient animation loop

### Accessibility
- All interactive elements keyboard accessible
- Focus management when steps change
- Screen reader announcements for new messages
- Sufficient color contrast on gradient background
- Reduced motion support via `prefers-reduced-motion`

## Technical Considerations

### State Management
- Use React `useReducer` for conversation state
- Store answers in typed object, persist to localStorage
- No external state library needed

### Routing
- Overlay does not change URL (uses state, not route)
- Shared routine page is a real route (`/routine/:id`)
- Routine ID is base64-encoded JSON (simple, no database needed for MVP)

### Email Sending
- Create API route that uses a transactional email service
- Consider: Resend, SendGrid, or Shopify's built-in email (via Admin API)
- Template should be simple HTML with routine details

### Discount Implementation
- Generate unique discount code via Shopify Admin API
- Or use cart attributes to track AI-recommended discount (apply at checkout via Shopify Scripts if on Plus)
- MVP: Use fixed discount code "WAKEY-ROUTINE" with tiered percentage

## Success Metrics
- **Engagement**: % of visitors who open the assistant
- **Completion**: % of openers who reach recommendation step
- **Conversion**: % of completers who add to cart
- **Share rate**: % of completers who share their routine
- **Email capture**: New emails collected through assistant

## Open Questions
1. Which email service should we use for sending routine emails?
2. Should the discount code be unique per user or a fixed code?
3. Do we want to save routine data to Shopify customer metafields for logged-in users?
4. Should the assistant button have a pulsing/attention-grabbing animation initially?
5. What happens if user is on mobile with limited screen space?

## Question Flow Summary

```
[Welcome] → [Interest Area] → [Lifestyle] → [Age Range] → [Name/Email] → [Recommendation] → [Summary/Share]
```

### Step Details

| Step | Type | Question | Options |
|------|------|----------|---------|
| Welcome | text | "Hey there, welcome to Wakey!..." | "Let's go" button |
| Interest | choice | "What brings you to Wakey today?" | Deodorant / Routine / Exploring |
| Lifestyle | multi-choice | "Tell me about your daily life" | Active / Professional / Parent / Student |
| Age | choice | "What age range are you in?" | 18-25 / 26-35 / 36-50 / 50+ |
| Contact | input | "What should I call you?" | Name + Email fields |
| Recommendation | display | "Here's your perfect routine, [name]!" | Product cards + Add to cart |
| Summary | display | "[Name]'s Morning Ritual" | Share / Copy link / Email |
