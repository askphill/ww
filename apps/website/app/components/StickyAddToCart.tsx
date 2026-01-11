import {useEffect, useRef, useState, useCallback} from 'react';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {type FetcherWithComponents} from 'react-router';
import {useAside} from '~/components/Aside';
import {Stars, SmileyIcon} from '@wakey/ui';

interface BundleOption {
  quantity: number;
  title: string;
  bundlePrice?: number; // If set, shows compare price
}

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
  bundleOptions?: BundleOption[];
}

const DEFAULT_BUNDLE_OPTIONS: BundleOption[] = [
  {quantity: 1, title: 'One Deodorant'},
  {quantity: 2, title: 'Duopack', bundlePrice: 38},
];

export function StickyAddToCart({
  product,
  selectedVariant,
  subtitle,
  reviewRating,
  reviewCount = 0,
  analytics,
  bundleOptions = DEFAULT_BUNDLE_OPTIONS,
}: StickyAddToCartProps) {
  const {open} = useAside();

  // Get unit price from variant
  const unitPrice = selectedVariant?.price
    ? parseFloat(selectedVariant.price.amount)
    : 0;
  const currencyCode = selectedVariant?.price?.currencyCode || 'EUR';

  // Format price helper
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  // Animation states
  const [isReady, setIsReady] = useState(false);
  const [isFull, setIsFull] = useState(true);
  const [isOutOfView, setIsOutOfView] = useState(false);

  // Selected bundle option state (index)
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(0);
  const selectedBundle = bundleOptions[selectedBundleIndex];
  const quantity = selectedBundle?.quantity || 1;

  // Refs for animations
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideableRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize on mount - slide up animation
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll listener - collapse sections when scrolled past 20px
  useEffect(() => {
    const handleScroll = () => {
      setIsFull(window.scrollY <= 20);
    };
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Footer observer - hide form when footer is visible
  useEffect(() => {
    const footer = document.querySelector('footer[role="contentinfo"]');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsOutOfView(entry.isIntersecting),
      {threshold: 0.1},
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // Dynamic height calculation for collapsible sections
  useEffect(() => {
    const updateHeights = () => {
      hideableRefs.current.forEach((el) => {
        if (!el) return;
        el.style.setProperty('--innerheight', 'auto');
        void el.offsetHeight; // Force reflow
        el.style.setProperty('--innerheight', `${el.scrollHeight}px`);
      });
    };
    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  // Pop animation on quantity change (desktop only)
  const triggerPop = useCallback(() => {
    if (!wrapperRef.current || window.innerWidth < 768) return;
    wrapperRef.current.classList.remove('animate-sticky-pop');
    void wrapperRef.current.offsetWidth; // Force reflow
    wrapperRef.current.classList.add('animate-sticky-pop');
  }, []);

  const handleBundleChange = (index: number) => {
    setSelectedBundleIndex(index);
    triggerPop();
  };

  // Cart lines for submission
  const lines: OptimisticCartLineInput[] = selectedVariant?.id
    ? [{merchandiseId: selectedVariant.id, quantity}]
    : [];

  const isAvailable = selectedVariant?.availableForSale;

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 z-40
        md:bottom-8 md:left-auto md:right-8
        transition-transform duration-[400ms]
        [transition-timing-function:var(--ease-out-back)]
        ${isReady && !isOutOfView ? 'translate-y-0' : 'translate-y-[120%]'}
      `}
    >
      <div
        ref={wrapperRef}
        className="overflow-hidden bg-yellow border border-black/10 rounded-card md:min-w-[25rem]"
      >
        {/* Hideable: Product Info */}
        <div
          ref={(el) => (hideableRefs.current[0] = el)}
          className="overflow-hidden transition-[height,opacity] duration-300 [transition-timing-function:var(--ease-out-back)]"
          style={{
            height: isFull ? 'var(--innerheight)' : 0,
            opacity: isFull ? 1 : 0,
          }}
        >
          <div className="p-4 pb-6 md:p-6 md:pb-11">
            <div className="text-body-small md:text-paragraph font-display leading-tight uppercase">
              {product.title}
            </div>
            <div className="flex items-center gap-3 mt-2">
              {subtitle && (
                <span className="text-small font-display opacity-60">
                  {subtitle}
                </span>
              )}
              {reviewRating && (
                <div className="flex items-center gap-1.5">
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

        {/* Bundle Quantity Selector - always visible */}
        <div className="grid grid-cols-2 border-t border-black/10">
          {bundleOptions.map((option, index) => {
            const isActive = selectedBundleIndex === index;
            const regularPrice = unitPrice * option.quantity;
            const displayPrice = option.bundlePrice ?? regularPrice;
            const hasDiscount = option.bundlePrice !== undefined;

            return (
              <button
                key={option.quantity}
                type="button"
                onClick={() => handleBundleChange(index)}
                aria-pressed={isActive}
                className={`
                  flex items-start gap-1.5 p-4 md:px-5 md:py-4 md:pb-11
                  text-left transition-colors duration-200
                  ${index === 0 ? 'border-r border-black/10' : ''}
                  md:hover:bg-white/50
                `}
              >
                {/* Radio icon */}
                <div
                  className={`
                    w-4 h-4 md:w-[1.125rem] md:h-[1.125rem] mt-0.5
                    rounded-full border-2 border-black
                    transition-colors duration-200
                    ${isActive ? 'bg-black' : 'bg-transparent'}
                  `}
                />
                {/* Title and price */}
                <div className="pl-0.5">
                  <div className="text-small md:text-paragraph font-display leading-none">
                    {option.title}
                  </div>
                  <div className="text-small font-display pt-2">
                    {hasDiscount && (
                      <span className="opacity-50 line-through mr-1">
                        {formatPrice(regularPrice)}
                      </span>
                    )}
                    <span>{formatPrice(displayPrice)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Hideable: USP */}
        <div
          ref={(el) => (hideableRefs.current[1] = el)}
          className="overflow-hidden transition-[height,opacity] duration-300 [transition-timing-function:var(--ease-out-back)]"
          style={{
            height: isFull ? 'var(--innerheight)' : 0,
            opacity: isFull ? 1 : 0,
          }}
        >
          <div className="border-t border-black/10 py-2.5 text-small font-display uppercase text-center leading-none">
            Same day shipping
          </div>
        </div>

        {/* Add to Cart Form */}
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
                    w-full h-[3.125rem] md:h-[3.875rem]
                    border-t border-black/10
                    font-display text-small md:text-label uppercase
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
