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

/** Preset configurations for common image use cases */
export const imagePresets = {
  /** Full-width hero images (desktop) */
  hero: {width: 1920, format: 'webp'} as const,
  /** Hero images for mobile */
  heroMobile: {width: 768, format: 'webp'} as const,
  /** Product thumbnails */
  thumbnail: {width: 400, format: 'webp'} as const,
  /** Social/gallery images */
  social: {width: 600, format: 'webp'} as const,
} as const;
