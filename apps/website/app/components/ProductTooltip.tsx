import {useLazyFetch} from '@wakey/hooks';
import {Tooltip} from '@wakey/ui';
import type {TooltipProduct} from '~/lib/tooltip-product';
import {
  buildShopifySrcSet,
  imagePresets,
  imageSrcSets,
  optimizeShopifyImage,
} from '~/lib/shopify-image';

interface ProductTooltipProps {
  handle: string;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  /** Set to true for above-the-fold tooltips to prioritize LCP */
  priority?: boolean;
  /** Optional server-provided data to avoid client fetch */
  product?: TooltipProduct | null;
  /** Visual variant: 'dark' for dark backgrounds, 'light' for light backgrounds */
  variant?: 'dark' | 'light';
}

interface ProductApiResponse {
  product: {
    id: string;
    title: string;
    handle: string;
    featuredImage: {url: string; altText: string | null} | null;
    subtitle: string | null;
    reviewRating: number | null;
    reviewCount: number | null;
  } | null;
}

export function ProductTooltip({
  handle,
  position,
  priority,
  product,
  variant = 'dark',
}: ProductTooltipProps) {
  const fetcher = useLazyFetch<ProductApiResponse>(`/api/product/${handle}`, {
    enabled: !product,
  });

  const fetchedProduct = fetcher.data?.product
    ? {
        title: fetcher.data.product.title,
        handle: fetcher.data.product.handle,
        image: fetcher.data.product.featuredImage?.url || '',
        subtitle: fetcher.data.product.subtitle,
        reviewCount: fetcher.data.product.reviewCount,
        reviewRating: fetcher.data.product.reviewRating,
      }
    : null;
  const resolvedProduct = product || fetchedProduct;

  if (!resolvedProduct) {
    return null;
  }

  const rawImage = resolvedProduct.image || '';
  const optimizedImage = rawImage
    ? optimizeShopifyImage(rawImage, imagePresets.tooltip)
    : '';
  const imageSrcSet = rawImage
    ? buildShopifySrcSet(rawImage, imageSrcSets.tooltip)
    : '';

  return (
    <Tooltip
      product={{
        title: resolvedProduct.title,
        url: `/products/${resolvedProduct.handle}`,
        image: optimizedImage || rawImage,
        imageSrcSet,
        imageSizes: '80px',
        subtitle: resolvedProduct.subtitle,
        reviewCount: resolvedProduct.reviewCount,
        reviewRating: resolvedProduct.reviewRating,
      }}
      position={position}
      priority={priority}
      variant={variant}
    />
  );
}
