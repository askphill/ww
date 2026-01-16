import {Stars} from './Stars';

interface TooltipProps {
  product: {
    title: string;
    url: string;
    image: string;
    subtitle?: string | null;
    reviewCount?: number | null;
    reviewRating?: number | null;
  };
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  className?: string;
  /** Set to true for above-the-fold tooltips to prioritize LCP */
  priority?: boolean;
}

export function Tooltip({
  product,
  position,
  className = '',
  priority = false,
}: TooltipProps) {
  const positionStyle = position || {top: '33%', left: '19%'};

  const hasReviews = product.reviewCount && product.reviewRating;
  const hasSubtitle = product.subtitle;

  return (
    <div className={`absolute z-[7] ${className}`} style={positionStyle}>
      <a
        href={product.url}
        className="flex items-stretch blur-bg rounded-card hover:scale-105 active:scale-95 transition-transform"
      >
        {/* Image container */}
        <div className="flex items-center justify-center p-1.5 md:p-2">
          <img
            src={product.image}
            alt={product.title}
            className="w-12 h-auto"
            fetchPriority={priority ? 'high' : undefined}
          />
        </div>

        {/* Info - hidden on mobile */}
        <div className="hidden md:flex flex-col justify-center pr-5 py-2 text-sand gap-1">
          <div className="text-base uppercase font-display tracking-tight leading-none">
            {product.title}
          </div>
          {(hasSubtitle || hasReviews) && (
            <div className="flex items-center gap-1.5 leading-none">
              {hasSubtitle && (
                <span className="text-base font-body italic leading-none">
                  {product.subtitle}
                </span>
              )}
              {hasReviews && (
                <div className="flex items-center font-display">
                  <Stars rating={product.reviewRating!} />
                  <span className="text-xs ml-1">({product.reviewCount})</span>
                </div>
              )}
            </div>
          )}
        </div>
      </a>
    </div>
  );
}
