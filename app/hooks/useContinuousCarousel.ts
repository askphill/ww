import {useState, useRef, useEffect, useCallback} from 'react';

const AUTOPLAY_SPEED = 1.2;
const FRICTION = 0.95;
const MOBILE_BREAKPOINT = 768;

interface UseContinuousCarouselOptions {
  /** Callback when carousel enters viewport (useful for video autoplay) */
  onEnterView?: (wrapper: HTMLElement) => void;
}

/**
 * Hook for creating a continuous autoplay carousel with drag support.
 * On desktop: continuous scroll with velocity/friction physics and infinite loop.
 * On mobile: returns isDesktop=false so you can render a snap scroll fallback.
 */
export function useContinuousCarousel(options: UseContinuousCarouselOptions = {}) {
  const {onEnterView} = options;

  const [isDesktop, setIsDesktop] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Animation state refs
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const isInViewRef = useRef(false);
  const pointerStartRef = useRef(0);
  const autoplaySpeedRef = useRef(AUTOPLAY_SPEED);

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

    // Intersection observer to start/stop animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting) {
            if (!rafRef.current) {
              rafRef.current = requestAnimationFrame(tick);
            }
            // Call onEnterView callback (e.g., for video autoplay)
            onEnterView?.(wrapper);
          }
        });
      },
      {threshold: 0.1},
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
      // Change autoplay direction based on drag direction
      autoplaySpeedRef.current =
        velocityRef.current > 0 ? AUTOPLAY_SPEED : -AUTOPLAY_SPEED;
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
  }, [isDesktop, tick, onEnterView]);

  return {
    /** Ref to attach to the carousel wrapper element */
    wrapperRef,
    /** Whether we're on desktop (true) or mobile (false) */
    isDesktop,
  };
}
