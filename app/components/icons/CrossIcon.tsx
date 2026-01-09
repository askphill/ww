interface CrossIconProps {
  className?: string;
}

export function CrossIcon({className}: CrossIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 51 51"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.3" filter="url(#filter0_b_cross)">
        <circle cx="25.1973" cy="25.2734" r="24.5" stroke="currentColor" />
      </g>
      <path
        d="M17.2988 33.1719L33.0958 17.3749"
        stroke="currentColor"
        strokeWidth="2.32511"
      />
      <path
        d="M17.2988 17.375L33.0958 33.172"
        stroke="currentColor"
        strokeWidth="2.32511"
      />
      <defs>
        <filter
          id="filter0_b_cross"
          x="-3.80273"
          y="-3.72656"
          width="58"
          height="58"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImageFix" stdDeviation="2" />
          <feComposite
            in2="SourceAlpha"
            operator="in"
            result="effect1_backgroundBlur"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_backgroundBlur"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
