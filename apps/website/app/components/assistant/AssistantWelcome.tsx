import {Button, SparkleIcon} from '@wakey/ui';
import {AssistantMessage} from './AssistantMessage';

interface AssistantWelcomeProps {
  /** Message to display */
  message: string;
  /** Label for the action button */
  actionLabel: string;
  /** Callback when the action button is clicked */
  onAction: () => void;
}

/**
 * Welcome step component for the assistant
 * Shows SparkleIcon above the message with a primary action button
 */
export function AssistantWelcome({
  message,
  actionLabel,
  onAction,
}: AssistantWelcomeProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* SparkleIcon displayed above the message */}
      <div
        className="w-16 h-16 text-softorange opacity-0"
        style={{
          animation: 'fade-in 300ms ease-out forwards',
        }}
      >
        <SparkleIcon className="w-full h-full" />
      </div>

      {/* Assistant message bubble */}
      <AssistantMessage message={message} />

      {/* Primary action button */}
      <div
        className="opacity-0 mt-2"
        style={{
          animation: 'fade-in 300ms ease-out forwards',
          animationDelay: '900ms',
        }}
      >
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
