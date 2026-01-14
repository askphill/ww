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
  AssistantInput,
} from '~/components/assistant';
import {ASSISTANT_STEPS} from '~/lib/assistantSteps';
import type {InputStep} from '~/lib/assistantSteps';

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

  // Get the name-email step for testing input component
  const inputStep = ASSISTANT_STEPS.find(
    (step) => step.id === 'name-email',
  ) as InputStep | undefined;

  const handleInputSubmit = (values: Record<string, string>) => {
    console.log('Form submitted:', values);
    // In production, this would advance to the next step
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
        onClose={() => setIsAssistantOpen(false)}
      >
        <div className="flex flex-col gap-4 max-w-md">
          <AssistantMessage message={inputStep?.message ?? ''} />
          {inputStep && (
            <AssistantInput
              fields={inputStep.fields}
              submitLabel={inputStep.actionLabel}
              onSubmit={handleInputSubmit}
              animationIndex={1}
            />
          )}
        </div>
      </AssistantOverlay>
    </Aside.Provider>
  );
}
