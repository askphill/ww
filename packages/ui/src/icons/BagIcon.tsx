interface BagIconProps {
  className?: string;
}

export function BagIcon({className}: BagIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M14.9987 8V6C14.9987 4.34315 13.6555 3 11.9987 3C10.3418 3 8.99867 4.34315 8.99867 6V8M5.66428 21H18.3331C18.9459 21 19.4146 20.4537 19.3214 19.8479L17.6291 8.84794C17.5541 8.36011 17.1343 8 16.6407 8H7.35658C6.86301 8 6.44326 8.36011 6.36821 8.84794L4.67591 19.8479C4.58271 20.4537 5.05139 21 5.66428 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
