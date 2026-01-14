interface NotificationIconProps {
  className?: string;
}

export function NotificationIcon({className}: NotificationIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M9.5 19C9.5 20.3807 10.6193 21.5 12 21.5C13.3807 21.5 14.5 20.3807 14.5 19M5.58333 16H18.4167C19.1531 16 19.75 15.4031 19.75 14.6667C19.75 14.2246 19.5566 13.8054 19.2222 13.5185L18.4167 12.8281V9C18.4167 5.41015 15.5431 2.5 12 2.5C8.45685 2.5 5.58333 5.41015 5.58333 9V12.8281L4.77778 13.5185C4.4434 13.8054 4.25 14.2246 4.25 14.6667C4.25 15.4031 4.84695 16 5.58333 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
