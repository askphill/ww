import {CrossIcon} from '@wakey/ui';
import {Link} from 'react-router';
import {useEffect, useState} from 'react';
import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

interface AddedToBagPopupProduct {
  image: string | null;
  title: string;
  variantTitle: string | null;
  price: MoneyV2;
}

interface AddedToBagPopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: AddedToBagPopupProduct | null;
  cartCount: number;
  checkoutUrl: string;
}

export function AddedToBagPopup({
  isOpen,
  onClose,
  product,
  cartCount,
  checkoutUrl,
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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div
        className={`w-full max-w-[600px] bg-sand text-black rounded-card p-6 transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Header with title and close button */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-s2 font-display">Added to your bag</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-black hover:opacity-70 transition-opacity"
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
          <div className="flex flex-col justify-center">
            <span className="text-paragraph font-display">{product.title}</span>
            {product.variantTitle && (
              <span className="text-small opacity-70">{product.variantTitle}</span>
            )}
            <span className="text-paragraph mt-1">
              <Money data={product.price} withoutTrailingZeros />
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <Link
            to="/cart"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 font-display text-label rounded-full border border-black text-black bg-transparent hover:bg-black/10 transition-colors"
          >
            Your bag ({cartCount})
          </Link>
          <a
            href={checkoutUrl}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 font-display text-label rounded-full bg-black text-sand hover:bg-black/90 transition-colors"
          >
            Checkout
          </a>
        </div>
      </div>
    </div>
  );
}
