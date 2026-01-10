interface HamburgerIconProps {
  className?: string;
}

export function HamburgerIcon({className}: HamburgerIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="0.649216"
        y1="1.09095"
        x2="19.6529"
        y2="1.09095"
        stroke="currentColor"
        strokeWidth="1.86009"
      />
      <line
        x1="0.649216"
        y1="7.91126"
        x2="19.6529"
        y2="7.91126"
        stroke="currentColor"
        strokeWidth="1.86009"
      />
    </svg>
  );
}
