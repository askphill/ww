interface SmileyIconProps {
  className?: string;
}

export function SmileyIcon({className = ''}: SmileyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      role="img"
      aria-label="Smiley face"
      className={className}
    >
      <rect width="256" height="256" fill="transparent" />
      {/* Face */}
      <circle
        cx="128"
        cy="128"
        r="110"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="12"
      />
      {/* Eyes */}
      <circle cx="88" cy="108" r="12" fill="currentColor" />
      <circle cx="168" cy="108" r="12" fill="currentColor" />
      {/* Smile */}
      <path
        d="M76 160 A64 48 0 0 0 180 160"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  );
}
