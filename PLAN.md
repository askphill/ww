# Plan: ImageBanner Section

## Overview
Create an `ImageBanner` component based on the reference theme's "Media text banner" section. This is a full-screen section with a background image/video and overlaid text content.

## Reference Analysis
- **Source**: `/Users/bd/Documents/GitHub/wakey-source/sections/section.liquid` (lines 1550-1594)
- **CSS**: Background media styles in `snippets/background-media.liquid`
- **Features**: Full-screen height, background media, text overlay, optional gradient overlay

---

## Implementation Steps

### 1. Create ImageBanner Component
**File**: `app/components/sections/ImageBanner.tsx`

**Props Interface**:
```tsx
interface ImageBannerProps {
  // Media
  backgroundImage?: string;
  backgroundImageMobile?: string;
  backgroundVideo?: string;
  backgroundVideoMobile?: string;
  mediaAlt?: string;

  // Content
  label?: string;          // Small label text (e.g., "Wakey Fact")
  text: string;            // Main text content (supports HTML/em tags)

  // Styling
  textColor?: string;      // Default: white
  overlayColor?: string;   // Optional overlay
  overlayOpacity?: number; // 0-100

  // Layout
  alignment?: 'left' | 'center' | 'right';
}
```

**Structure**:
```
<section> (full-screen, relative)
  └── <div> (background-media, absolute inset-0)
       └── <picture> or <video> (responsive sources)
       └── <div> (overlay, if enabled)
  └── <div> (content wrapper, relative z-10)
       └── <div> (max-width container, centered)
            └── <p> (label - small text)
            └── <p> (main text, text-h3, font-display)
```

**Key Styles**:
- Section: `relative min-h-svh overflow-clip rounded-card`
- Background media: `absolute inset-0 w-full h-full object-cover`
- Content: `relative z-10 flex items-center justify-center h-full px-4 py-20`
- Text container: `max-w-160 text-center` (~640px max-width)

### 2. Responsive Images
Use `<picture>` element for art direction:
```tsx
<picture>
  <source media="(max-width: 767px)" srcSet={backgroundImageMobile || backgroundImage} />
  <img src={backgroundImage} alt={mediaAlt} className="..." />
</picture>
```

### 3. Export from Index
**File**: `app/components/sections/index.ts`
- Add `export {ImageBanner} from './ImageBanner';`

### 4. Add to Homepage
**File**: `app/content/home.mdx`

Usage example (after TextMedia, before ProductReviews):
```mdx
<ImageBanner
  backgroundImage="https://cdn.shopify.com/..."
  label="Wakey Fact"
  text="Most natural deodorants use <em>baking soda</em> which can cause <em>skin irritation</em>. We use safe, natural ingredients to <em>absorb wetness</em> and eliminate <em>odor-causing</em> bacteria."
  textColor="#ffffff"
  alignment="center"
/>
```

---

## Design Decisions

1. **Naming**: `ImageBanner` (clearer than "Media text banner")
2. **Media type**: Support both image and video via separate props
3. **Mobile images**: Optional separate mobile image/video for art direction
4. **Text rendering**: Use `dangerouslySetInnerHTML` for em/italic support
5. **Height**: Use `min-h-svh` (100svh) for full viewport
6. **Overlay**: Optional solid color with opacity (simpler than gradients)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/components/sections/ImageBanner.tsx` | Create |
| `app/components/sections/index.ts` | Modify (add export) |
| `app/content/home.mdx` | Modify (add usage) |

---

## Complexity
**Low** - Straightforward component following existing patterns. No complex animations or positioning required.
