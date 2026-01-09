# Cloud Section Migration Plan

## Overview
Migrate the `section-cloud.liquid` from the reference theme to a React component (`CloudSection.tsx`).

This section features:
- **Full viewport height** with sand background
- **Animated text** - Two alternating headlines that reveal word-by-word then disappear
- **Image cloud** - 23 images positioned absolutely, continuously scrolling vertically in an infinite loop

---

## Component Structure

```
CloudSection.tsx
├── Text overlay (centered, z-index above images)
│   ├── Headline 1: "Making the world a better place"
│   └── Headline 2: "one morning at a time"
└── Image gallery wrapper (infinite vertical scroll animation)
    ├── Gallery set 1 (23 images)
    └── Gallery set 2 (duplicate for seamless loop)
```

---

## Implementation Tasks

### 1. Create CloudSection Component
**File:** `app/components/sections/CloudSection.tsx`

**Props interface:**
```tsx
interface CloudSectionProps {
  images: string[];  // Array of 23 image URLs
  headline1?: {
    line1: string[];  // ["Making", "the", "world"]
    line2: string[];  // ["a", "better", "place"]
  };
  headline2?: {
    line1: string[];  // ["one", "morning"]
    line2: string[];  // ["at", "a", "time"]
  };
}
```

**Key structure:**
- Section wrapper: `min-h-dvh bg-sand overflow-hidden relative flex justify-center items-center`
- Text wrapper: Centered overlay with staggered word animations
- Image wrapper: Contains two copies of image grid for seamless loop

### 2. Add CSS Animations to tailwind.css

**Required custom CSS (must be added to tailwind.css):**

```css
/* Cloud section animations */
@keyframes cloud-text-appear {
  0% { transform: translate3d(0, 100%, 0); opacity: 0; }
  12.5% { transform: translate3d(0, 0, 0); opacity: 1; }
  37.5% { transform: translate3d(0, 0, 0); opacity: 1; }
  50% { transform: translate3d(0, -100%, 0); opacity: 0; }
  100% { transform: translate3d(0, 100%, 0); opacity: 0; }
}

@keyframes cloud-scroll {
  from { transform: translateY(0); }
  to { transform: translateY(calc(-3400 / 1500 * 100vw)); }
}
```

**Custom utilities needed:**
- `animate-cloud-text` - 5s infinite text reveal animation
- `animate-cloud-scroll` - 60s infinite linear scroll

### 3. Image Positioning Strategy

The reference uses 23 unique positions based on a 1500px design width. Two approaches:

**Option A: Inline styles (simpler, matches reference)**
```tsx
const imagePositions = [
  { left: '20.67%', top: '0%', width: '15.93%' },      // img-1
  { left: '70.67%', top: '1.87%', width: '9.27%' },    // img-2
  // ... etc for all 23
];
```

**Option B: CSS custom properties (cleaner)**
Define `--design-size: 1500` and calculate positions with `calc()`.

**Recommendation:** Option A for simplicity and maintainability.

### 4. Export from index.ts
Add `CloudSection` to `app/components/sections/index.ts`

### 5. Add to MDX
```mdx
<CloudSection
  images={[
    "https://cdn.shopify.com/...",
    // ... 23 images
  ]}
/>
```

---

## CSS Details to Migrate

| Reference CSS | Tailwind Equivalent |
|---------------|---------------------|
| `height: 100svh` | `min-h-dvh` |
| `background: var(--color-sand)` | `bg-sand` |
| `overflow: hidden` | `overflow-hidden` |
| `display: flex; justify-content: center; align-items: center` | `flex justify-center items-center` |
| `flex-direction: column` | `flex-col` |
| `position: absolute; inset: 0` | `absolute inset-0` |
| `z-index: 2` | `z-10` |
| `text-align: center` | `text-center` |

### Image gallery height
Reference: `height: calc(3400 / 1500 * 100vw)` = ~226.67vw

This creates a tall scrolling area that loops seamlessly.

---

## Animation Timing

### Text Animation
- Each word has `--count` (1-6) for stagger delay
- Stagger time: 0.05s between words
- Headline 1: Starts immediately
- Headline 2: Starts at 2.5s offset
- Full cycle: 5 seconds

### Image Scroll
- Duration: 60s
- Direction: Upward (negative Y translation)
- Timing: Linear
- Loop: Infinite

---

## Image Requirements

Need 23 images uploaded to Shopify CDN. These appear to be lifestyle/product photos arranged in a "cloud" pattern.

**Action needed:** Identify which images are used in the reference site and ensure they're uploaded to Shopify.

---

## Accessibility Considerations

- Text uses `role="heading" aria-level="1"` - implement with proper heading tags
- Images need alt text
- Consider `prefers-reduced-motion` for animations

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/components/sections/CloudSection.tsx` | Create |
| `app/components/sections/index.ts` | Add export |
| `app/styles/tailwind.css` | Add keyframes + utilities |
| `app/content/home.mdx` | Add component usage |

---

## Estimated Complexity
**Medium-High** - The animations and positioning require careful implementation to match the reference.
