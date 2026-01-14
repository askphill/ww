interface SparkleIconProps {
  className?: string;
}

export function SparkleIcon({className}: SparkleIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main 4-point star */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="currentColor"
      />
      {/* Small accent sparkle top-right */}
      <path
        d="M19 2L19.5 4L21.5 4.5L19.5 5L19 7L18.5 5L16.5 4.5L18.5 4L19 2Z"
        fill="currentColor"
      />
      {/* Small accent sparkle bottom-right */}
      <path
        d="M20 15L20.4 16.6L22 17L20.4 17.4L20 19L19.6 17.4L18 17L19.6 16.6L20 15Z"
        fill="currentColor"
      />
    </svg>
  );
}
