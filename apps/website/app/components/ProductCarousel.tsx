import {useState, useRef, useEffect, useCallback} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {useContinuousCarousel} from '@wakey/hooks';

type MediaNode = ProductFragment['media']['nodes'][number];

interface ProductCarouselProps {
  media: MediaNode[];
  skipFirst?: boolean;
}

export function ProductCarousel({media, skipFirst = true}: ProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Skip first media item if specified
  const displayMedia = skipFirst ? media.slice(1) : media;

  // Play all videos in a container
  const playVideos = useCallback((container: HTMLElement) => {
    container.querySelectorAll('video').forEach((video) => {
      video.play().catch(() => {
        // Ignore autoplay errors (browser policy)
      });
    });
  }, []);

  // Use shared continuous carousel hook for desktop
  const {wrapperRef, isDesktop} = useContinuousCarousel({
    onEnterView: playVideos,
  });

  // Mobile scroll tracking for ball indicators
  useEffect(() => {
    if (isDesktop) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const itemWidth = scrollContainer.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(newIndex);
    };

    scrollContainer.addEventListener('scroll', handleScroll, {passive: true});
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isDesktop]);

  // Force autoplay videos on mobile
  useEffect(() => {
    if (isDesktop) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const playVideos = () => {
      scrollContainer.querySelectorAll('video').forEach((video) => {
        video.play().catch(() => {
          // Ignore autoplay errors (browser policy)
        });
      });
    };

    // Play on mount and when coming into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playVideos();
          }
        });
      },
      {threshold: 0.1}
    );
    observer.observe(scrollContainer);
    playVideos();

    return () => observer.disconnect();
  }, [isDesktop]);

  if (displayMedia.length === 0) {
    return null;
  }

  // Mobile: snap scroll carousel
  if (!isDesktop) {
    return (
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {displayMedia.map((item, index) => {
            const itemId =
              item.__typename === 'MediaImage' || item.__typename === 'Video'
                ? item.id
                : `media-${index}`;
            return (
              <div
                key={itemId}
                className="flex-none w-full h-[calc(100dvh-9.78rem)] snap-center overflow-hidden rounded-card"
              >
                {item.__typename === 'MediaImage' && item.image && (
                  <Image
                    alt={item.image.altText || 'Product image'}
                    data={item.image}
                    className="w-full h-full object-cover"
                    sizes="100vw"
                  />
                )}
                {item.__typename === 'Video' && (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={item.previewImage?.url}
                    className="w-full h-full object-cover"
                  >
                    {item.sources.map((source) => (
                      <source
                        key={source.url}
                        src={source.url}
                        type={source.mimeType}
                      />
                    ))}
                  </video>
                )}
              </div>
            );
          })}
        </div>

        {/* Ball indicators - mobile only */}
        {displayMedia.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center items-center gap-1.5">
            {displayMedia.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  scrollRef.current?.scrollTo({
                    left: index * (scrollRef.current?.offsetWidth || 0),
                    behavior: 'smooth',
                  });
                }}
                className={`w-2 h-2 rounded-full transition-opacity ${
                  index === activeIndex
                    ? 'bg-sand opacity-100'
                    : 'bg-sand opacity-20'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: continuous autoplay carousel
  return (
    <div className="relative overflow-hidden">
      <div
        ref={wrapperRef}
        className="flex cursor-grab active:cursor-grabbing select-none"
        style={{willChange: 'transform'}}
      >
        {displayMedia.map((item, index) => {
          const itemId =
            item.__typename === 'MediaImage' || item.__typename === 'Video'
              ? item.id
              : `media-${index}`;
          return (
            <div
              key={itemId}
              className="flex-none w-[50vw] h-screen overflow-hidden rounded-card"
            >
              {item.__typename === 'MediaImage' && item.image && (
                <Image
                  alt={item.image.altText || 'Product image'}
                  data={item.image}
                  className="w-full h-full object-cover pointer-events-none"
                  sizes="50vw"
                  draggable={false}
                />
              )}
              {item.__typename === 'Video' && (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={item.previewImage?.url}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                >
                  {item.sources.map((source) => (
                    <source
                      key={source.url}
                      src={source.url}
                      type={source.mimeType}
                    />
                  ))}
                </video>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
