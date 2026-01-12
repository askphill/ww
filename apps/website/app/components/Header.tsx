import {Suspense} from 'react';
import {Await, useAsyncValue, Link} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {HamburgerIcon, LogoSmall} from '@wakey/ui';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  /** When true, renders inline instead of fixed position */
  inline?: boolean;
}

/**
 * Floating pill header with menu toggle (left), logo (center), and cart count (right)
 */
export function Header({cart, inline = false}: HeaderProps) {
  return (
    <header
      className={
        inline
          ? 'w-full flex justify-center'
          : 'fixed z-50 w-full flex justify-center p-4 md:p-6 pointer-events-none'
      }
      role="banner"
    >
      <div className={`flex items-center justify-between w-full max-w-[600px] bg-white rounded-[10px] px-2 py-2 ${inline ? '' : 'pointer-events-auto'}`}>
        <MenuToggleButton />
        <Link to="/" aria-label="Wakey home">
          <LogoSmall className="h-6 md:h-7" />
        </Link>
        <Suspense fallback={<CartButton count={0} />}>
          <Await resolve={cart}>
            <CartBadge />
          </Await>
        </Suspense>
      </div>
    </header>
  );
}

function HeaderButton({
  onClick,
  ariaLabel,
  ariaControls,
  ariaExpanded,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  ariaControls?: string;
  ariaExpanded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      className="
        rounded-full w-12 h-12
        bg-sand
        flex items-center justify-center
        text-s2 font-display
        hover-scale
        transition-transform
        cursor-pointer
      "
    >
      {children}
    </button>
  );
}

function MenuToggleButton() {
  const {open} = useAside();

  return (
    <HeaderButton
      onClick={() => open('mobile')}
      ariaLabel="Open menu"
      ariaControls="SiteMenuDrawer"
      ariaExpanded={false}
    >
      <HamburgerIcon className="w-5" />
    </HeaderButton>
  );
}

function CartButton({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart: analyticsCart, prevCart} = useAnalytics();

  return (
    <HeaderButton
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart: analyticsCart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      ariaLabel={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      ariaControls="CartDrawer"
    >
      {count}
    </HeaderButton>
  );
}

function CartBadge() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  const count = cart?.totalQuantity ?? 0;

  return <CartButton count={count} />;
}
