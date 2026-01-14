import {useState} from 'react';
import type {
  CartApiQueryFragment,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {
  AssistantOverlay,
  AssistantMessage,
  AssistantChoiceCard,
  AssistantInput,
} from '~/components/assistant';
import {ASSISTANT_STEPS, getStepById} from '~/lib/assistantSteps';
import type {ChoiceStep, MultiChoiceStep, InputStep} from '~/lib/assistantSteps';
import {useAssistantFlow} from '~/hooks/useAssistantFlow';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  header,
  isLoggedIn,
}: PageLayoutProps) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const {currentStepId, answers, next, back, reset, isFirstStep} =
    useAssistantFlow();

  // Get the current step
  const currentStep = getStepById(currentStepId);

  // Get selected value for current step (for pre-selecting when going back)
  const currentAnswer = answers[currentStepId];

  // Handle choice selection
  const handleChoiceSelect = (value: string) => {
    next(value);
  };

  // Handle multi-choice selection (toggle)
  const handleMultiChoiceToggle = (value: string) => {
    const currentSelections = (currentAnswer as string[] | undefined) ?? [];
    const isSelected = currentSelections.includes(value);
    const newSelections = isSelected
      ? currentSelections.filter((v) => v !== value)
      : [...currentSelections, value];
    // Store but don't advance - user clicks "Next" button for multi-choice
    // For now, just store the updated selections
    // The next() will be called when clicking a submit button
  };

  // Handle input submit
  const handleInputSubmit = (values: Record<string, string>) => {
    next(values);
  };

  // Handle close - reset the conversation
  const handleClose = () => {
    setIsAssistantOpen(false);
    reset();
  };

  return (
    <Aside.Provider>
      {header && (
        <Header
          cart={cart}
          onAssistantToggle={() => setIsAssistantOpen(true)}
        />
      )}
      <main>{children}</main>
      <Footer />
      <AssistantOverlay
        isOpen={isAssistantOpen}
        onClose={handleClose}
        showBackButton={!isFirstStep}
        onBack={back}
      >
        <div className="flex flex-col gap-4 max-w-md w-full">
          {/* Message */}
          {currentStep && (
            <AssistantMessage
              message={currentStep.message}
              key={currentStepId}
            />
          )}

          {/* Choice cards for 'choice' type steps */}
          {currentStep?.type === 'choice' && (
            <div className="flex flex-col gap-3">
              {(currentStep as ChoiceStep).options.map((option, index) => (
                <AssistantChoiceCard
                  key={option.value}
                  option={option}
                  isSelected={currentAnswer === option.value}
                  onClick={() => handleChoiceSelect(option.value)}
                  animationIndex={index + 1}
                />
              ))}
            </div>
          )}

          {/* Input fields for 'input' type steps */}
          {currentStep?.type === 'input' && (
            <AssistantInput
              fields={(currentStep as InputStep).fields}
              submitLabel={(currentStep as InputStep).actionLabel}
              onSubmit={handleInputSubmit}
              animationIndex={1}
              initialValues={
                currentAnswer && typeof currentAnswer === 'object'
                  ? (currentAnswer as Record<string, string>)
                  : undefined
              }
            />
          )}

          {/* Welcome step - "Let's go" button handled elsewhere (US-011) */}
          {currentStep?.type === 'text' && currentStepId === 'welcome' && (
            <button
              type="button"
              onClick={() => next()}
              className="bg-softorange text-black font-display text-label px-8 py-4 rounded-card hover-scale opacity-0"
              style={{
                animation: 'fade-in 300ms ease-out forwards',
                animationDelay: '100ms',
              }}
            >
              Let&apos;s go
            </button>
          )}
        </div>
      </AssistantOverlay>
    </Aside.Provider>
  );
}
