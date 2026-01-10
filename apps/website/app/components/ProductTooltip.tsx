import {useFetcher} from 'react-router';
import {useEffect} from 'react';
import {Tooltip} from '@wakey/ui';

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

export function ProductTooltip({handle, position, priority}: ProductTooltipProps) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/product/${handle}`);
    }
  }, [handle, fetcher]);

  const product = fetcher.data?.product;

  if (!product) {
    return null;
  }

  return (
    <Tooltip
      product={{
        title: product.title,
        url: `/products/${product.handle}`,
        image: product.featuredImage?.url || '',
        subtitle: product.subtitle,
        reviewCount: product.reviewCount,
        reviewRating: product.reviewRating,
      }}
      position={position}
      priority={priority}
    />
  );
}
