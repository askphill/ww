interface CheckCircleIconProps {
  className?: string;
  fill?: string;
}

export function CheckCircleIcon({
  className = '',
  fill = 'var(--color-yellow)',
}: CheckCircleIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Success checkmark"
      className={className}
    >
      <circle cx="11.7783" cy="11.7783" r="11.7783" fill={fill} />
      <path
        d="M7.74854 11.7126L10.479 14.4431L15.8083 9.11377"
        stroke="black"
      />
    </svg>
  );
}
