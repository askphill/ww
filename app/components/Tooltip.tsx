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
}

export function Tooltip({
  product,
  position,
  className = '',
}: TooltipProps) {
  const positionStyle = position || {top: '33%', left: '19%'};

  const hasReviews = product.reviewCount && product.reviewRating;
  const hasSubtitle = product.subtitle;

  return (
    <div className={`absolute z-10 ${className}`} style={positionStyle}>
      <a
        href={product.url}
        className="flex items-stretch border border-sand/50 rounded-xl bg-sand/[0.02] backdrop-blur-[15px] hover:scale-105 active:scale-95 transition-transform"
      >
        {/* Image container */}
        <div className="flex items-center justify-center p-1.5 md:p-2">
          <img
            src={product.image}
            alt={product.title}
            className="w-8 md:w-12 h-auto"
          />
        </div>

        {/* Info - hidden on mobile */}
        <div className="hidden md:flex flex-col justify-center pr-5 py-2 text-sand">
          <div className="text-lg uppercase font-display tracking-tight leading-none">
            {product.title}
          </div>
          {(hasSubtitle || hasReviews) && (
            <div className="flex items-center gap-1.5 mt-0.5 leading-none font-display">
              {hasSubtitle && (
                <span className="text-sm">{product.subtitle}</span>
              )}
              {hasReviews && (
                <div className="flex items-center">
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

function Stars({rating}: {rating: number}) {
  const fullStars = Math.floor(rating);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3 h-3"
          viewBox="0 0 13 12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.97652 0.436761C6.16518 -0.142105 6.9841 -0.142103 7.17276 0.436762L8.12016 3.34365C8.20455 3.60257 8.44596 3.7778 8.71829 3.7778H11.78C12.3899 3.7778 12.643 4.5586 12.1491 4.91636L9.67537 6.70811C9.45421 6.8683 9.36166 7.15288 9.44628 7.41252L10.3919 10.314C10.5807 10.8933 9.91818 11.3758 9.42478 11.0184L6.94367 9.22132C6.7235 9.06185 6.42579 9.06185 6.20562 9.22132L3.72451 11.0184C3.2311 11.3758 2.56857 10.8933 2.75736 10.314L3.70301 7.41252C3.78763 7.15288 3.69507 6.8683 3.47391 6.70811L1.00022 4.91636C0.506299 4.5586 0.759372 3.7778 1.36925 3.7778H4.431C4.70332 3.7778 4.94473 3.60257 5.02912 3.34365L5.97652 0.436761Z"
            fill={star <= fullStars ? '#FFF5EB' : 'rgba(255,245,235,0.3)'}
          />
        </svg>
      ))}
    </div>
  );
}
