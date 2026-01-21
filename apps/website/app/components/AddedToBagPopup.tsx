import {useEffect, useState} from 'react';
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

  useEffect(() => {
    if (isOpen && product) {
      // Show immediately when opening
      setShouldRender(true);
      // Small delay to ensure DOM is rendered before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // Start fade out animation
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
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
      <div
        className={`w-full max-w-[600px] bg-blue text-black rounded-card p-4 md:p-6 border border-black/10 transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Header with title and close button */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-s2 font-display">Added to your bag</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
