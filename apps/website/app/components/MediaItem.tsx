import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';

type MediaNode = ProductFragment['media']['nodes'][number];

interface MediaItemProps {
  media: MediaNode;
  sizes?: string;
  className?: string;
  draggable?: boolean;
  videoPreload?: 'auto' | 'metadata' | 'none';
}

/**
 * Renders a product media item (image or video).
 * Handles MediaImage and Video __typename cases from Shopify Storefront API.
 */
export function MediaItem({
  media,
  sizes = '100vw',
  className = 'w-full h-full object-cover',
  draggable = true,
  videoPreload = 'auto',
}: MediaItemProps) {
  if (media.__typename === 'MediaImage' && media.image) {
    return (
      <Image
        alt={media.image.altText || 'Product image'}
        data={media.image}
        className={className}
        sizes={sizes}
        draggable={draggable}
      />
    );
  }

  if (media.__typename === 'Video') {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        preload={videoPreload}
        poster={media.previewImage?.url}
        src={media.sources.find((s) => s.mimeType === 'video/mp4')?.url || ''}
        className={className}
        draggable={draggable}
      />
    );
  }

  // Unsupported media type
  return null;
}
