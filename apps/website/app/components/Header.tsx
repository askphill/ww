import {Suspense} from 'react';
import {Await, useAsyncValue, Link} from 'react-router';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {HamburgerIcon, LogoSmall, BagIcon} from '@wakey/ui';
import {NavigationDropdown} from '~/components/NavigationDropdown';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  /** When true, renders inline instead of fixed position */
  inline?: boolean;
  /** Whether the navigation dropdown is open */
  isMenuOpen?: boolean;
  /** Callback when the menu should close */
  onMenuClose?: () => void;
}

/**
 * Floating pill header with menu toggle (left), logo (center), and cart count (right)
 * Includes NavigationDropdown positioned directly below when open
 */
export function Header({
  cart,
  inline = false,
  isMenuOpen = false,
  onMenuClose,
}: HeaderProps) {
  return (
    <header
      className={
        inline
          ? 'w-full flex flex-col items-center'
          : 'fixed z-50 w-full flex flex-col items-center px-4 pt-4 md:px-6 md:pt-6 pointer-events-none'
      }
      role="banner"
    >
      {/* Header pill */}
      <div
        className={`flex items-center justify-between w-full max-w-[600px] h-14 md:h-auto bg-white rounded-card px-4 md:px-2 py-2 ${inline ? '' : 'pointer-events-auto'}`}
      >
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

      {/* Navigation dropdown - positioned directly below header */}
      <div className={`w-full mt-2 ${inline ? '' : 'pointer-events-auto'}`}>
        <NavigationDropdown isOpen={isMenuOpen} onClose={onMenuClose} />
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
        rounded-full w-8 h-8 md:w-12 md:h-12
        flex items-center justify-center
        text-label md:text-s2 font-display
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
      <HamburgerIcon className="w-6" />
    </HeaderButton>
  );
}

function CartButton({count}: {count: number}) {
  return (
    <Link
      to="/cart"
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className="
        rounded-full w-8 h-8 md:w-12 md:h-12
        flex items-center justify-center
        hover-scale
        transition-transform
        relative
      "
    >
      <BagIcon className="w-6" />
      {count > 0 && (
        <span className="absolute top-[3px] right-0.5 md:top-2 md:right-2 min-w-3.5 h-3.5 px-1 flex items-center justify-center bg-ocher text-black text-xs font-display rounded-full leading-none">
          {count}
        </span>
      )}
    </Link>
  );
}

function CartBadge() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  const count = cart?.totalQuantity ?? 0;

  return <CartButton count={count} />;
}
