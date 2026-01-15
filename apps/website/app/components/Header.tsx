import {Suspense, useState, useEffect} from 'react';
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

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      // Close menu when opening notifications
      if (next) setIsMenuOpen(false);
      return next;
    });
  };

  const isAnyDropdownOpen = isMenuOpen || isNotificationsOpen;

  // Handle dropdown side effects: escape key and body scroll lock
  useEffect(() => {
    if (isAnyDropdownOpen) {
      // Lock body scroll when any dropdown is open
      document.body.classList.add('overflow-hidden');

      // Close dropdowns when pressing Escape key
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          closeAll();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.classList.remove('overflow-hidden');
      };
    } else {
      // Ensure scroll is restored when dropdowns close
      document.body.classList.remove('overflow-hidden');
    }
  }, [isAnyDropdownOpen]);

  return (
    <>
      {/* Backdrop overlay when menu/notifications are open - rendered outside header for correct z-stacking */}
      {!inline && (
        <div
          className={`
            fixed inset-0 z-40 bg-sand/5 backdrop-blur-[15px]
            transition-opacity duration-300
            ${isAnyDropdownOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          style={{transitionTimingFunction: 'var(--ease-out-expo)'}}
          onClick={closeAll}
          aria-hidden="true"
        />
      )}

      <header
        className={
          inline
            ? 'w-full flex flex-col items-center'
            : 'fixed z-50 w-full flex flex-col items-center md:px-6 md:pt-6 pointer-events-none'
        }
        role="banner"
      >
        {/* Header pill */}
        <div
          className={`grid grid-cols-[1fr_auto_1fr] items-center w-full md:max-w-[600px] h-14 md:h-auto bg-white md:rounded-card-s px-4 md:px-2 py-2 ${inline ? '' : 'pointer-events-auto'}`}
        >
          {/* Left side: Menu + Notifications */}
          <div className="flex items-center gap-0.5 justify-self-start">
            <MenuToggleButton
              isOpen={isMenuOpen}
              isAnyOpen={isAnyDropdownOpen}
              onToggle={isAnyDropdownOpen ? closeAll : handleMenuToggle}
            />
            <NotificationButton
              hasUnread={hasUnread}
              isOpen={isNotificationsOpen}
              onToggle={handleNotificationsToggle}
            />
          </div>
          {/* Center: Logo */}
          <Link to="/" aria-label="Wakey home" onClick={closeAll} className="justify-self-center">
            <LogoSmall className="h-6 md:h-7" />
          </Link>
          {/* Right side: AI + Cart */}
          <div className="flex items-center gap-0.5 justify-self-end">
            <AiButton />
            <Suspense fallback={<CartButton count={0} onNavigate={closeAll} />}>
              <Await resolve={cart}>
                {(cartData) => (
                  <CartBadge cart={cartData} onNavigate={closeAll} />
                )}
              </Await>
            </Suspense>
          </div>
        </div>

        {/* Navigation dropdown - positioned directly below header */}
        <div className={`w-full mt-2 ${inline ? '' : 'pointer-events-auto'}`}>
          <NavigationDropdown isOpen={isMenuOpen} onClose={closeAll} />
          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={closeAll}
            notifications={notifications}
            readIds={readIds}
            onMarkAsRead={markAsRead}
          />
        </div>
      </header>
    </>
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
  isAnyOpen: boolean;
  onToggle: () => void;
}

function MenuToggleButton({isOpen, isAnyOpen, onToggle}: MenuToggleButtonProps) {
  return (
    <HeaderButton
      onClick={onToggle}
      ariaLabel={isAnyOpen ? 'Close menu' : 'Open menu'}
      ariaControls="navigation-dropdown"
      ariaExpanded={isOpen}
    >
      {isAnyOpen ? (
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

function AiIcon({className}: {className?: string}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.9392 5.89619C14.4847 6.02873 14.0106 6.2013 13.5241 6.41205C12.5537 6.83238 11.4456 6.83238 10.4752 6.41205C9.98867 6.2013 9.51462 6.02873 9.06013 5.89619M14.9392 5.89619C16.7872 5.35725 18.3117 5.48007 19.0363 6.38877C19.7609 7.29746 19.5414 8.811 18.6046 10.4927M14.9392 5.89619C14.2084 4.1153 13.1619 3 11.9997 3C10.8374 3 9.79095 4.1153 9.06013 5.89619M14.9392 5.89619C15.1189 6.33417 15.2796 6.8124 15.4181 7.32419C15.6945 8.34496 16.3854 9.21131 17.319 9.70796C17.7871 9.95697 18.2176 10.22 18.6046 10.4927M9.06013 5.89619C7.21211 5.35725 5.68767 5.48007 4.96304 6.38877C4.23842 7.29747 4.45797 8.811 5.39471 10.4927M9.06013 5.89619C8.8804 6.33417 8.71976 6.8124 8.58118 7.3242C8.3048 8.34496 7.61394 9.21131 6.68029 9.70796C6.21218 9.95697 5.78169 10.22 5.39471 10.4927M18.6046 10.4927C20.1782 11.6016 21.0326 12.87 20.7739 14.0031C20.5152 15.1362 19.195 15.9082 17.2961 16.2243M18.6046 10.4927C18.3742 10.9063 18.1005 11.3301 17.7867 11.7575C17.161 12.61 16.9144 13.6903 17.1082 14.7299C17.2053 15.2512 17.2681 15.7517 17.2961 16.2243M17.2961 16.2243C17.4102 18.1459 16.9512 19.6048 15.904 20.109C14.857 20.6131 13.4305 20.0625 11.9997 18.7753M17.2961 16.2243C16.8293 16.302 16.3276 16.3522 15.7981 16.3734C14.7413 16.4157 13.7428 16.8966 13.0508 17.6964C12.7039 18.0975 12.3516 18.4587 11.9997 18.7753M11.9997 18.7753C10.5688 20.0625 9.14236 20.6131 8.09532 20.109C7.04813 19.6048 6.5891 18.1459 6.70321 16.2243M11.9997 18.7753C11.6477 18.4587 11.2954 18.0975 10.9485 17.6964C10.2565 16.8966 9.25808 16.4157 8.20127 16.3734C7.67173 16.3522 7.16999 16.302 6.70321 16.2243M6.70321 16.2243C4.80434 15.9082 3.48409 15.1362 3.22541 14.0031C2.96673 12.87 3.82115 11.6016 5.39471 10.4927M6.70321 16.2243C6.73127 15.7517 6.794 15.2512 6.89117 14.7299C7.08497 13.6903 6.83835 12.61 6.21258 11.7575C5.89883 11.3301 5.62508 10.9063 5.39471 10.4927"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AiButton() {
  return (
    <button
      type="button"
      aria-label="AI assistant"
      className="
        rounded-full w-8 h-8 md:w-12 md:h-12
        flex items-center justify-center
        hover-scale
        transition-transform
        cursor-pointer
      "
    >
      <AiIcon className="w-6" />
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
