import {ArrowLeftIcon} from '@wakey/ui';

interface AssistantBackButtonProps {
  /** Callback when back button is clicked */
  onClick: () => void;
  /** Whether the button should be visible (false on first step) */
  visible: boolean;
}

/**
 * Back button for navigating to previous steps in the assistant conversation.
 * Positioned in the top-left of the conversation area.
 */
export function AssistantBackButton({
  onClick,
  visible,
}: AssistantBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!visible}
      aria-label="Go back to previous question"
      className={`
        w-10 h-10 md:w-12 md:h-12 text-sand
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
        hover:scale-110 hover:text-softorange
      `}
    >
      <ArrowLeftIcon className="w-full h-full" />
    </button>
  );
}
