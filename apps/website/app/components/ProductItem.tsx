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
  return (
    <ProductCard
      to={variantUrl}
      image={
        image ? {src: image.url, alt: image.altText || undefined} : undefined
      }
      title={product.title}
      price={
        <Money data={product.priceRange.minVariantPrice} withoutTrailingZeros />
      }
      loading={loading}
    />
  );
}
