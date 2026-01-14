import {Suspense, useState, useEffect, useRef} from 'react';
import {Await, Link} from 'react-router';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {HamburgerIcon, MenuCloseIcon, LogoSmall, BagIcon, NotificationIcon} from '@wakey/ui';
import {NavigationDropdown} from '~/components/NavigationDropdown';
import {NotificationDropdown} from '~/components/NotificationDropdown';
import {AnnouncementBar} from '~/components/AnnouncementBar';
import {useNotifications} from '~/hooks/useNotifications';

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const {
    notifications,
    hasUnread,
    markAsRead,
    readIds,
  } = useNotifications();

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => {
      const next = !prev;
      // Close notifications when opening menu
      if (next) setIsNotificationsOpen(false);
      return next;
    });
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      // Close menu when opening notifications
      if (next) setIsMenuOpen(false);
      return next;
    });
  };

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
  };

  const isAnyDropdownOpen = isMenuOpen || isNotificationsOpen;

  // Handle dropdown side effects: click-outside-to-close and body scroll lock
  useEffect(() => {
    if (isAnyDropdownOpen) {
      // Lock body scroll when any dropdown is open
      document.body.classList.add('overflow-hidden');

      // Close dropdowns when clicking outside header area
      const handleClickOutside = (event: MouseEvent) => {
        if (
          headerRef.current &&
          !headerRef.current.contains(event.target as Node)
        ) {
          setIsMenuOpen(false);
          setIsNotificationsOpen(false);
        }
      };

      // Use mousedown for immediate response (before click completes)
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.classList.remove('overflow-hidden');
      };
    } else {
      // Ensure scroll is restored when dropdowns close
      document.body.classList.remove('overflow-hidden');
    }
  }, [isAnyDropdownOpen]);

  return (
    <header
      ref={headerRef}
      className={
        inline
          ? 'w-full flex flex-col items-center'
          : 'fixed z-50 w-full flex flex-col items-center md:px-6 md:pt-6 pointer-events-none'
      }
      role="banner"
    >
      {/* Header pill */}
      <div
        className={`flex items-center justify-between w-full md:max-w-[600px] h-14 md:h-auto bg-white md:rounded-card-s px-4 md:px-2 py-2 ${inline ? '' : 'pointer-events-auto'}`}
      >
        <MenuToggleButton isOpen={isMenuOpen} onToggle={handleMenuToggle} />
        <Link to="/" aria-label="Wakey home" onClick={handleMenuClose}>
          <LogoSmall className="h-6 md:h-7" />
        </Link>
        <div className="flex items-center gap-0.5">
          <NotificationButton
            hasUnread={hasUnread}
            isOpen={isNotificationsOpen}
            onToggle={handleNotificationsToggle}
          />
          <Suspense fallback={<CartButton count={0} onNavigate={handleMenuClose} />}>
            <Await resolve={cart}>
              {(cartData) => (
                <CartBadge cart={cartData} onNavigate={handleMenuClose} />
              )}
            </Await>
          </Suspense>
        </div>
      </div>

      {/* Navigation dropdown - positioned directly below header */}
      <div className={`w-full mt-2 ${inline ? '' : 'pointer-events-auto'}`}>
        <NavigationDropdown isOpen={isMenuOpen} onClose={handleMenuClose} />
        <NotificationDropdown
          isOpen={isNotificationsOpen}
          onClose={handleNotificationsClose}
          notifications={notifications}
          readIds={readIds}
          onMarkAsRead={markAsRead}
        />
      </div>

      {/* Announcement bar - hidden for now */}
      {/* <div
        className={`w-full transition-opacity duration-300 ${inline ? '' : 'pointer-events-auto'} ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <AnnouncementBar message="Free shipping on orders over €50" />
      </div> */}
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
        text-small font-display
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
      {isOpen ? (
        <MenuCloseIcon className="w-6" />
      ) : (
        <HamburgerIcon className="w-6" />
      )}
    </HeaderButton>
  );
}

interface NotificationButtonProps {
  hasUnread: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function NotificationButton({hasUnread, isOpen, onToggle}: NotificationButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? 'Close notifications' : 'Open notifications'}
      aria-controls="notification-dropdown"
      aria-expanded={isOpen}
      className="
        rounded-full w-8 h-8 md:w-12 md:h-12
        flex items-center justify-center
        hover-scale
        transition-transform
        cursor-pointer
        relative
      "
    >
      <NotificationIcon className="w-6" />
      {hasUnread && (
        <span className="absolute top-1 right-1 md:top-2.5 md:right-2.5 w-2 h-2 bg-softorange rounded-full" />
      )}
    </button>
  );
}

function CartButton({count, onNavigate}: {count: number; onNavigate?: () => void}) {
  return (
    <Link
      to="/cart"
      onClick={onNavigate}
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

function CartBadge({cart: originalCart, onNavigate}: {cart: CartApiQueryFragment | null; onNavigate?: () => void}) {
  const cart = useOptimisticCart(originalCart);
  const count = cart?.totalQuantity ?? 0;

  return <CartButton count={count} onNavigate={onNavigate} />;
}
