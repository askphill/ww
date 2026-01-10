interface StarsProps {
  rating: number;
  color?: 'sand' | 'black';
  size?: 'sm' | 'md';
}

export function Stars({rating, color = 'sand', size = 'sm'}: StarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  const fillColor = color === 'sand' ? '#FFF5EB' : '#1A1A1A';
  const emptyColor =
    color === 'sand' ? 'rgba(255,245,235,0.3)' : 'rgba(26,26,26,0.2)';
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  const starPath =
    'M5.97652 0.436761C6.16518 -0.142105 6.9841 -0.142103 7.17276 0.436762L8.12016 3.34365C8.20455 3.60257 8.44596 3.7778 8.71829 3.7778H11.78C12.3899 3.7778 12.643 4.5586 12.1491 4.91636L9.67537 6.70811C9.45421 6.8683 9.36166 7.15288 9.44628 7.41252L10.3919 10.314C10.5807 10.8933 9.91818 11.3758 9.42478 11.0184L6.94367 9.22132C6.7235 9.06185 6.42579 9.06185 6.20562 9.22132L3.72451 11.0184C3.2311 11.3758 2.56857 10.8933 2.75736 10.314L3.70301 7.41252C3.78763 7.15288 3.69507 6.8683 3.47391 6.70811L1.00022 4.91636C0.506299 4.5586 0.759372 3.7778 1.36925 3.7778H4.431C4.70332 3.7778 4.94473 3.60257 5.02912 3.34365L5.97652 0.436761Z';

  const getStarFill = (starIndex: number) => {
    if (starIndex <= fullStars) return 'full';
    if (starIndex === fullStars + 1 && hasHalfStar) return 'half';
    return 'empty';
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = getStarFill(star);

        return (
          <svg
            key={star}
            className={sizeClass}
            viewBox="0 0 13 12"
            xmlns="http://www.w3.org/2000/svg"
          >
            {fill === 'half' ? (
              <>
                <defs>
                  <clipPath id={`half-star-${star}`}>
                    <rect x="0" y="0" width="6.5" height="12" />
                  </clipPath>
                </defs>
                {/* Empty star background */}
                <path d={starPath} fill={emptyColor} />
                {/* Half filled star */}
                <path
                  d={starPath}
                  fill={fillColor}
                  clipPath={`url(#half-star-${star})`}
                />
              </>
            ) : (
              <path
                d={starPath}
                fill={fill === 'full' ? fillColor : emptyColor}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}
