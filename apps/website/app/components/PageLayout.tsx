import {useState, useEffect} from 'react';
import type {
  CartApiQueryFragment,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Button} from '@wakey/ui';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {
  AssistantOverlay,
  AssistantMessage,
  AssistantChoiceCard,
  AssistantInput,
  AssistantWelcome,
  AssistantRecommendation,
  AssistantSummary,
} from '~/components/assistant';
import {ASSISTANT_STEPS, getStepById} from '~/lib/assistantSteps';
import type {ChoiceStep, MultiChoiceStep, InputStep, TextStep} from '~/lib/assistantSteps';
import {useAssistantFlow} from '~/hooks/useAssistantFlow';
import {getRecommendation} from '~/lib/getRecommendation';
import {saveRoutineToStorage} from '~/lib/routineStorage';

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
  const [hasAddedToCart, setHasAddedToCart] = useState(false);
  const {currentStepId, answers, next, back, reset, updateAnswer, isFirstStep} =
    useAssistantFlow();

  // Get the current step
  const currentStep = getStepById(currentStepId);

  // Save routine to localStorage when reaching the summary step
  useEffect(() => {
    if (currentStepId === 'summary') {
      const nameEmailAnswers = answers['name-email'];
      const name =
        typeof nameEmailAnswers === 'object'
          ? (nameEmailAnswers as Record<string, string>).name ?? ''
          : '';
      const email =
        typeof nameEmailAnswers === 'object'
          ? (nameEmailAnswers as Record<string, string>).email ?? ''
          : '';
      const recommendation = getRecommendation(answers);

      saveRoutineToStorage(name, email, answers, recommendation);
    }
  }, [currentStepId, answers]);

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
    updateAnswer(newSelections);
  };

  // Handle multi-choice submit
  const handleMultiChoiceSubmit = () => {
    // Advance with the current selections already stored in answers
    next(currentAnswer);
  };

  // Get current multi-choice selections as array
  const multiChoiceSelections = Array.isArray(currentAnswer)
    ? currentAnswer
    : [];

  // Handle input submit
  const handleInputSubmit = (values: Record<string, string>) => {
    next(values);
  };

  // Handle close - reset the conversation
  const handleClose = () => {
    setIsAssistantOpen(false);
    reset();
    setHasAddedToCart(false);
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
          {/* Message - skip for steps that render their own message (welcome, recommendation, summary) */}
          {currentStep &&
            currentStepId !== 'welcome' &&
            currentStepId !== 'recommendation' &&
            currentStepId !== 'summary' && (
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

          {/* Multi-choice cards for 'multi-choice' type steps */}
          {currentStep?.type === 'multi-choice' && (
            <>
              <div className="flex flex-col gap-3">
                {(currentStep as MultiChoiceStep).options.map(
                  (option, index) => (
                    <AssistantChoiceCard
                      key={option.value}
                      option={option}
                      isSelected={multiChoiceSelections.includes(option.value)}
                      onClick={() => handleMultiChoiceToggle(option.value)}
                      animationIndex={index + 1}
                    />
                  ),
                )}
              </div>
              {multiChoiceSelections.length > 0 && (
                <div
                  className="opacity-0"
                  style={{
                    animation: 'fade-in 300ms ease-out forwards',
                    animationDelay: `${((currentStep as MultiChoiceStep).options.length + 1) * 100}ms`,
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={handleMultiChoiceSubmit}
                    className="w-full"
                  >
                    {(currentStep as MultiChoiceStep).actionLabel}
                  </Button>
                </div>
              )}
            </>
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

          {/* Welcome step with SparkleIcon and primary button */}
          {currentStep?.type === 'text' && currentStepId === 'welcome' && (
            <AssistantWelcome
              message={currentStep.message}
              actionLabel={(currentStep as TextStep).actionLabel}
              onAction={() => next()}
            />
          )}

          {/* Recommendation step */}
          {currentStep?.type === 'recommendation' && (
            <>
              <AssistantRecommendation
                userName={
                  typeof answers['name-email'] === 'object'
                    ? (answers['name-email'] as Record<string, string>).name ?? 'there'
                    : 'there'
                }
                recommendation={getRecommendation(answers)}
                onAddedToCart={() => setHasAddedToCart(true)}
              />
              {/* Continue to summary button */}
              <div
                className="opacity-0"
                style={{
                  animation: 'fade-in 300ms ease-out forwards',
                  animationDelay: '1200ms',
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => next()}
                  className="w-full"
                >
                  See my routine
                </Button>
              </div>
            </>
          )}

          {/* Summary step */}
          {currentStep?.type === 'summary' && (
            <AssistantSummary
              userName={
                typeof answers['name-email'] === 'object'
                  ? (answers['name-email'] as Record<string, string>).name ?? 'there'
                  : 'there'
              }
              userEmail={
                typeof answers['name-email'] === 'object'
                  ? (answers['name-email'] as Record<string, string>).email ?? ''
                  : ''
              }
              answers={answers}
              recommendation={getRecommendation(answers)}
              alreadyAddedToCart={hasAddedToCart}
              onAddedToCart={() => setHasAddedToCart(true)}
            />
          )}
        </div>
      </AssistantOverlay>
    </Aside.Provider>
  );
}
