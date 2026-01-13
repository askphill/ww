import {Suspense, useState, useEffect, useRef} from 'react';
import {Await, useAsyncValue, Link} from 'react-router';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {HamburgerIcon, LogoSmall, BagIcon} from '@wakey/ui';
import {NavigationDropdown} from '~/components/NavigationDropdown';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  /** When true, renders inline instead of fixed position */
  inline?: boolean;
}

/**
 * Floating pill header with menu toggle (left), logo (center), and cart count (right)
 * Includes NavigationDropdown positioned directly below when open
 * Manages its own menu open/close state internally
 */
export function Header({cart, inline = false}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside header area
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Use mousedown for immediate response (before click completes)
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup: always restore scroll on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMenuOpen]);

  return (
    <header
      ref={headerRef}
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
        <MenuToggleButton isOpen={isMenuOpen} onToggle={handleMenuToggle} />
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
        <NavigationDropdown isOpen={isMenuOpen} onClose={handleMenuClose} />
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

interface MenuToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

function MenuToggleButton({isOpen, onToggle}: MenuToggleButtonProps) {
  return (
    <HeaderButton
      onClick={onToggle}
      ariaLabel={isOpen ? 'Close menu' : 'Open menu'}
      ariaControls="navigation-dropdown"
      ariaExpanded={isOpen}
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
