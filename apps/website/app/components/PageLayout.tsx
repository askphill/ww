import {useState} from 'react';
import type {
  CartApiQueryFragment,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {AssistantOverlay, AssistantMessage} from '~/components/assistant';

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
        <AssistantMessage message="Hey there, welcome to Wakey! I'm here to help you discover your perfect morning routine. Ready to find products that match your lifestyle?" />
      </AssistantOverlay>
    </Aside.Provider>
  );
}
