interface ArrowLeftIconProps {
  className?: string;
}

export function ArrowLeftIcon({className}: ArrowLeftIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 51 51"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.3" filter="url(#filter0_b_arrow_left)">
        <circle cx="25.5" cy="25.5" r="24.5" stroke="currentColor" />
      </g>
      <path
        d="M29 17L21 25.5L29 34"
        stroke="currentColor"
        strokeWidth="2.32511"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <filter
          id="filter0_b_arrow_left"
          x="-3.5"
          y="-3.5"
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
