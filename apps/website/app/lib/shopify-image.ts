/**
 * Utility for optimizing Shopify CDN image URLs with transformation parameters.
 *
 * Shopify CDN supports these query parameters:
 * - width: Target width in pixels
 * - height: Target height in pixels
 * - crop: Crop mode (center, top, bottom, left, right)
 * - format: Output format (webp, jpg, png)
 *
 * @example
 * optimizeShopifyImage(url, { width: 800, format: 'webp' })
 * // Returns: https://cdn.shopify.com/.../image.jpg?width=800&format=webp
 */
export function optimizeShopifyImage(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    format?: 'webp' | 'jpg' | 'png';
  } = {},
): string {
  if (!url || !url.includes('cdn.shopify.com')) return url;

  try {
    const shopifyUrl = new URL(url);

    if (options.width)
      shopifyUrl.searchParams.set('width', String(options.width));
    if (options.height)
      shopifyUrl.searchParams.set('height', String(options.height));
    if (options.crop) shopifyUrl.searchParams.set('crop', options.crop);
    if (options.format) shopifyUrl.searchParams.set('format', options.format);

    return shopifyUrl.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

export function buildShopifySrcSet(
  url: string,
  options: {
    widths: number[];
    format?: 'webp' | 'jpg' | 'png';
    height?: number;
    crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  },
): string {
  if (!url || !url.includes('cdn.shopify.com')) return '';

  const {widths, format, height, crop} = options;

  return widths
    .filter((width) => width > 0)
    .map((width) => {
      const src = optimizeShopifyImage(url, {width, height, crop, format});
      return `${src} ${width}w`;
    })
    .join(', ');
}

/** Preset configurations for common image use cases (2x for Retina displays) */
export const imagePresets = {
  /** Full-width hero images (desktop) - 2560px for high-DPI screens */
  hero: {width: 2560, format: 'webp'} as const,
  /** Hero images for mobile - 1280px for Retina mobile (640 * 2) */
  heroMobile: {width: 1280, format: 'webp'} as const,
  /** Product thumbnails - 640px for Retina (320 * 2) */
  thumbnail: {width: 640, format: 'webp'} as const,
  /** Tooltip product images - 160px for Retina (80 * 2) */
  tooltip: {width: 160, format: 'webp'} as const,
  /** Social/gallery images - 900px for Retina (450 * 2) */
  social: {width: 900, format: 'webp'} as const,
} as const;

export const imageSrcSets = {
  hero: {
    widths: [768, 1024, 1280, 1440, 1680, 1920, 2240, 2560],
    format: 'webp',
  },
  heroMobile: {
    widths: [360, 480, 640, 750, 900, 1080, 1200, 1280],
    format: 'webp',
  },
  social: {
    widths: [320, 480, 640, 800, 900, 960],
    format: 'webp',
  },
  tooltip: {
    widths: [80, 120, 160],
    format: 'webp',
  },
} as const;
