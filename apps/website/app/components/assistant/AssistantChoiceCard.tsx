import type {StepOption} from '~/lib/assistantSteps';

interface AssistantChoiceCardProps {
  /** The option to display */
  option: StepOption;
  /** Whether this card is selected */
  isSelected: boolean;
  /** Callback when card is clicked */
  onClick: () => void;
  /** Animation delay index for staggered entrance (0, 1, 2, etc.) */
  animationIndex?: number;
}

/**
 * Choice card component for assistant selection steps.
 * Shows option label and description with hover effects and selection indicator.
 */
export function AssistantChoiceCard({
  option,
  isSelected,
  onClick,
  animationIndex = 0,
}: AssistantChoiceCardProps) {
  // Calculate staggered animation delay (100ms per index)
  const animationDelay = `${animationIndex * 100}ms`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left p-6 rounded-card
        bg-sand/90 hover-scale
        border-2 transition-colors duration-200
        ${isSelected ? 'border-softorange' : 'border-transparent'}
        opacity-0
      `}
      style={{
        animation: 'fade-in 300ms ease-out forwards',
        animationDelay,
      }}
    >
      <span className="font-display text-s2 text-black block">
        {option.label}
      </span>
      {option.description && (
        <span className="font-body text-body-small text-black/70 mt-1 block">
          {option.description}
        </span>
      )}
    </button>
  );
}
