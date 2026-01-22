import {useEffect, useState, useRef, useCallback} from 'react';
import {CrossIcon, CheckoutIcon, Button} from '@wakey/ui';

interface AddedToBagPopupProduct {
  image: string | null;
  title: string;
  variantTitle: string | null;
  price: React.ReactNode;
}

interface AddedToBagPopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: AddedToBagPopupProduct | null;
  cartCount: number;
  checkoutUrl: string;
  /** When true, positions the popup relatively instead of fixed to bottom of viewport */
  relative?: boolean;
}

export function AddedToBagPopup({
  isOpen,
  onClose,
  product,
  cartCount,
  checkoutUrl,
  relative = false,
}: AddedToBagPopupProps) {
  // Track visibility state for animation
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap: get all focusable elements within the dialog
  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current) return [];
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
  }, []);

  // Handle keyboard events for accessibility
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close on Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Focus trap on Tab
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose, getFocusableElements]);

  useEffect(() => {
    if (isOpen && product) {
      // Store the currently focused element to restore later
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Show immediately when opening
      setShouldRender(true);
      // Small delay to ensure DOM is rendered before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
          // Focus the close button when popup opens
          closeButtonRef.current?.focus();
        });
      });
    } else {
      // Start fade out animation
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        // Restore focus to previously focused element
        previousFocusRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, product]);

  if (!shouldRender || !product) {
    return null;
  }

  return (
    <div
      className={
        relative
          ? 'p-4 flex justify-center w-full'
          : 'fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center'
      }
    >
      {/* Screen reader announcement */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {product.title} added to your bag
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="added-to-bag-title"
        className={`w-full max-w-[600px] bg-blue text-black rounded-card p-4 md:p-6 border border-black/10 transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Header with title and close button */}
        <div className="flex items-center justify-between mb-4">
          <span id="added-to-bag-title" className="text-s2 font-display">
            Added to your bag
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close added to bag notification"
            className="text-black hover:opacity-70 transition-opacity cursor-pointer"
          >
            <CrossIcon className="w-8 h-8" />
          </button>
        </div>

        {/* Product info with image and details */}
        <div className="flex gap-4">
          {/* Product thumbnail - square, ~80px */}
          {product.image && (
            <div className="shrink-0">
              <img
                src={product.image}
                alt={product.title}
                className="w-20 h-20 object-cover rounded"
              />
            </div>
          )}

          {/* Product details */}
          <div className="flex flex-col justify-center flex-1 gap-1 md:gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-display uppercase leading-none">
                {product.title}
              </span>
              <span className="text-base font-display leading-none">
                {product.price}
              </span>
            </div>
            {product.variantTitle && (
              <span className="text-small font-body italic opacity-70">
                {product.variantTitle}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            to="/cart"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Your bag ({cartCount})
          </Button>
          <Button
            href={checkoutUrl}
            variant="primary"
            className="flex-1"
            icon={<CheckoutIcon className="w-5 h-5" />}
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
