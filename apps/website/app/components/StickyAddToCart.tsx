import {useEffect, useState} from 'react';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {type FetcherWithComponents} from 'react-router';
import {useAside} from '~/components/Aside';
import {SmileyIcon, Stars} from '@wakey/ui';

interface StickyAddToCartProps {
  product: {
    id: string;
    title: string;
    handle: string;
  };
  selectedVariant: ProductVariantFragment;
  subtitle?: string | null;
  reviewRating?: number | null;
  reviewCount?: number;
  analytics?: unknown;
  productImage?: string | null;
  /** When true, renders inline instead of fixed position */
  inline?: boolean;
}

export function StickyAddToCart({
  product,
  selectedVariant,
  subtitle,
  reviewRating,
  reviewCount = 0,
  analytics,
  productImage,
  inline = false,
}: StickyAddToCartProps) {
  const {open} = useAside();

  // Get price from variant
  const price = selectedVariant?.price
    ? parseFloat(selectedVariant.price.amount)
    : 0;
  const currencyCode = selectedVariant?.price?.currencyCode || 'EUR';

  // Format price helper
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Animation states (only used when not inline)
  const [isReady, setIsReady] = useState(inline);
  const [isOutOfView, setIsOutOfView] = useState(false);

  // Initialize on mount - slide up animation (skip if inline)
  useEffect(() => {
    if (inline) return;
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [inline]);

  // Footer observer - hide form when footer is visible (skip if inline)
  useEffect(() => {
    if (inline) return;
    const footer = document.querySelector('footer[role="contentinfo"]');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsOutOfView(entry.isIntersecting),
      {threshold: 0.1},
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [inline]);

  // Cart lines for submission
  const lines: OptimisticCartLineInput[] = selectedVariant?.id
    ? [{merchandiseId: selectedVariant.id, quantity: 1}]
    : [];

  const isAvailable = selectedVariant?.availableForSale;

  return (
    <div
      className={
        inline
          ? 'w-full flex justify-center'
          : `fixed bottom-0 left-0 right-0 z-40 p-4 transition-transform duration-[400ms] [transition-timing-function:var(--ease-out-back)] flex justify-center ${isReady && !isOutOfView ? 'translate-y-0' : 'translate-y-[120%]'}`
      }
    >
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col w-full max-w-[600px] bg-yellow rounded-[5px] p-3">
        {/* Top row: Title + Price */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-s2 font-display uppercase leading-tight">
            {product.title}
          </span>
          <span className="text-s2 font-display leading-tight">
            {formatPrice(price)}
          </span>
        </div>
        {/* Bottom row: Image + Button */}
        <div className="flex items-stretch gap-2">
          {productImage && (
            <div className="w-14 h-14 bg-blue rounded-[5px] flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={productImage}
                alt={product.title}
                className="w-12 h-12 object-contain"
              />
            </div>
          )}
          <CartForm
            route="/cart"
            inputs={{lines}}
            action={CartForm.ACTIONS.LinesAdd}
            className="flex-1"
          >
            {(fetcher: FetcherWithComponents<unknown>) => {
              const isLoading = fetcher.state !== 'idle';

              // Open cart drawer on successful add
              useEffect(() => {
                if (fetcher.state === 'idle' && fetcher.data) {
                  open('cart');
                }
              }, [fetcher.state, fetcher.data]);

              return (
                <>
                  <input
                    name="analytics"
                    type="hidden"
                    value={JSON.stringify(analytics)}
                  />
                  <button
                    type="submit"
                    disabled={!isAvailable || isLoading}
                    className={`
                      w-full h-14 px-6
                      bg-black text-sand rounded-[5px]
                      font-display text-label uppercase whitespace-nowrap
                      relative overflow-hidden
                      transition-opacity duration-200
                      ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {/* Text - slides up when loading */}
                    <span
                      className={`
                        flex items-center justify-center
                        transition-all duration-300
                        ${isLoading ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
                      `}
                    >
                      {isAvailable ? 'Add to Cart' : 'Sold Out'}
                    </span>
                    {/* Smiley - slides in when loading */}
                    <span
                      className={`
                        absolute inset-0 flex items-center justify-center
                        transition-all duration-300
                        ${isLoading ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                      `}
                    >
                      <SmileyIcon
                        className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                      />
                    </span>
                  </button>
                </>
              );
            }}
          </CartForm>
        </div>
      </div>

      {/* Desktop Layout (unchanged) */}
      <div className="hidden md:flex items-center justify-between w-full max-w-[600px] h-[90px] bg-yellow rounded-card p-2 px-4">
        {/* Left: Product Image + Info */}
        <div className="flex items-center gap-3">
          {productImage && (
            <img
              src={productImage}
              alt={product.title}
              className="w-14 h-14 object-contain rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[1.0625rem] font-display uppercase leading-tight">
                {product.title}
              </span>
              <span className="text-[1.0625rem] font-display leading-tight">
                {formatPrice(price)}
              </span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              {subtitle && (
                <span className="text-small font-display opacity-60">
                  {subtitle}
                </span>
              )}
              {reviewRating && (
                <div className="flex items-center gap-1">
                  <Stars rating={reviewRating} color="black" size="sm" />
                  {reviewCount > 0 && (
                    <span className="text-small font-display opacity-60">
                      ({reviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Add to Cart Button */}
        <CartForm
          route="/cart"
          inputs={{lines}}
          action={CartForm.ACTIONS.LinesAdd}
        >
          {(fetcher: FetcherWithComponents<unknown>) => {
            const isLoading = fetcher.state !== 'idle';

            // Open cart drawer on successful add
            useEffect(() => {
              if (fetcher.state === 'idle' && fetcher.data) {
                open('cart');
              }
            }, [fetcher.state, fetcher.data]);

            return (
              <>
                <input
                  name="analytics"
                  type="hidden"
                  value={JSON.stringify(analytics)}
                />
                <button
                  type="submit"
                  disabled={!isAvailable || isLoading}
                  className={`
                    shrink-0 h-[58px] px-6
                    bg-sand rounded-[5px]
                    font-display text-label uppercase whitespace-nowrap
                    relative overflow-hidden
                    transition-opacity duration-200
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {/* Text - slides up when loading */}
                  <span
                    className={`
                      flex items-center justify-center
                      transition-all duration-300
                      ${isLoading ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
                    `}
                  >
                    {isAvailable ? 'Add to Cart' : 'Sold Out'}
                  </span>
                  {/* Smiley - slides in when loading */}
                  <span
                    className={`
                      absolute inset-0 flex items-center justify-center
                      transition-all duration-300
                      ${isLoading ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                    `}
                  >
                    <SmileyIcon
                      className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </span>
                </button>
              </>
            );
          }}
        </CartForm>
      </div>
    </div>
  );
}
