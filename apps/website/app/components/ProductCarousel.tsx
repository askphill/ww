import {useState, useRef, useEffect} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';
import {useContinuousCarousel} from '@wakey/hooks';
import {MediaItem} from './MediaItem';

type MediaNode = ProductFragment['media']['nodes'][number];

interface ProductCarouselProps {
  media: MediaNode[];
  skipFirst?: boolean;
}

export function ProductCarousel({
  media,
  skipFirst = true,
}: ProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Skip first media item if specified
  const displayMedia = skipFirst ? media.slice(1) : media;

  // Use shared continuous carousel hook for desktop
  const {wrapperRef, isDesktop} = useContinuousCarousel();

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

  if (displayMedia.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile: snap scroll carousel - CSS hidden on desktop */}
      <div className="block md:hidden">
        <div
          className="relative"
          style={{paddingTop: 'var(--height-header-mobile)'}}
        >
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
                  className="flex-none w-full h-[calc(100dvh-11rem)] snap-center overflow-hidden"
                >
                  <MediaItem
                    media={item}
                    sizes="100vw"
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}
          </div>

          {/* Navigation arrows - mobile only */}
          {displayMedia.length > 1 && (
            <>
              {/* Left arrow */}
              <button
                onClick={() => {
                  scrollRef.current?.scrollTo({
                    left:
                      (activeIndex - 1) * (scrollRef.current?.offsetWidth || 0),
                    behavior: 'smooth',
                  });
                }}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-opacity ${
                  activeIndex === 0 ? 'opacity-20' : 'opacity-100'
                }`}
                aria-label="Previous slide"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4"
                >
                  <path
                    d="M13.6893 16L10.2197 12.5303C9.92678 12.2374 9.92678 11.7626 10.2197 11.4697L13.6893 8"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {/* Right arrow */}
              <button
                onClick={() => {
                  scrollRef.current?.scrollTo({
                    left:
                      (activeIndex + 1) * (scrollRef.current?.offsetWidth || 0),
                    behavior: 'smooth',
                  });
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-opacity ${
                  activeIndex === displayMedia.length - 1
                    ? 'opacity-20'
                    : 'opacity-100'
                }`}
                aria-label="Next slide"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 rotate-180"
                >
                  <path
                    d="M13.6893 16L10.2197 12.5303C9.92678 12.2374 9.92678 11.7626 10.2197 11.4697L13.6893 8"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Progress bar indicator - mobile only */}
          {displayMedia.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="flex items-center gap-4">
                {/* Progress bar */}
                <div className="flex-1 h-px bg-black/30 relative">
                  <div
                    className="absolute top-0 left-0 h-px bg-black transition-all duration-300"
                    style={{
                      width: `${((activeIndex + 1) / displayMedia.length) * 100}%`,
                    }}
                  />
                </div>
                {/* Counter */}
                <span className="text-small font-display tabular-nums text-black">
                  {activeIndex + 1} / {displayMedia.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: continuous autoplay carousel - CSS hidden on mobile */}
      <div className="hidden md:block">
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
                  className="flex-none w-[50vw] h-screen overflow-hidden"
                >
                  <MediaItem
                    media={item}
                    sizes="50vw"
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
