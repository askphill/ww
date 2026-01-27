import {ProductCard} from '@wakey/ui';
import {Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
}: {
  product: CollectionItemFragment | ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const priceData = product.priceRange.minVariantPrice;

  // Format price string (Money component handles formatting but we need a string for generic ProductCard)
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: priceData.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseFloat(priceData.amount));

  return (
    <ProductCard
      to={variantUrl}
      image={
        image ? {src: image.url, alt: image.altText || undefined} : undefined
      }
      title={product.title}
      price={formattedPrice}
      loading={loading}
    />
  );
}
