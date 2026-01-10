import {Suspense} from 'react';
import {Await, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {HamburgerIcon} from '~/components/icons';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  color?: 'default' | 'sand' | 'white';
}

/**
 * Floating glass button header with menu toggle (left) and cart count (right)
 */
export function Header({cart, color = 'default'}: HeaderProps) {
  return (
    <header
      className="fixed z-10 w-full flex justify-between p-4 md:p-8 pointer-events-none"
      role="banner"
    >
      <MenuToggleButton color={color} />
      <Suspense
        fallback={
          <HeaderButton color={color} onClick={() => {}} ariaLabel="Cart">
            0
          </HeaderButton>
        }
      >
        <Await resolve={cart}>
          <CartBadge color={color} />
        </Await>
      </Suspense>
    </header>
  );
}

type HeaderButtonColor = 'default' | 'sand' | 'white';

interface HeaderButtonProps {
  onClick: () => void;
  ariaLabel: string;
  ariaControls?: string;
  ariaExpanded?: boolean;
  children: React.ReactNode;
  color?: HeaderButtonColor;
}

function HeaderButton({
  onClick,
  ariaLabel,
  ariaControls,
  ariaExpanded,
  children,
  color = 'default',
}: HeaderButtonProps) {
  const colorClasses: Record<HeaderButtonColor, string> = {
    default: 'bg-white/20 text-text',
    sand: 'bg-white/20 text-sand',
    white: 'bg-white text-text',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      className={`
        rounded-full w-10 h-10 md:w-[3.125rem] md:h-[3.125rem]
        ${colorClasses[color]}
        backdrop-blur-[15px]
        flex items-center justify-center
        text-s2 font-display
        pointer-events-auto
        hover-scale
        transition-transform
        cursor-pointer
      `}
    >
      {children}
    </button>
  );
}

function MenuToggleButton({color}: {color: HeaderButtonColor}) {
  const {open} = useAside();

  return (
    <HeaderButton
      onClick={() => open('mobile')}
      ariaLabel="Open menu"
      ariaControls="SiteMenuDrawer"
      ariaExpanded={false}
      color={color}
    >
      <HamburgerIcon className="w-5 md:w-6" />
    </HeaderButton>
  );
}

function CartBadge({color}: {color: HeaderButtonColor}) {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  const {open} = useAside();
  const {publish, shop, cart: analyticsCart, prevCart} = useAnalytics();

  const count = cart?.totalQuantity ?? 0;

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
      color={color}
    >
      {count}
    </HeaderButton>
  );
}
