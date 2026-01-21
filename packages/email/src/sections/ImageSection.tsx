import type {ImageSection as ImageSectionType} from '../types';

interface Props {
  config: ImageSectionType['config'];
}

export function ImageSection({config}: Props) {
  const imageElement = config.imageUrl ? (
    <img
      src={config.imageUrl}
      alt={config.altText}
      className={`block ${config.fullWidth ? 'w-full' : 'max-w-md mx-auto'}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-sand/50 text-muted-foreground ${
        config.fullWidth ? 'w-full h-48' : 'max-w-md mx-auto h-48'
      }`}
    >
      Add Image
    </div>
  );

  return (
    <section className={`w-full bg-${config.backgroundColor}`}>
      {config.linkUrl ? (
        <a href={config.linkUrl} target="_blank" rel="noopener noreferrer">
          {imageElement}
        </a>
      ) : (
        imageElement
      )}
    </section>
  );
}
