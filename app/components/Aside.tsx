import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A drawer component with backdrop overlay
 * Slides from left (mobile menu) or right (cart/search)
 */
export function Aside({
  children,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;

  // Determine slide direction based on type
  const isLeftDrawer = type === 'mobile';

  // Body scroll lock
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [expanded]);

  // Escape key handler
  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-60 bg-black/50 backdrop-blur-[15px] transition-opacity duration-[400ms] ease-[var(--ease-out-expo)] ${
          expanded
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 z-70 h-dvh w-full md:w-[var(--drawer-width)] flex flex-col transition-transform duration-[400ms] ease-[var(--ease-out-expo)] ${
          isLeftDrawer ? 'left-0' : 'right-0'
        } ${
          expanded
            ? 'translate-x-0'
            : isLeftDrawer
              ? '-translate-x-full'
              : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal={expanded}
      >
        {children}
      </aside>
    </>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
