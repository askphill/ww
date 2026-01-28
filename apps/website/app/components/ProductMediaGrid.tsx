import type {ProductFragment} from 'storefrontapi.generated';
import {MediaItem} from './MediaItem';

type MediaNode = ProductFragment['media']['nodes'][number];

interface ProductMediaGridProps {
  media: MediaNode[];
  skipFirst?: boolean;
}

export function ProductMediaGrid({
  media,
  skipFirst = true,
}: ProductMediaGridProps) {
  // Skip first media item if specified (usually variant image)
  const displayMedia = skipFirst ? media.slice(1) : media;

  if (displayMedia.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2">
      {displayMedia.map((item, index) => {
        const itemId =
          item.__typename === 'MediaImage' || item.__typename === 'Video'
            ? item.id
            : `media-${index}`;

        return (
          <div key={itemId} className="aspect-[4/5] w-full overflow-hidden">
            <MediaItem
              media={item}
              sizes="(min-width: 768px) 35vw, 50vw"
              className="w-full h-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
