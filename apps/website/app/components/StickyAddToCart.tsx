import {useEffect, useState} from 'react';
import {
  CartForm,
  Money,
  type OptimisticCartLineInput,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {type FetcherWithComponents, Await} from 'react-router';
import {SmileyIcon, Button, AddedToBagPopup, AddBagIcon} from '@wakey/ui';
import {Suspense} from 'react';
import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';

interface StickyAddToCartProps {
  product: {
    id: string;
    title: string;
    handle: string;
  };
  selectedVariant: ProductVariantFragment;
  subtitle?: string | null;
  analytics?: unknown;
  productImage?: string | null;
  /** When true, renders inline instead of fixed position */
  inline?: boolean;
}

export function StickyAddToCart({
  product,
  selectedVariant,
  subtitle,
  analytics,
  productImage,
  inline = false,
}: StickyAddToCartProps) {
  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Get cart data from root loader
  const rootData = useRouteLoaderData<RootLoader>('root');

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
      {/* Unified Layout (same for mobile and desktop) */}
      <div className="flex items-center justify-between w-full max-w-[600px] md:h-[90px] bg-yellow rounded-card p-4 md:py-2 md:px-4">
        {/* Left: Product Image + Info */}
        <div className="flex items-center gap-2 md:gap-3">
          {productImage && (
            <img
              src={productImage}
              alt={product.title}
              className="w-11 h-11 md:w-14 md:h-14 object-contain rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex flex-col gap-1 md:gap-1.5">
            <div className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
              <span className="text-label md:text-[1.0625rem] font-display uppercase leading-tight">
                {/* Full title on screens >= 395px */}
                <span className="hidden min-[395px]:inline">{product.title}</span>
                {/* Title without "Natural" on screens < 395px */}
                <span className="min-[395px]:hidden">{product.title.replace(/natural\s*/i, '')}</span>
              </span>
              <span className="hidden md:flex text-label md:text-[1.0625rem] font-display leading-tight items-center gap-1.5">
                {selectedVariant?.compareAtPrice && (
                  <s className="opacity-50">
                    <Money data={selectedVariant.compareAtPrice} withoutTrailingZeros />
                  </s>
                )}
                {selectedVariant?.price && (
                  <Money data={selectedVariant.price} withoutTrailingZeros />
                )}
              </span>
            </div>
            {subtitle && (
              <span className="text-small font-body italic opacity-60">
                {subtitle}
              </span>
            )}
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

            // Open popup on successful add
            useEffect(() => {
              if (fetcher.state === 'idle' && fetcher.data) {
                setIsPopupOpen(true);
              }
            }, [fetcher.state, fetcher.data]);

            return (
              <>
                <input
                  name="analytics"
                  type="hidden"
                  value={JSON.stringify(analytics)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isAvailable || isLoading}
                  className="shrink-0 relative overflow-hidden whitespace-nowrap"
                >
                  {/* Text - slides up when loading */}
                  <span
                    className={`
                      flex items-center justify-center gap-2
                      transition-all duration-300
                      ${isLoading ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
                    `}
                  >
                    {isAvailable && <AddBagIcon className="w-5 h-5" />}
                    {isAvailable ? (
                      <>
                        {/* Mobile: Add + price */}
                        <span className="md:hidden inline-flex items-center gap-1">
                          Add
                          {selectedVariant?.price && (
                            <Money data={selectedVariant.price} withoutTrailingZeros />
                          )}
                        </span>
                        {/* Desktop: Add to Bag */}
                        <span className="hidden md:inline">Add to Bag</span>
                      </>
                    ) : (
                      'Sold Out'
                    )}
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
                </Button>
              </>
            );
          }}
        </CartForm>
      </div>

      {/* Added to Bag Popup */}
      {rootData?.cart && (
        <Suspense fallback={null}>
          <Await resolve={rootData.cart}>
            {(cart) => (
              <AddedToBagPopupWrapper
                cart={cart}
                isPopupOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                productImage={productImage}
                productTitle={product.title}
                subtitle={subtitle}
                price={selectedVariant?.price}
              />
            )}
          </Await>
        </Suspense>
      )}
    </div>
  );
}

// Wrapper component to use optimistic cart data
function AddedToBagPopupWrapper({
  cart,
  isPopupOpen,
  onClose,
  productImage,
  productTitle,
  subtitle,
  price,
}: {
  cart: unknown;
  isPopupOpen: boolean;
  onClose: () => void;
  productImage?: string | null;
  productTitle: string;
  subtitle?: string | null;
  price?: import('@shopify/hydrogen/storefront-api-types').MoneyV2;
}) {
  const optimisticCart = useOptimisticCart(
    cart as import('storefrontapi.generated').CartApiQueryFragment | null,
  );

  if (!price) return null;

  return (
    <AddedToBagPopup
      isOpen={isPopupOpen}
      onClose={onClose}
      product={{
        image: productImage ?? null,
        title: productTitle,
        variantTitle: subtitle ?? null,
        price: <Money data={price} withoutTrailingZeros />,
      }}
      cartCount={optimisticCart?.totalQuantity ?? 0}
      checkoutUrl={optimisticCart?.checkoutUrl ?? '/cart'}
    />
  );
}
