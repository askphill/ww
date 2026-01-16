import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type RefObject,
  type MouseEvent as ReactMouseEvent,
} from 'react';

interface SocialImage {
  src: string;
  alt?: string;
}

interface SocialSectionProps {
  heading?: string;
  hashtag?: string;
  footerText?: string;
  images: SocialImage[];
  lerpFactor?: number;
}

interface Position {
  x: number;
  y: number;
}

// Rotation classes for trail images
const rotationClasses = [
  'rotate-trail-1',
  'rotate-trail-2',
  'rotate-trail-3',
  'rotate-trail-4',
  'rotate-trail-5',
  'rotate-trail-6',
];

// Custom hook for mouse trail animation
function useMouseTrail(
  itemCount: number,
  lerpFactor: number,
  containerRef: RefObject<HTMLDivElement | null>,
  setImageOrder: React.Dispatch<React.SetStateAction<number[]>>,
) {
  const [positions, setPositions] = useState<Position[]>([]);

  const mouseRef = useRef({x: 0, y: 0});
  const positionsRef = useRef<Position[]>([]);
  const animationRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Convert lerpFactor (1-10) to actual lerp value
  const actualLerp = useMemo(() => {
    const baseLerp = lerpFactor / 10;
    if (typeof window === 'undefined') return baseLerp;
    const dprScale = 1 + (Math.min(window.devicePixelRatio, 2) - 1) * 0.5;
    return baseLerp * dprScale;
  }, [lerpFactor]);

  // Initialize positions to center
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const initialPositions = Array(itemCount).fill({x: centerX, y: centerY});
    positionsRef.current = initialPositions;
    setPositions(initialPositions);
    mouseRef.current = {x: centerX, y: centerY};
  }, [itemCount, containerRef]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimatingRef.current) return;

    const newPositions = positionsRef.current.map((pos, index) => {
      const target =
        index === 0 ? mouseRef.current : positionsRef.current[index - 1];

      return {
        x: pos.x + (target.x - pos.x) * actualLerp,
        y: pos.y + (target.y - pos.y) * actualLerp,
      };
    });

    positionsRef.current = newPositions;
    setPositions(newPositions);

    animationRef.current = requestAnimationFrame(animate);
  }, [actualLerp]);

  const startAnimation = useCallback(() => {
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      animate();
    }
  }, [animate]);

  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      startAnimation();

      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = window.setTimeout(stopAnimation, 3000);
    },
    [containerRef, startAnimation, stopAnimation],
  );

  const handleMouseLeave = useCallback(() => {
    resetTimeoutRef.current = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: rect.width / 2,
        y: rect.height / 2,
      };
    }, 1000);
  }, [containerRef]);

  const handleMouseEnter = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
  }, []);

  // Cycle order: move last image to first position
  const cycleOrder = useCallback(() => {
    setImageOrder((prev) => {
      const last = prev[prev.length - 1];
      return [last, ...prev.slice(0, -1)];
    });
    // Also cycle positions so the new first image gets the lead position
    const lastPos = positionsRef.current[positionsRef.current.length - 1];
    positionsRef.current = [lastPos, ...positionsRef.current.slice(0, -1)];
    setPositions([...positionsRef.current]);
  }, [setImageOrder]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return {
    positions,
    handleMouseMove,
    handleMouseLeave,
    handleMouseEnter,
    cycleOrder,
  };
}

// Trail image component
function TrailImage({
  image,
  position,
  zIndex,
  index,
  onClick,
}: {
  image: SocialImage;
  position: Position;
  zIndex: number;
  index: number;
  onClick: () => void;
}) {
  const rotationClass = rotationClasses[index % rotationClasses.length];

  return (
    <div
      className="absolute cursor-pointer w-1/5 aspect-3/4"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`,
        zIndex,
      }}
      onClick={onClick}
    >
      <div
        className={`w-full h-full overflow-hidden ${rotationClass} transition-transform duration-300 active:scale-75 active:-rotate-12`}
      >
        <img
          src={image.src}
          alt={image.alt || ''}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
}

// Mouse trail container (desktop)
function MouseTrail({
  images: initialImages,
  lerpFactor,
  className,
}: {
  images: SocialImage[];
  lerpFactor: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageOrder, setImageOrder] = useState<number[]>(() =>
    initialImages.map((_, i) => i),
  );

  const {
    positions,
    handleMouseMove,
    handleMouseLeave,
    handleMouseEnter,
    cycleOrder,
  } = useMouseTrail(
    initialImages.length,
    lerpFactor,
    containerRef,
    setImageOrder,
  );

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {imageOrder.map((imageIndex, positionIndex) => (
        <TrailImage
          key={imageIndex}
          image={initialImages[imageIndex]}
          position={positions[positionIndex] || {x: 0, y: 0}}
          zIndex={initialImages.length - positionIndex}
          index={imageIndex}
          onClick={cycleOrder}
        />
      ))}
    </div>
  );
}

// Mobile carousel
function MobileCarousel({
  images,
  className,
}: {
  images: SocialImage[];
  className?: string;
}) {
  return (
    <div className={`relative flex-1 flex items-end pb-8 ${className || ''}`}>
      <div className="w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        <div className="flex gap-4 pl-4">
          {images.map((image, index) => (
            <div key={index} className="flex-shrink-0 w-4/5 snap-center">
              <div className="aspect-3/4 overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt || ''}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
          {/* Spacer for end padding */}
          <div className="flex-shrink-0 w-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// Main section component
export function SocialSection({
  heading = 'Get featured',
  hashtag = '#wakeycare',
  footerText = 'Posts loaded from @wakey.care',
  images,
  lerpFactor = 2,
}: SocialSectionProps) {
  return (
    <section className="bg-softorange text-black min-h-dvh relative flex flex-col justify-between overflow-hidden">
      {/* Heading */}
      <header className="relative z-10 pt-12 text-center md:pt-20">
        <h2 className="text-h2 font-display">
          {heading}
          <br />
          <span className="italic">{hashtag}</span>
        </h2>
      </header>

      {/* Desktop: Mouse Trail */}
      <MouseTrail
        images={images}
        lerpFactor={lerpFactor}
        className="hidden md:block"
      />

      {/* Mobile: Carousel */}
      <MobileCarousel images={images} className="md:hidden" />

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center md:pb-12">
        <p className="text-small">{footerText}</p>
      </footer>
    </section>
  );
}
