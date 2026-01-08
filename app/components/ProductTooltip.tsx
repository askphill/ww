import {useFetcher} from 'react-router';
import {useEffect} from 'react';
import {Tooltip} from './Tooltip';

interface ProductTooltipProps {
  handle: string;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
}

export function ProductTooltip({handle, position}: ProductTooltipProps) {
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
    />
  );
}
