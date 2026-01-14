import {useState, useEffect} from 'react';

interface AssistantMessageProps {
  message: string;
  /** Delay before showing the message (typing indicator duration) - defaults to 800ms */
  typingDelay?: number;
  /** Skip the typing indicator and show message immediately */
  skipTyping?: boolean;
}

/**
 * Chat bubble component for assistant messages
 * Shows a typing indicator (3 animated dots) before revealing the message
 */
export function AssistantMessage({
  message,
  typingDelay = 800,
  skipTyping = false,
}: AssistantMessageProps) {
  const [isTyping, setIsTyping] = useState(!skipTyping);

  useEffect(() => {
    if (skipTyping) {
      setIsTyping(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsTyping(false);
    }, typingDelay);

    return () => clearTimeout(timer);
  }, [typingDelay, skipTyping]);

  return (
    <div className="bg-sand/90 text-black rounded-card p-6 max-w-md">
      {isTyping ? (
        <div className="flex items-center gap-1 h-6">
          <span
            className="w-2 h-2 bg-black/60 rounded-full animate-bounce"
            style={{animationDelay: '0ms', animationDuration: '600ms'}}
          />
          <span
            className="w-2 h-2 bg-black/60 rounded-full animate-bounce"
            style={{animationDelay: '150ms', animationDuration: '600ms'}}
          />
          <span
            className="w-2 h-2 bg-black/60 rounded-full animate-bounce"
            style={{animationDelay: '300ms', animationDuration: '600ms'}}
          />
        </div>
      ) : (
        <p
          className="font-display text-s2 leading-relaxed animate-fade-in"
          style={{animation: 'fade-in 300ms ease-out'}}
        >
          {message}
        </p>
      )}
    </div>
  );
}
