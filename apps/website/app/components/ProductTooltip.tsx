import {useLazyFetch} from '@wakey/hooks';
import {Tooltip} from '@wakey/ui';
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
}: ProductTooltipProps) {
  const fetcher = useLazyFetch<ProductApiResponse>(`/api/product/${handle}`);

  const product = fetcher.data?.product;

  if (!product) {
    return null;
  }

  const rawImage = product.featuredImage?.url || '';
  const optimizedImage = rawImage
    ? optimizeShopifyImage(rawImage, imagePresets.tooltip)
    : '';
  const imageSrcSet = rawImage
    ? buildShopifySrcSet(rawImage, imageSrcSets.tooltip)
    : '';

  return (
    <Tooltip
      product={{
        title: product.title,
        url: `/products/${product.handle}`,
        image: optimizedImage,
        imageSrcSet,
        imageSizes: '80px',
        subtitle: product.subtitle,
        reviewCount: product.reviewCount,
        reviewRating: product.reviewRating,
      }}
      position={position}
      priority={priority}
    />
  );
}
