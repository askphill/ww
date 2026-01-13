interface AnnouncementBarProps {
  message: string;
}

/**
 * Promotional announcement bar displayed below the header
 * Uses the same centering and max-width as the header for visual alignment
 * Text scrolls continuously using marquee animation
 */
export function AnnouncementBar({message}: AnnouncementBarProps) {
  return (
    <div className="w-full flex justify-center px-4 md:px-6">
      <div className="w-full max-w-[600px] bg-ocher rounded-card py-2 overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          <span className="text-black font-display text-small px-8">
            {message}
          </span>
          <span className="text-black font-display text-small px-8">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
