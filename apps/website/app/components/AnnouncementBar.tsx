interface AnnouncementBarProps {
  message: string;
}

/**
 * Promotional announcement bar displayed below the header
 * Uses the same centering and max-width as the header for visual alignment
 * Text scrolls continuously using marquee animation
 */
export function AnnouncementBar({message}: AnnouncementBarProps) {
  // Create enough copies to ensure seamless scrolling
  const copies = Array(8).fill(message);

  return (
    <div className="w-full flex justify-center md:px-6">
      <div className="w-full max-w-[600px] bg-ocher rounded-card py-2 overflow-hidden flex items-center">
        <div className="animate-marquee inline-flex whitespace-nowrap items-center">
          {copies.map((text, i) => (
            <span key={i} className="text-black font-display text-small px-8 uppercase leading-none">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
