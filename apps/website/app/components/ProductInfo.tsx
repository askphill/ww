import {useState, useEffect, Suspense} from 'react';
import {
  CartForm,
  Money,
  type OptimisticCartLineInput,
  useOptimisticCart,
} from '@shopify/hydrogen';
import {
  Stars,
  Accordion,
  Button,
  AddBagIcon,
  SmileyIcon,
  ShapeStar,
  ShapeFlower,
  ShapeCircle,
  ShapeSparkle,
} from '@wakey/ui';
import type {
  ProductVariantFragment,
  CartApiQueryFragment,
} from 'storefrontapi.generated';
import {
  type FetcherWithComponents,
  Await,
  useRouteLoaderData,
} from 'react-router';
import {AddedToBagPopup} from './AddedToBagPopup';
import type {RootLoader} from '~/root';

/** Map badge text to corresponding icon */
function getBadgeIcon(badge: string) {
  const normalized = badge.toLowerCase();
  if (normalized.includes('vegan') || normalized.includes('natural')) {
    return ShapeStar;
  }
  if (normalized.includes('baking') || normalized.includes('soda')) {
    return ShapeSparkle;
  }
  if (normalized.includes('plastic')) {
    return ShapeFlower;
  }
  if (normalized.includes('aluminum')) {
    return ShapeCircle;
  }
  // Default to star
  return ShapeStar;
}

/** Response type from cart action */
type CartActionResponse = {
  cart: CartApiQueryFragment | null;
  errors?: unknown;
  warnings?: unknown;
  analytics?: {cartId?: string};
};

interface SizeOption {
  value: string;
  label: string;
}

interface ProductInfoProps {
  subtitle: string;
  title: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  badges: string[];
  sizeOptions: SizeOption[];
  selectedSize: string;
  onSizeChange?: (size: string) => void;
  selectedVariant: ProductVariantFragment;
  benefits: string;
  howToUse: string;
  keyIngredients: string;
  analytics?: unknown;
  productImage?: string | null;
  // Why You Love It props (for desktop)
  whyYouLoveItTitle?: string;
  whyYouLoveItHtml?: string;
  whyYouLoveItUsps?: string[];
}

export function ProductInfo({
  subtitle,
  title,
  description,
  rating = 5,
  reviewCount = 0,
  badges,
  sizeOptions,
  selectedSize,
  onSizeChange,
  selectedVariant,
  benefits,
  howToUse,
  keyIngredients,
  analytics,
  productImage,
  whyYouLoveItTitle = 'Why you love it',
  whyYouLoveItHtml,
  whyYouLoveItUsps = [],
}: ProductInfoProps) {
  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Get cart data from root loader
  const rootData = useRouteLoaderData<RootLoader>('root');

  const isAvailable = selectedVariant?.availableForSale;

  const accordionItems = [
    {
      id: 'product-description',
      title: 'Product description',
      content: <p>{benefits}</p>,
    },
    {
      id: 'how-to-use',
      title: 'How to use',
      content: <p>{howToUse}</p>,
    },
    {
      id: 'key-ingredients',
      title: 'Key ingredients',
      content: <p>{keyIngredients}</p>,
    },
  ];

  const lines: OptimisticCartLineInput[] = selectedVariant?.id
    ? [
        {
          merchandiseId: selectedVariant.id,
          quantity: 1,
          selectedVariant,
        },
      ]
    : [];

  return (
    <>
      {/* Mobile: Product Form */}
      <div className="md:hidden px-4 pt-6 pb-12">
        <div className="flex flex-col gap-6">
          {/* Header: Title + Stars */}
          <div className="flex items-center justify-between">
            <h1 className="text-h2 font-display uppercase">{title}</h1>
            {reviewCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Stars rating={rating} color="black" size="sm" />
                <span className="text-small text-text/60">({reviewCount})</span>
              </div>
            )}
          </div>

          {/* Subtitle */}
          <span className="text-paragraph font-body italic text-text -mt-4">
            {subtitle}
          </span>

          {/* Description */}
          <p className="text-paragraph font-display text-text">{description}</p>

          {/* Size Selection */}
          <div className="relative border-b border-black/20">
            <div className="flex items-center justify-between pb-3">
              <span className="text-paragraph font-display">Size</span>
              <div className="flex items-center gap-4">
                {sizeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSizeChange?.(option.value)}
                    className={`text-paragraph font-display cursor-pointer transition-colors relative pb-3 -mb-3 ${
                      selectedSize === option.value ? '' : 'hover:text-text/70'
                    }`}
                  >
                    {option.label}
                    {selectedSize === option.value && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-skyblue" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add to Bag Button */}
          <div data-product-add-to-cart>
            <CartForm
              route="/cart"
              inputs={{lines}}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher: FetcherWithComponents<CartActionResponse>) => (
                <ProductAddToCartForm
                  fetcher={fetcher}
                  analytics={analytics}
                  isAvailable={isAvailable}
                  selectedVariant={selectedVariant}
                  setIsPopupOpen={setIsPopupOpen}
                />
              )}
            </CartForm>

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
                      productTitle={title}
                      subtitle={subtitle}
                      price={selectedVariant?.price}
                    />
                  )}
                </Await>
              </Suspense>
            )}
          </div>

          {/* USP - Free Delivery */}
          <p className="text-small text-text/60 text-center">
            Free delivery on orders over €50
          </p>

          {/* Benefits */}
          <div>
            <h3 className="text-s2 md:text-paragraph font-display pb-4 mb-4 border-b border-black/20">
              Benefits
            </h3>
            <div className="grid grid-cols-4 gap-3 md:gap-4">
              {badges.map((badge) => {
                const BadgeIcon = getBadgeIcon(badge);
                return (
                  <div key={badge} className="flex flex-col items-center gap-2">
                    <BadgeIcon className="w-8 h-8 md:w-10 md:h-10 text-softorange" />
                    <span className="text-small font-display uppercase text-center whitespace-pre-line leading-tight">
                      {badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accordions */}
          <div className="mt-2">
            <Accordion items={accordionItems} defaultOpenIndex={null} />
          </div>
        </div>
      </div>

      {/* Desktop: Why You Love It */}
      {whyYouLoveItHtml && (
        <div className="hidden md:block bg-sand px-8 py-12">
          <div className="grid grid-cols-24">
            {/* Title */}
            <h3 className="col-span-10 text-h3 font-display">
              {whyYouLoveItTitle}
            </h3>

            {/* Description */}
            <div
              className="col-start-11 col-span-14 text-h3 font-display"
              dangerouslySetInnerHTML={{__html: whyYouLoveItHtml}}
            />

            {/* USP List */}
            {whyYouLoveItUsps.length > 0 && (
              <ul className="font-body text-paragraph pt-24 space-y-4 col-start-1 col-span-6">
                {whyYouLoveItUsps.map((usp, index) => (
                  <li key={index}>{usp}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface ProductAddToCartFormProps {
  fetcher: FetcherWithComponents<CartActionResponse>;
  analytics?: unknown;
  isAvailable?: boolean;
  selectedVariant: ProductVariantFragment;
  setIsPopupOpen: (isOpen: boolean) => void;
}

function ProductAddToCartForm({
  fetcher,
  analytics,
  isAvailable,
  selectedVariant,
  setIsPopupOpen,
}: ProductAddToCartFormProps) {
  const isLoading = fetcher.state !== 'idle';

  // Open popup on successful add
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      setIsPopupOpen(true);
    }
  }, [fetcher.state, fetcher.data, setIsPopupOpen]);

  return (
    <>
      <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />
      <Button
        type="submit"
        variant="primary"
        disabled={!isAvailable || isLoading}
        className="w-full relative overflow-hidden"
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
              ADD TO BAG –{' '}
              {selectedVariant?.price && (
                <Money data={selectedVariant.price} withoutTrailingZeros />
              )}
            </>
          ) : (
            'SOLD OUT'
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
  cart: CartApiQueryFragment | null;
  isPopupOpen: boolean;
  onClose: () => void;
  productImage?: string | null;
  productTitle: string;
  subtitle?: string | null;
  price?: import('@shopify/hydrogen/storefront-api-types').MoneyV2;
}) {
  const optimisticCart = useOptimisticCart(cart);

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
