import {useEffect} from 'react';
import {CrossIcon} from '@wakey/ui';

interface AssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * Full-screen overlay for the AI shopping assistant
 * Renders below the header (z-40) with an animated gradient background
 */
export function AssistantOverlay({
  isOpen,
  onClose,
  children,
}: AssistantOverlayProps) {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const abortController = new AbortController();

    if (isOpen) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            onClose();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [onClose, isOpen]);

  return (
    <div
      className={`
        fixed inset-0 z-40
        transition-all duration-[400ms] ease-[var(--ease-out-expo)]
        ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
      `}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal={isOpen}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 assistant-gradient" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-10 h-10 md:w-12 md:h-12 text-sand transition-transform duration-200 hover:scale-110"
        aria-label="Close assistant"
      >
        <CrossIcon className="w-full h-full" />
      </button>

      {/* Content area */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 pt-20 md:pt-24">
        {children}
      </div>
    </div>
  );
}
