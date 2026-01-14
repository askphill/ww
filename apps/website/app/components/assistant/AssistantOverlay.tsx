interface AssistantOverlayProps {
  isOpen: boolean;
  children?: React.ReactNode;
}

/**
 * Full-screen overlay for the AI shopping assistant
 * Renders below the header (z-40) with an animated gradient background
 */
export function AssistantOverlay({isOpen, children}: AssistantOverlayProps) {
  return (
    <div
      className={`
        fixed inset-0 z-40
        transition-opacity duration-300 ease-out
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      aria-hidden={!isOpen}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 assistant-gradient" />

      {/* Content area */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 pt-20 md:pt-24">
        {children}
      </div>
    </div>
  );
}
