# PRD: Checkout Experience Improvements

## Introduction
Improve the checkout experience by adding an "Added to Bag" popup notification when items are added to cart, redesigning the cart page to match Polaroid's clean layout, and streamlining navigation by linking the header cart button directly to the cart page.

## Goals
- Provide clear feedback when items are added to cart via a popup notification
- Create a polished cart page with line items, quantity controls, free shipping progress, and payment icons
- Simplify cart access by linking header cart button directly to /cart page
- Maintain design system consistency throughout

## User Stories

### Phase 1: Added to Bag Popup

**US-001: Create AddedToBagPopup component structure**
As a developer, I want to create the base popup component so that it can display added item information.
- Acceptance: Component created at `apps/website/app/components/AddedToBagPopup.tsx`
- Acceptance: Props interface includes: `isOpen`, `onClose`, `product` (image, title, variant info, price), `cartCount`
- Acceptance: Component renders nothing when `isOpen` is false
- Acceptance: Typecheck passes (`pnpm typecheck`)

**US-002: Style AddedToBagPopup to match design system**
As a user, I want the popup to have consistent styling so that it feels part of the Wakey brand.
- Acceptance: Popup uses `bg-black text-sand` color scheme (matching On Running dark theme)
- Acceptance: Uses `rounded-card` for border radius
- Acceptance: Uses type scale utilities: `text-s2` for "Added to your bag" title, `text-paragraph` for product name, `text-small` for variant details
- Acceptance: Close button (X) positioned top-right using `CrossIcon` from @wakey/ui
- Acceptance: Typecheck passes

**US-003: Add product info layout to popup**
As a user, I want to see the product I just added so that I can confirm my selection.
- Acceptance: Left side shows product thumbnail image (square, ~80px)
- Acceptance: Right side shows: product title, variant info (e.g., "Mighty Citrus"), price
- Acceptance: Layout uses flexbox with gap-4
- Acceptance: Typecheck passes

**US-004: Add action buttons to popup**
As a user, I want buttons to navigate to my bag or checkout so that I can complete my purchase.
- Acceptance: Two buttons side by side: "Your bag (X)" and "Checkout"
- Acceptance: "Your bag" button uses outline variant (border with transparent bg)
- Acceptance: "Checkout" button uses primary variant (solid bg-sand text-black)
- Acceptance: "Your bag" links to `/cart` page
- Acceptance: "Checkout" links to Shopify checkout URL
- Acceptance: Cart count (X) updates to show total items
- Acceptance: Typecheck passes

**US-005: Position popup above sticky ATC**
As a user, I want the popup to appear floating above the sticky ATC bar so that it's clearly visible.
- Acceptance: Popup is fixed position, same width as sticky ATC
- Acceptance: Positioned directly above sticky ATC with small gap (8px)
- Acceptance: Horizontally centered like sticky ATC
- Acceptance: Z-index higher than sticky ATC
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

**US-006: Add slide-up animation to popup**
As a user, I want smooth animation so that the popup feels polished.
- Acceptance: Popup slides up from below when opening (translateY animation)
- Acceptance: Uses `ease-out-expo` easing from design system
- Acceptance: Animation duration ~300ms
- Acceptance: Fades out when closing
- Acceptance: Typecheck passes

**US-007: Integrate popup with StickyAddToCart**
As a user, I want the popup to appear when I add items from sticky ATC so that I get feedback.
- Acceptance: Popup opens automatically after successful cart add
- Acceptance: Popup receives product data from the item just added
- Acceptance: Popup stays open until user clicks close (X), "Your bag", or "Checkout"
- Acceptance: Clicking outside popup does NOT close it (no backdrop)
- Acceptance: Popup floats without dimming the page background
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

**US-008: Add AddedToBagPopup to design system page**
As a developer, I want to see the popup documented so that I understand how to use it.
- Acceptance: New section "Added to Bag Popup" added under "Sticky Add to Cart" section
- Acceptance: Shows popup in static open state with mock product data
- Acceptance: Brief description of component purpose and props
- Acceptance: Typecheck passes

### Phase 2: Cart Page Redesign

**US-009: Update cart page layout to 2-column on desktop**
As a user, I want to see items and summary side-by-side on desktop so that I can review my order efficiently.
- Acceptance: Desktop (md+): 2-column grid - items (left ~65%), summary (right ~35%)
- Acceptance: Mobile: single column, items stacked above summary
- Acceptance: Page title "Bag" at top using `text-h1 font-display`
- Acceptance: Consistent padding using design system spacing
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

**US-010: Redesign cart line item component**
As a user, I want clean line item cards so that I can easily see what's in my cart.
- Acceptance: Card has subtle border (like Polaroid)
- Acceptance: Layout: image left, product info + controls right
- Acceptance: Product image on light background (bg-sand or bg-skyblue)
- Acceptance: Shows: product title, variant name, price
- Acceptance: Remove button (X) positioned top-right of card
- Acceptance: Typecheck passes

**US-011: Add quantity controls to line item**
As a user, I want to adjust quantities so that I can buy more or fewer items.
- Acceptance: Quantity selector with minus (-) and plus (+) buttons
- Acceptance: Current quantity displayed between buttons
- Acceptance: Minus button disabled when quantity is 1
- Acceptance: Buttons trigger cart line update
- Acceptance: Optimistic UI updates immediately
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

**US-012: Create free shipping progress bar component**
As a user, I want to see how close I am to free shipping so that I might add more items.
- Acceptance: Component created at `apps/website/app/components/FreeShippingBar.tsx`
- Acceptance: Props: `currentTotal` (number) - threshold hardcoded at €80
- Acceptance: Shows progress bar filling left to right
- Acceptance: Text shows amount remaining: "€X away from free shipping"
- Acceptance: When threshold met, shows "Congrats! You get free standard shipping."
- Acceptance: Typecheck passes

**US-013: Style free shipping progress bar**
As a user, I want the progress bar to look polished and match the design system.
- Acceptance: Bar uses `bg-sand` for track, `bg-softorange` for fill
- Acceptance: Bar has subtle rounded corners
- Acceptance: Text uses `text-small` or `text-body-small`
- Acceptance: Smooth width transition when total changes
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

**US-014: Add payment method icons**
As a developer, I want payment icons available so that they can be displayed in cart summary.
- Acceptance: Icons added to `packages/ui/src/icons/`: Mastercard, Visa, Amex, Klarna, ApplePay, Bancontact, iDEAL, Sofort, PayPal
- Acceptance: Each icon exported from `packages/ui/src/index.ts`
- Acceptance: Icons are SVG components with consistent sizing props
- Acceptance: Typecheck passes

**US-015: Redesign cart summary section**
As a user, I want a clear summary showing totals and checkout options.
- Acceptance: Free shipping bar at top of summary
- Acceptance: Shows "Total items: X" row
- Acceptance: Shows "Total: €XX.XX" row with `text-h3` styling
- Acceptance: Large "CHECKOUT" button (full width, `bg-black text-sand`)
- Acceptance: Payment icons displayed in row below checkout button
- Acceptance: "Free standard shipping on orders over €80" text below icons
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

**US-016: Handle empty cart state**
As a user, I want clear feedback when my cart is empty so that I know to add items.
- Acceptance: Shows message "Your bag is empty"
- Acceptance: Shows "Continue shopping" link to homepage or products
- Acceptance: Centered layout with appropriate spacing
- Acceptance: Typecheck passes

### Phase 3: Header Cart Navigation

**US-017: Update header cart button to link to /cart page**
As a user, I want to click the cart button to go to the cart page so that navigation is direct.
- Acceptance: Cart button in header is now a link to `/cart`
- Acceptance: No longer opens cart drawer
- Acceptance: Cart count badge still displays
- Acceptance: Hover state preserved
- Acceptance: Typecheck passes
- Acceptance: Verify in browser using chrome-devtools MCP

**US-018: Remove cart drawer from PageLayout**
As a developer, I want to clean up unused cart drawer code so that the codebase stays maintainable.
- Acceptance: Cart Aside component removed from PageLayout
- Acceptance: Cart drawer context/state removed if no longer needed
- Acceptance: Mobile menu drawer still functional
- Acceptance: No console errors or warnings
- Acceptance: Typecheck passes

## Non-Goals
- "Pairs perfectly with..." product recommendations (future feature)
- Discount code input field
- 10% membership discount promotion
- Cart drawer (replacing with full page)
- Saved for later functionality
- Guest checkout vs account checkout distinction

## Design Considerations

### Visual References
- **On Running**: "Added to bag" popup style (dark bg, floating above ATC)
- **Polaroid**: Cart page layout (2-column, clean line items, summary right)

### Design System Compliance
- All text uses type scale utilities (text-h1, text-paragraph, etc.)
- Colors from theme only (sand, softorange, black, etc.)
- Spacing from Tailwind scale (p-4, gap-6, etc.)
- Border radius uses `rounded-card`
- Fonts: `font-display` for headings, `font-body` for content

### Accessibility
- Popup can be closed with Escape key
- Focus trapped in popup when open
- Sufficient color contrast for all text
- Quantity buttons have aria-labels

## Technical Considerations

### Dependencies
- Uses existing Hydrogen cart utilities (CartForm, useOptimisticCart)
- Checkout URL from cart object (`cart.checkoutUrl`)
- Payment icons as SVG components in @wakey/ui

### State Management
- Popup state managed locally in StickyAddToCart
- Cart data from loader/Hydrogen context
- Optimistic updates for quantity changes

### File Structure
```
apps/website/app/components/
├── AddedToBagPopup.tsx      (NEW)
├── FreeShippingBar.tsx      (NEW)
├── StickyAddToCart.tsx      (MODIFY - integrate popup)
├── CartMain.tsx             (MODIFY - new layout)
├── CartLineItem.tsx         (MODIFY - redesign)
├── CartSummary.tsx          (MODIFY - redesign)
├── Header.tsx               (MODIFY - direct link)
└── PageLayout.tsx           (MODIFY - remove cart drawer)

packages/ui/src/icons/
├── MastercardIcon.tsx       (NEW)
├── VisaIcon.tsx             (NEW)
├── AmexIcon.tsx             (NEW)
├── KlarnaIcon.tsx           (NEW)
├── ApplePayIcon.tsx         (NEW)
├── BancontactIcon.tsx       (NEW)
├── IdealIcon.tsx            (NEW or EXISTS)
├── SofortIcon.tsx           (NEW)
└── PaypalIcon.tsx           (NEW)
```

## Success Metrics
- Users see popup confirmation when adding items to cart
- Cart page displays correctly on mobile and desktop
- Free shipping bar accurately shows progress toward €80
- All payment icons render correctly
- Header cart button navigates to /cart page
- No regression in existing cart functionality

## Decisions Made
- Popup floats without backdrop/dimming the page
- Free shipping threshold hardcoded at €80
- Popup stays open until user explicitly closes it (no auto-close)
- Payment icons: Mastercard, Visa, Amex, Klarna, Apple Pay, Bancontact, iDEAL, Sofort, PayPal (no Amazon)
