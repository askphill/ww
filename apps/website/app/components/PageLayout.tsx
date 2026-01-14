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
} from '~/components/assistant';
import {ASSISTANT_STEPS} from '~/lib/assistantSteps';
import type {ChoiceStep} from '~/lib/assistantSteps';

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
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Get the interest-area step for testing choice cards
  const interestStep = ASSISTANT_STEPS.find(
    (step) => step.id === 'interest-area',
  ) as ChoiceStep | undefined;

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
        onClose={() => setIsAssistantOpen(false)}
      >
        <div className="flex flex-col gap-4 max-w-md">
          <AssistantMessage message={interestStep?.message ?? ''} />
          <div className="flex flex-col gap-3 mt-2">
            {interestStep?.options.map((option, index) => (
              <AssistantChoiceCard
                key={option.value}
                option={option}
                isSelected={selectedChoice === option.value}
                onClick={() => setSelectedChoice(option.value)}
                animationIndex={index}
              />
            ))}
          </div>
        </div>
      </AssistantOverlay>
    </Aside.Provider>
  );
}
