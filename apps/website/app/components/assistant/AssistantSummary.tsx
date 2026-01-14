import {useEffect, useState} from 'react';
import {useFetcher, type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {Button, AddBagIcon, SmileyIcon, CheckIcon} from '@wakey/ui';
import type {Recommendation} from '~/lib/getRecommendation';
import type {Answers} from '~/hooks/useAssistantFlow';

/** Response type from cart action */
type CartActionResponse = {
  cart: unknown;
  errors?: unknown;
  warnings?: unknown;
};

interface ProductData {
  id: string;
  title: string;
  handle: string;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  subtitle: string | null;
  price: {
    amount: string;
    currencyCode: string;
  } | null;
  variantId: string | null;
}

/** Lifestyle labels for display */
const LIFESTYLE_LABELS: Record<string, string> = {
  active: 'Active & athletic',
  professional: 'Busy professional',
  parent: 'Parent life',
  student: 'Student vibes',
};

interface AssistantSummaryProps {
  /** User's name from the name-email step */
  userName: string;
  /** User's email from the name-email step */
  userEmail: string;
  /** All answers from the assistant flow */
  answers: Answers;
  /** Recommendation data from getRecommendation */
  recommendation: Recommendation;
  /** Whether the product has already been added to cart */
  alreadyAddedToCart?: boolean;
  /** Called when product is added to cart */
  onAddedToCart?: () => void;
}

/**
 * Displays the final routine summary with user preferences and product
 */
export function AssistantSummary({
  userName,
  userEmail,
  answers,
  recommendation,
  alreadyAddedToCart = false,
  onAddedToCart,
}: AssistantSummaryProps) {
  const fetcher = useFetcher<{product: ProductData | null}>();
  const [hasAddedToCart, setHasAddedToCart] = useState(alreadyAddedToCart);

  // Fetch product data on mount
  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/product/${recommendation.productHandle}`);
    }
  }, [recommendation.productHandle, fetcher]);

  // Sync external alreadyAddedToCart prop
  useEffect(() => {
    if (alreadyAddedToCart) {
      setHasAddedToCart(true);
    }
  }, [alreadyAddedToCart]);

  const product = fetcher.data?.product;
  const isLoading = fetcher.state === 'loading' || !product;

  // Cart lines for submission (quantity from recommendation)
  const lines: OptimisticCartLineInput[] = product?.variantId
    ? [{merchandiseId: product.variantId, quantity: recommendation.quantity}]
    : [];

  // Get lifestyle selections
  const lifestyleSelections = Array.isArray(answers['lifestyle'])
    ? answers['lifestyle']
    : [];

  // Calculate discounted price
  const originalPrice = product?.price?.amount
    ? parseFloat(product.price.amount)
    : 0;
  const discountedPrice = originalPrice * (1 - recommendation.discountPercent / 100);
  const currencyCode = product?.price?.currencyCode ?? 'EUR';

  // Format currency
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Card */}
      <div
        className="bg-sand rounded-card p-6 opacity-0"
        style={{animation: 'fade-in 300ms ease-out forwards'}}
      >
        {/* Header */}
        <div className="border-b border-black/10 pb-4 mb-4">
          <h2 className="font-display text-h2 text-black">
            {userName}&apos;s Morning Ritual
          </h2>
          <p className="font-body text-body-small text-black/60 mt-1">
            {userEmail}
          </p>
        </div>

        {/* Lifestyle Preferences */}
        {lifestyleSelections.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display text-label text-black/70 uppercase tracking-wider mb-3">
              Your Lifestyle
            </h3>
            <div className="flex flex-wrap gap-2">
              {lifestyleSelections.map((lifestyle) => (
                <span
                  key={lifestyle}
                  className="bg-softorange/20 text-black font-body text-small px-3 py-1 rounded-full"
                >
                  {LIFESTYLE_LABELS[lifestyle] ?? lifestyle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Product */}
        <div>
          <h3 className="font-display text-label text-black/70 uppercase tracking-wider mb-3">
            Recommended Product
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 bg-black/60 rounded-full animate-bounce"
                  style={{animationDelay: '0ms', animationDuration: '600ms'}}
                />
                <span
                  className="w-2 h-2 bg-black/60 rounded-full animate-bounce"
                  style={{animationDelay: '150ms', animationDuration: '600ms'}}
                />
                <span
                  className="w-2 h-2 bg-black/60 rounded-full animate-bounce"
                  style={{animationDelay: '300ms', animationDuration: '600ms'}}
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              {/* Product Image */}
              {product.featuredImage && (
                <div className="w-20 h-20 rounded-card overflow-hidden bg-sand shrink-0">
                  <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText ?? product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Product Info */}
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="font-display text-s2 text-black">
                  {product.title}
                </h4>
                {product.subtitle && (
                  <p className="font-body text-small text-black/70">
                    {product.subtitle}
                  </p>
                )}
                {recommendation.quantity > 1 && (
                  <p className="font-display text-small text-black/70">
                    Qty: {recommendation.quantity}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display text-s2 text-black">
                    {formatPrice(discountedPrice * recommendation.quantity)}
                  </span>
                  <span className="font-body text-small text-black/50 line-through">
                    {formatPrice(originalPrice * recommendation.quantity)}
                  </span>
                  <span className="bg-softorange text-black font-display text-small px-2 py-0.5 rounded-full">
                    {recommendation.discountPercent}% OFF
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add to Bag Button (if not already added) */}
        {!isLoading && !hasAddedToCart && (
          <div className="mt-6">
            <CartForm
              route="/cart"
              inputs={{lines}}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(cartFetcher: FetcherWithComponents<CartActionResponse>) => {
                const isAddingToCart = cartFetcher.state !== 'idle';

                // Handle successful add to cart
                useEffect(() => {
                  if (
                    cartFetcher.state === 'idle' &&
                    cartFetcher.data &&
                    !hasAddedToCart
                  ) {
                    setHasAddedToCart(true);
                    onAddedToCart?.();
                  }
                }, [cartFetcher.state, cartFetcher.data]);

                return (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isAddingToCart}
                    className="w-full relative overflow-hidden"
                  >
                    {/* Default state - Add to bag */}
                    <span
                      className={`
                        flex items-center justify-center gap-2
                        transition-all duration-300
                        ${isAddingToCart ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
                      `}
                    >
                      <AddBagIcon className="w-5 h-5" />
                      Add to bag
                    </span>

                    {/* Loading state - Spinner */}
                    <span
                      className={`
                        absolute inset-0 flex items-center justify-center
                        transition-all duration-300
                        ${isAddingToCart ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                      `}
                    >
                      <SmileyIcon className="w-5 h-5 animate-spin" />
                    </span>
                  </Button>
                );
              }}
            </CartForm>
          </div>
        )}

        {/* Already added message */}
        {hasAddedToCart && (
          <div className="mt-6 flex items-center justify-center gap-2 text-black/70 font-body text-body-small">
            <CheckIcon className="w-4 h-4" />
            Already in your bag
          </div>
        )}
      </div>
    </div>
  );
}
