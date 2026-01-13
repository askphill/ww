interface AnnouncementBarProps {
  message: string;
}

/**
 * Promotional announcement bar displayed below the header
 * Uses the same centering and max-width as the header for visual alignment
 */
export function AnnouncementBar({message}: AnnouncementBarProps) {
  return (
    <div className="w-full flex justify-center px-4 md:px-6">
      <div className="w-full max-w-[600px] bg-ocher rounded-card px-4 md:px-6 py-2 text-center">
        <p className="text-black font-display text-small">{message}</p>
      </div>
    </div>
  );
}
