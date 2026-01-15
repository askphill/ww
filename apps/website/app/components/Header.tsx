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

  const closeAllDropdowns = () => {
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  const handleMenuToggle = () => {
    // If notifications are open, close them (this button acts as "Close" for notifications too)
    if (isNotificationsOpen) {
      setIsNotificationsOpen(false);
      return;
    }
    
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (next) setIsNotificationsOpen(false);
      return next;
    });
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (next) setIsMenuOpen(false);
      return next;
    });
  };

  const isAnyDropdownOpen = isMenuOpen || isNotificationsOpen;

  // Handle dropdown side effects: click-outside-to-close, escape key, and body scroll lock
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
          closeAllDropdowns();
        }
      };

      // Close dropdowns when pressing Escape key
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          closeAllDropdowns();
        }
      };

      // Use mousedown for immediate response (before click completes)
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
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
      {/* Overlay - visible when any dropdown is open */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isAnyDropdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeAllDropdowns}
        aria-hidden="true"
      />

      {/* Header pill */}
      <div
        className={`relative z-10 grid grid-cols-[1fr_auto_1fr] items-center w-full md:max-w-[600px] h-14 md:h-auto bg-white md:rounded-card-s px-4 md:px-2 py-2 ${inline ? '' : 'pointer-events-auto'}`}
      >
        {/* Left side: Menu */}
        <div className="flex items-center gap-0.5 justify-self-start">
          <MenuToggleButton 
            isMenuOpen={isMenuOpen} 
            isNotificationsOpen={isNotificationsOpen} 
            onToggle={handleMenuToggle} 
          />
        </div>
        {/* Center: Logo */}
        <Link to="/" aria-label="Wakey home" onClick={closeAllDropdowns} className="justify-self-center">
          <LogoSmall className="h-6 md:h-7" />
        </Link>
        {/* Right side: Notifications + Cart */}
        <div className="flex items-center gap-0.5 justify-self-end">
          <NotificationButton
            hasUnread={hasUnread}
            isOpen={isNotificationsOpen}
            onToggle={handleNotificationsToggle}
          />
          <Suspense fallback={<CartButton count={0} onNavigate={closeAllDropdowns} />}>
            <Await resolve={cart}>
              {(cartData) => (
                <CartBadge cart={cartData} onNavigate={closeAllDropdowns} />
              )}
            </Await>
          </Suspense>
        </div>
      </div>

      {/* Navigation dropdown - positioned directly below header */}
      <div className={`relative z-10 w-full mt-2 ${inline ? '' : 'pointer-events-auto'}`}>
        <NavigationDropdown isOpen={isMenuOpen} onClose={closeAllDropdowns} />
        <NotificationDropdown
          isOpen={isNotificationsOpen}
          onClose={closeAllDropdowns}
          notifications={notifications}
          readIds={readIds}
          onMarkAsRead={markAsRead}
        />
      </div>

      {/* Announcement bar - hidden when any dropdown is open */}
     {/* <div
        className={`w-full transition-opacity duration-300 ${inline ? '' : 'pointer-events-auto'} ${isAnyDropdownOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <AnnouncementBar message="Free shipping on orders over €50" />
      </div>  */}
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
  isMenuOpen: boolean;
  isNotificationsOpen: boolean;
  onToggle: () => void;
}

function MenuToggleButton({isMenuOpen, isNotificationsOpen, onToggle}: MenuToggleButtonProps) {
  // Show close icon if either menu OR notifications is open
  const showClose = isMenuOpen || isNotificationsOpen;
  
  return (
    <HeaderButton
      onClick={onToggle}
      ariaLabel={showClose ? 'Close menu' : 'Open menu'}
      ariaControls="navigation-dropdown"
      ariaExpanded={isMenuOpen}
    >
      {showClose ? (
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
        <span className="absolute top-1 right-1 md:top-2.5 md:right-2.5 w-2 h-2 bg-softorange rounded-full" />
      )}
    </Link>
  );
}

function CartBadge({cart: originalCart, onNavigate}: {cart: CartApiQueryFragment | null; onNavigate?: () => void}) {
  const cart = useOptimisticCart(originalCart);
  const count = cart?.totalQuantity ?? 0;

  return <CartButton count={count} onNavigate={onNavigate} />;
}
