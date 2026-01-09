import {useState, useRef, useEffect, useCallback} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';

type MediaNode = ProductFragment['media']['nodes'][number];

interface ProductCarouselProps {
  media: MediaNode[];
  skipFirst?: boolean;
}

const AUTOPLAY_SPEED = 1.2;
const FRICTION = 0.95;
const MOBILE_BREAKPOINT = 768;

export function ProductCarousel({media, skipFirst = true}: ProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Animation state refs (using refs to avoid re-renders)
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const isInViewRef = useRef(false);
  const pointerStartRef = useRef(0);
  const autoplaySpeedRef = useRef(AUTOPLAY_SPEED); // Positive = scroll left, Negative = scroll right

  // Skip first media item if specified
  const displayMedia = skipFirst ? media.slice(1) : media;

  // Check viewport size
  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= MOBILE_BREAKPOINT);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Animation tick function
  const tick = useCallback(() => {
    if (!isInViewRef.current || !wrapperRef.current) {
      rafRef.current = null;
      return;
    }

    const wrapper = wrapperRef.current;
    const wrapperWidth = wrapper.scrollWidth;
    const end = wrapperWidth / 2; // Half because we clone items

    if (!isDraggingRef.current) {
      // Apply velocity with friction
      offsetRef.current += velocityRef.current;
      velocityRef.current *= FRICTION;

      if (Math.abs(velocityRef.current) < 0.1) {
        velocityRef.current = 0;
      }

      // Apply autoplay (direction based on last drag)
      offsetRef.current += autoplaySpeedRef.current;

      // Loop around
      if (offsetRef.current > end) {
        offsetRef.current = 0;
      } else if (offsetRef.current < 0) {
        offsetRef.current = end;
      }
    }

    wrapper.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Setup desktop continuous scroll
  useEffect(() => {
    if (!isDesktop || !wrapperRef.current) return;

    const wrapper = wrapperRef.current;

    // Clone items for infinite scroll
    const children = Array.from(wrapper.children);
    children.forEach((child) => {
      const clone = child.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-clone', 'true');
      wrapper.appendChild(clone);
    });

    // Force autoplay on all videos (including clones)
    const playVideos = () => {
      wrapper.querySelectorAll('video').forEach((video) => {
        video.play().catch(() => {
          // Ignore autoplay errors (browser policy)
        });
      });
    };
    playVideos();

    // Intersection observer to start/stop animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting) {
            if (!rafRef.current) {
              rafRef.current = requestAnimationFrame(tick);
            }
            // Play videos when in view
            playVideos();
          }
        });
      },
      {threshold: 0.1}
    );
    observer.observe(wrapper.parentElement || wrapper);

    // Pointer events for dragging
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      pointerStartRef.current = e.clientX;
      velocityRef.current = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientX - pointerStartRef.current;
      offsetRef.current -= delta;
      velocityRef.current = -delta;
      pointerStartRef.current = e.clientX;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      // Change autoplay direction based on drag direction (matches reference)
      // velocity > 0 means dragged left, velocity < 0 means dragged right
      autoplaySpeedRef.current = velocityRef.current > 0 ? AUTOPLAY_SPEED : -AUTOPLAY_SPEED;
    };

    wrapper.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      // Cleanup clones
      wrapper.querySelectorAll('[data-clone]').forEach((el) => el.remove());
      // Cleanup animation
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Cleanup observers and listeners
      observer.disconnect();
      wrapper.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      // Reset transform
      wrapper.style.transform = '';
    };
  }, [isDesktop, tick]);

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
