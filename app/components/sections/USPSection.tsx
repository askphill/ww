import {useState, useRef, useEffect, useCallback} from 'react';

interface USPItem {
  title: string;
  body: string;
}

interface USPSectionProps {
  items: USPItem[];
}

const AUTOPLAY_SPEED = 1.2;
const FRICTION = 0.95;
const MOBILE_BREAKPOINT = 768;

function USPIcon() {
  return (
    <img
      src="/icons/usp-illustration.svg"
      alt=""
      className="w-36 md:w-40"
      loading="lazy"
    />
  );
}

function USPCard({title, body}: USPItem) {
  return (
    <div className="flex flex-col items-center justify-center bg-blue px-4 pt-32 pb-8 w-72 shrink-0 md:flex-row-reverse md:items-stretch md:w-144 md:px-6 md:pt-32 md:pb-6 pointer-events-none">
      <div className="flex-shrink-0">
        <USPIcon />
      </div>
      <div className="flex flex-col justify-end md:pr-6 md:flex-1">
        <div
          className="text-s2 font-display pb-2"
          dangerouslySetInnerHTML={{__html: title}}
        />
        <div
          className="font-itc text-paragraph"
          dangerouslySetInnerHTML={{__html: body}}
        />
      </div>
    </div>
  );
}

export function USPSection({items}: USPSectionProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    const end = wrapperWidth / 2;

    if (!isDraggingRef.current) {
      offsetRef.current += velocityRef.current;
      velocityRef.current *= FRICTION;

      if (Math.abs(velocityRef.current) < 0.1) {
        velocityRef.current = 0;
      }

      offsetRef.current += autoplaySpeedRef.current;

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

    // Intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !rafRef.current) {
            rafRef.current = requestAnimationFrame(tick);
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
      autoplaySpeedRef.current =
        velocityRef.current > 0 ? AUTOPLAY_SPEED : -AUTOPLAY_SPEED;
    };

    wrapper.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      wrapper.querySelectorAll('[data-clone]').forEach((el) => el.remove());
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      observer.disconnect();
      wrapper.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      wrapper.style.transform = '';
    };
  }, [isDesktop, tick]);

  if (items.length === 0) return null;

  // Mobile: horizontal scroll
  if (!isDesktop) {
    return (
      <section className="overflow-hidden">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {items.map((item, index) => (
            <div key={index} className="flex-none snap-center rounded-card bg-blue overflow-hidden">
              <USPCard title={item.title} body={item.body} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Desktop: continuous autoplay carousel
  return (
    <section className="overflow-hidden">
      <div
        ref={wrapperRef}
        className="flex cursor-grab active:cursor-grabbing select-none"
        style={{willChange: 'transform'}}
      >
        {items.map((item, index) => (
          <div key={index} className="flex-none">
            <USPCard title={item.title} body={item.body} />
          </div>
        ))}
      </div>
    </section>
  );
}
