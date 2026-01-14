import {useEffect, useState} from 'react';
import {useFetcher} from 'react-router';
import {AssistantMessage} from './AssistantMessage';
import type {Recommendation} from '~/lib/getRecommendation';

interface ProductData {
  id: string;
  title: string;
  handle: string;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  subtitle: string | null;
  reviewRating: number | null;
  reviewCount: number | null;
  price: {
    amount: string;
    currencyCode: string;
  } | null;
  variantId: string | null;
}

interface AssistantRecommendationProps {
  /** User's name from the name-email step */
  userName: string;
  /** Recommendation data from getRecommendation */
  recommendation: Recommendation;
  /** Called when product data is loaded (passes variantId for cart actions) */
  onProductLoaded?: (product: ProductData) => void;
}

/**
 * Displays personalized product recommendation with pricing and discount
 */
export function AssistantRecommendation({
  userName,
  recommendation,
  onProductLoaded,
}: AssistantRecommendationProps) {
  const fetcher = useFetcher<{product: ProductData | null}>();
  const [hasLoadedProduct, setHasLoadedProduct] = useState(false);

  // Fetch product data on mount
  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/product/${recommendation.productHandle}`);
    }
  }, [recommendation.productHandle, fetcher]);

  // Notify parent when product loads
  useEffect(() => {
    if (fetcher.data?.product && !hasLoadedProduct) {
      setHasLoadedProduct(true);
      onProductLoaded?.(fetcher.data.product);
    }
  }, [fetcher.data, hasLoadedProduct, onProductLoaded]);

  const product = fetcher.data?.product;
  const isLoading = fetcher.state === 'loading' || !product;

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

  // Personalized message
  const personalizedMessage = `Perfect, ${userName}! Based on your answers, here's what I recommend for you:`;

  return (
    <div className="flex flex-col gap-4">
      <AssistantMessage message={personalizedMessage} />

      {isLoading ? (
        <div
          className="bg-sand/90 rounded-card p-6 opacity-0"
          style={{animation: 'fade-in 300ms ease-out forwards', animationDelay: '800ms'}}
        >
          <div className="flex items-center justify-center h-48">
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
        </div>
      ) : (
        <div
          className="bg-sand/90 rounded-card p-6 opacity-0"
          style={{animation: 'fade-in 300ms ease-out forwards', animationDelay: '800ms'}}
        >
          {/* Product Card */}
          <div className="flex flex-col gap-4">
            {/* Product Image */}
            {product.featuredImage && (
              <div className="relative aspect-square rounded-card overflow-hidden bg-sand">
                <img
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? product.title}
                  className="w-full h-full object-cover"
                />
                {/* Discount Badge */}
                <div className="absolute top-3 right-3 bg-softorange text-black font-display text-small px-3 py-1 rounded-full">
                  {recommendation.discountPercent}% OFF
                </div>
              </div>
            )}

            {/* Product Info */}
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-h3 text-black">{product.title}</h3>
              {product.subtitle && (
                <p className="font-body text-body-small text-black/70">
                  {product.subtitle}
                </p>
              )}

              {/* Quantity Badge */}
              {recommendation.quantity > 1 && (
                <p className="font-display text-small text-black/70">
                  Recommended: {recommendation.quantity} pack
                </p>
              )}

              {/* Pricing */}
              <div className="flex items-center gap-3 mt-2">
                <span className="font-display text-h3 text-black">
                  {formatPrice(discountedPrice * recommendation.quantity)}
                </span>
                <span className="font-body text-paragraph text-black/50 line-through">
                  {formatPrice(originalPrice * recommendation.quantity)}
                </span>
              </div>

              {/* Per unit price for multi-pack */}
              {recommendation.quantity > 1 && (
                <p className="font-body text-small text-black/60">
                  {formatPrice(discountedPrice)} each
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
