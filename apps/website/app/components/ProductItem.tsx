import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
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
    <Link
      className="group block h-full bg-blue overflow-hidden hover-scale"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="aspect-[5/6] flex items-center justify-center p-4 md:p-6">
        {image && (
          <Image
            alt={image.altText || product.title}
            data={image}
            loading={loading}
            sizes="(min-width: 48rem) 400px, 50vw"
            className="w-full h-full object-contain"
          />
        )}
      </div>
      <div className="p-4 md:p-6 pt-0 md:pt-0">
        <h4 className="text-label font-display uppercase tracking-tight">
          {product.title}
        </h4>
        <span className="text-small font-body opacity-80">
          <Money data={product.priceRange.minVariantPrice} withoutTrailingZeros />
        </span>
      </div>
    </Link>
  );
}
