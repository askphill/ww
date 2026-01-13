import type {Route} from './+types/design-system';
import {Button, Stars, Accordion, Tooltip} from '@wakey/ui';
import {
  LogoBig,
  LogoSmall,
  HamburgerIcon,
  CrossIcon,
  SmileyIcon,
  IdealIcon,
  KlarnaIcon,
  IcsIcon,
  VisaIcon,
  ShapeCircle,
  ShapeStar,
  ShapeFlower,
  ShapeSparkle,
  ShapeHexagon,
  ShapeHalfCircle,
} from '@wakey/ui';
import {Header} from '~/components/Header';
import {ProductTooltip} from '~/components/ProductTooltip';
import {StickyAddToCart} from '~/components/StickyAddToCart';
import {AddedToBagPopup} from '~/components/AddedToBagPopup';

export function meta({}: Route.MetaArgs) {
  return [
    {title: 'Design System | Wakey'},
    {name: 'robots', content: 'noindex'},
  ];
}

const PRODUCT_QUERY = `#graphql
  query DesignSystemProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage {
        url
        altText
      }
      subtitle: metafield(namespace: "ask_phill", key: "subtitle") {
        value
      }
      reviewRating: metafield(namespace: "ask_phill", key: "review_average_rating") {
        value
      }
      reviews: metafield(namespace: "askphill", key: "reviews") {
        value
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          sku
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

export async function loader({context}: Route.LoaderArgs) {
  const cart = context.cart.get();

  // Fetch real product data for StickyATC demo
  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle: 'deodorant'},
  });

  // Parse reviews to get count
  let reviewCount = 0;
  if (product?.reviews?.value) {
    try {
      const reviewsData = JSON.parse(product.reviews.value);
      reviewCount = Array.isArray(reviewsData) ? reviewsData.length : 0;
    } catch (e) {
      // ignore
    }
  }

  const variant = product?.variants?.nodes?.[0];

  const productData = product
    ? {
        id: product.id,
        title: product.title,
        handle: product.handle,
        subtitle: product.subtitle?.value || null,
        reviewRating: product.reviewRating?.value
          ? parseFloat(product.reviewRating.value)
          : null,
        reviewCount,
        featuredImage: product.featuredImage?.url || null,
        selectedVariant: variant,
      }
    : null;

  return {cart, productData};
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="p-4 md:p-8 bg-sand">
      <h2 className="text-h2 font-display mb-8">{title}</h2>
      {children}
    </section>
  );
}

function ColorSwatch({
  name,
  variable,
  hex,
}: {
  name: string;
  variable: string;
  hex: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-card border border-black/10"
        style={{backgroundColor: hex}}
      />
      <div>
        <p className="font-display text-s2">{name}</p>
        <p className="font-body text-small opacity-60">{variable}</p>
        <p className="font-body text-small opacity-60">{hex}</p>
      </div>
    </div>
  );
}

function EasingPreview({
  name,
  bezier,
  description,
}: {
  name: string;
  bezier: string;
  description: string;
}) {
  return (
    <div className="bg-black/5 p-6 rounded-card">
      {/* Animated track */}
      <div className="relative h-12 mb-4 flex items-center">
        <div className="absolute inset-x-0 h-px bg-black/20" />
        <div
          className="absolute w-6 h-6 bg-softorange rounded-full"
          style={{
            animation: `easing-demo-${name} 2s ${bezier} infinite`,
          }}
        />
      </div>

      <p className="text-s2 font-display mb-2">{name}</p>
      <p className="text-small font-body opacity-60">{bezier}</p>
      <p className="text-body-small font-body mt-2">{description}</p>

      <style>{`
        @keyframes easing-demo-${name} {
          0%, 10% { left: 0; }
          50%, 60% { left: calc(100% - 1.5rem); }
          100% { left: 0; }
        }
      `}</style>
    </div>
  );
}

export default function DesignSystem({loaderData}: Route.ComponentProps) {
  const {cart, productData} = loaderData;

  const accordionItems = [
    {
      id: '1',
      title: 'What ingredients are used?',
      content:
        'We use only natural, skin-friendly ingredients sourced responsibly from around the world.',
    },
    {
      id: '2',
      title: 'How long does it last?',
      content:
        'Our deodorant provides 24-hour protection with a single application.',
    },
    {
      id: '3',
      title: 'Is it suitable for sensitive skin?',
      content:
        'Yes! Our formula is designed to be gentle on all skin types, including sensitive skin.',
    },
  ];

  return (
    <div className="min-h-screen pt-24 md:pt-28">
      <div>
        {/* Page Title */}
        <section className="p-4 md:p-8 bg-sand">
          <h1 className="text-h1 font-display mb-4">Design System</h1>
          <p className="text-paragraph font-body text-text max-w-prose">
            A comprehensive overview of Wakey's design tokens, typography,
            colors, and UI components.
          </p>
        </section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-8">
            {/* Fonts */}
            <div className="mb-12">
              <h3 className="text-h3 font-display mb-4">Font Families</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-small font-body opacity-60 mb-2">
                    Founders (default)
                  </p>
                  <p className="text-h3 font-display">
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div>
                  <p className="text-small font-body opacity-60 mb-2">
                    ITC (font-body)
                  </p>
                  <p className="text-h3 font-body">
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div>
                  <p className="text-small font-body opacity-60 mb-2">
                    ITC Italic (italic)
                  </p>
                  <p className="text-h3 font-body italic">
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>
            </div>

            {/* Type Scale */}
            <div>
              <h3 className="text-h3 font-display mb-6">Type Scale</h3>
              <div className="space-y-6">
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-display · 2.56rem → 8.75rem
                  </p>
                  <p className="text-display font-display leading-tight">
                    Display
                  </p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-h1 · 2.5rem → 5rem
                  </p>
                  <p className="text-h1 font-display leading-tight">
                    Heading 1
                  </p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-h2 · 1.88rem → 3.75rem
                  </p>
                  <p className="text-h2 font-display leading-tight">
                    Heading 2
                  </p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-h3 · 1.63rem → 2.5rem
                  </p>
                  <p className="text-h3 font-display leading-tight">
                    Heading 3
                  </p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-s1 · 1.5rem → 1.88rem
                  </p>
                  <p className="text-s1 font-display">Subtitle 1</p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-s2 · 1.13rem → 1.44rem
                  </p>
                  <p className="text-s2 font-display">Subtitle 2</p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-paragraph (base) · 1rem → 1.25rem
                  </p>
                  <p className="text-paragraph font-display">
                    Paragraph text for body content and longer form reading.
                  </p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-body-small · 0.81rem → 1.06rem
                  </p>
                  <p className="text-body-small font-display">
                    Body small for secondary content.
                  </p>
                </div>
                <div className="border-b border-black/10 pb-4">
                  <p className="text-small font-body opacity-60 mb-1">
                    text-small · 0.75rem → 0.88rem
                  </p>
                  <p className="text-small font-display">
                    Small text for captions and fine print.
                  </p>
                </div>
                <div>
                  <p className="text-small font-body opacity-60 mb-1">
                    text-label · 0.88rem → 0.94rem
                  </p>
                  <p className="text-label font-display">
                    Label text for buttons and forms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Colors - Light */}
        <Section title="Colors">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ColorSwatch name="Black" variable="--color-black" hex="#1A1A1A" />
            <ColorSwatch name="White" variable="--color-white" hex="#FFFFFF" />
            <ColorSwatch name="Text" variable="--color-text" hex="#383838" />
            <ColorSwatch name="Sand" variable="--color-sand" hex="#FFF5EB" />
            <ColorSwatch
              name="Soft Orange"
              variable="--color-softorange"
              hex="#FAD103"
            />
            <ColorSwatch name="Ocher" variable="--color-ocher" hex="#E3B012" />
            <ColorSwatch
              name="Sky Blue"
              variable="--color-skyblue"
              hex="#99BDFF"
            />
            <ColorSwatch name="Blue" variable="--color-blue" hex="#d4e8ff" />
            <ColorSwatch
              name="Yellow"
              variable="--color-yellow"
              hex="#ffff00"
            />
          </div>
        </Section>

        {/* Grid */}
        <Section title="Grid">
          <p className="text-paragraph font-body mb-6">
            12 columns on mobile, 24 columns on desktop. No gaps between columns.
          </p>

          <div className="grid grid-cols-12 md:grid-cols-24 gap-0">
            {Array.from({length: 24}).map((_, i) => (
              <div
                key={i}
                className={`relative h-16 border-x border-softorange/50 bg-softorange/20 ${i >= 12 ? 'hidden md:block' : ''}`}
              >
                <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-softorange px-1 text-small font-display">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
          <p className="text-small font-body opacity-60 mt-4">
            grid-cols-12 md:grid-cols-24 gap-0
          </p>
        </Section>

        {/* Spacing */}
        <Section title="Spacing">
          <p className="text-paragraph font-body mb-8 opacity-80">
            Tailwind spacing scale (4px base unit). Common values shown below.
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            {[1, 2, 4, 6, 8, 10, 12, 16, 20, 24].map((size) => (
              <div key={size} className="text-center">
                <div
                  className="bg-softorange mb-2"
                  style={{
                    width: `${size * 4}px`,
                    height: `${size * 4}px`,
                  }}
                />
                <p className="text-small font-body">p-{size}</p>
                <p className="text-small font-body opacity-60">
                  {size * 4}px
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius">
          <div className="flex flex-wrap gap-8 items-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-softorange rounded-card" />
              <p className="text-small font-body mt-2">rounded-card</p>
              <p className="text-small font-body opacity-60">
                0.625rem (10px)
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-softorange rounded-full" />
              <p className="text-small font-body mt-2">rounded-full</p>
              <p className="text-small font-body opacity-60">50%</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-softorange rounded-lg" />
              <p className="text-small font-body mt-2">rounded-lg</p>
              <p className="text-small font-body opacity-60">0.5rem</p>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </Section>

        {/* Stars */}
        <Section title="Stars Component">
          <div className="space-y-6">
            <div>
              <p className="text-small font-body opacity-60 mb-2">
                Full rating (5.0)
              </p>
              <Stars rating={5} color="black" />
            </div>
            <div>
              <p className="text-small font-body opacity-60 mb-2">
                Partial rating (4.8)
              </p>
              <Stars rating={4.8} color="black" />
            </div>
            <div>
              <p className="text-small font-body opacity-60 mb-2">
                Half rating (3.5)
              </p>
              <Stars rating={3.5} color="black" />
            </div>
            <div>
              <p className="text-small font-body opacity-60 mb-2">
                Size: sm (default)
              </p>
              <Stars rating={4.5} color="black" size="sm" />
            </div>
            <div>
              <p className="text-small font-body opacity-60 mb-2">
                Size: md
              </p>
              <Stars rating={4.5} color="black" size="md" />
            </div>
          </div>
        </Section>

        {/* Accordion */}
        <Section title="Accordion">
          <div className="max-w-xl">
            <Accordion items={accordionItems} defaultOpenIndex={0} />
          </div>
        </Section>

        {/* Tooltip */}
        <Section title="Tooltip">
          <p className="text-paragraph font-body mb-8">
            The tooltip shows product information on hover. Positioned relative
            to its container. Uses real product data from Shopify.
          </p>
          <div className="relative h-80 bg-skyblue rounded-card">
            <ProductTooltip
              handle="deodorant"
              position={{top: '20%', left: '10%'}}
              priority
            />
          </div>
        </Section>

        {/* Header Preview */}
        <Section title="Header">
          <p className="text-paragraph font-body mb-6">
            Floating pill header with menu, logo, and cart.
          </p>
          <Header cart={cart} inline />
        </Section>

        {/* Add to Cart Preview */}
        <Section title="Add to Cart">
          <p className="text-paragraph font-body mb-6">
            Sticky bottom bar for product pages.
          </p>
          {productData && productData.selectedVariant && (
            <StickyAddToCart
              product={{
                id: productData.id,
                title: productData.title,
                handle: productData.handle,
              }}
              selectedVariant={productData.selectedVariant}
              subtitle={productData.subtitle}
              reviewRating={productData.reviewRating}
              reviewCount={productData.reviewCount}
              productImage={productData.featuredImage}
              inline
            />
          )}
        </Section>

        {/* Added to Bag Popup */}
        <Section title="Added to Bag Popup">
          <p className="text-paragraph font-body mb-6">
            Confirmation popup shown after adding items to cart. Appears above
            the sticky Add to Cart bar with a slide-up animation.
          </p>
          <div className="space-y-4 mb-8">
            <p className="text-s2 font-display">Props:</p>
            <ul className="text-body-small font-body space-y-1 opacity-80">
              <li>
                • <code className="bg-black/10 px-1 rounded">isOpen</code> -
                Controls visibility
              </li>
              <li>
                • <code className="bg-black/10 px-1 rounded">onClose</code> -
                Callback when closed
              </li>
              <li>
                • <code className="bg-black/10 px-1 rounded">product</code> -
                Product info (image, title, variantTitle, price, currencyCode)
              </li>
              <li>
                • <code className="bg-black/10 px-1 rounded">cartCount</code> -
                Total items in cart
              </li>
              <li>
                • <code className="bg-black/10 px-1 rounded">checkoutUrl</code>{' '}
                - Shopify checkout URL
              </li>
            </ul>
          </div>
          {/* Static preview - showing the popup content without fixed positioning */}
          <div className="max-w-[600px]">
            <div className="bg-black text-sand rounded-card p-6">
              {/* Header with title and close button */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-s2 font-display">Added to your bag</span>
                <button
                  aria-label="Close"
                  className="text-sand hover:opacity-70 transition-opacity"
                >
                  <CrossIcon className="w-8 h-8" />
                </button>
              </div>

              {/* Product info with image and details */}
              <div className="flex gap-4">
                {productData?.featuredImage && (
                  <div className="shrink-0">
                    <img
                      src={productData.featuredImage}
                      alt={productData.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <span className="text-paragraph font-display">
                    {productData?.title || 'Product Title'}
                  </span>
                  {productData?.subtitle && (
                    <span className="text-small opacity-70">
                      {productData.subtitle}
                    </span>
                  )}
                  <span className="text-paragraph mt-1">
                    {productData?.selectedVariant?.price?.amount || '19.00'}{' '}
                    {productData?.selectedVariant?.price?.currencyCode || 'EUR'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <span className="flex-1 inline-flex items-center justify-center px-6 py-3 font-display text-label rounded-full border border-sand text-sand bg-transparent">
                  Your bag (2)
                </span>
                <span className="flex-1 inline-flex items-center justify-center px-6 py-3 font-display text-label rounded-full bg-sand text-black">
                  Checkout
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* Icons */}
        <Section title="Icons">
          <div className="space-y-8">
            {/* Logo Icons */}
            <div>
              <h3 className="text-h3 font-display mb-4">Logo</h3>
              <div className="flex flex-wrap gap-12 items-end">
                <div>
                  <LogoSmall className="h-8 text-black" />
                  <p className="text-small font-body mt-2">LogoSmall</p>
                </div>
                <div>
                  <LogoBig className="h-16 text-black" />
                  <p className="text-small font-body mt-2">LogoBig</p>
                </div>
              </div>
            </div>

            {/* Navigation Icons */}
            <div>
              <h3 className="text-h3 font-display mb-4">Navigation</h3>
              <div className="flex flex-wrap gap-12 items-end">
                <div>
                  <div className="h-10 flex items-end">
                    <HamburgerIcon className="w-6 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">HamburgerIcon</p>
                </div>
                <div>
                  <div className="h-10 flex items-end">
                    <CrossIcon className="w-10 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">CrossIcon</p>
                </div>
                <div>
                  <div className="h-10 flex items-end">
                    <SmileyIcon className="w-10 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">SmileyIcon</p>
                </div>
              </div>
            </div>

            {/* Wakey Shapes */}
            <div>
              <h3 className="text-h3 font-display mb-4">Wakey Shapes</h3>
              <div className="flex flex-wrap gap-8">
                <div className="text-center">
                  <div className="h-16 flex items-center justify-center">
                    <ShapeCircle className="w-16 h-16 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">ShapeCircle</p>
                </div>
                <div className="text-center">
                  <div className="h-16 flex items-center justify-center">
                    <ShapeHalfCircle className="w-16 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">ShapeHalfCircle</p>
                </div>
                <div className="text-center">
                  <div className="h-16 flex items-center justify-center">
                    <ShapeStar className="w-16 h-16 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">ShapeStar</p>
                </div>
                <div className="text-center">
                  <div className="h-16 flex items-center justify-center">
                    <ShapeFlower className="w-16 h-16 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">ShapeFlower</p>
                </div>
                <div className="text-center">
                  <div className="h-16 flex items-center justify-center">
                    <ShapeSparkle className="w-16 h-16 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">ShapeSparkle</p>
                </div>
                <div className="text-center">
                  <div className="h-16 flex items-center justify-center">
                    <ShapeHexagon className="w-16 h-16 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">ShapeHexagon</p>
                </div>
              </div>
            </div>

            {/* Payment Icons */}
            <div>
              <h3 className="text-h3 font-display mb-4">Payment Methods</h3>
              <div className="flex flex-wrap gap-12 items-end">
                <div>
                  <div className="h-8 flex items-end">
                    <IdealIcon className="w-6 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">IdealIcon</p>
                </div>
                <div>
                  <div className="h-8 flex items-end">
                    <KlarnaIcon className="w-6 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">KlarnaIcon</p>
                </div>
                <div>
                  <div className="h-8 flex items-end">
                    <IcsIcon className="w-6 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">IcsIcon</p>
                </div>
                <div>
                  <div className="h-8 flex items-end">
                    <VisaIcon className="w-8 text-black" />
                  </div>
                  <p className="text-small font-body mt-2">VisaIcon</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Animation Easings */}
        <Section title="Animation Easings">
          <p className="text-paragraph font-body mb-6">
            Custom easing functions for smooth animations.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <EasingPreview
              name="ease-out-expo"
              bezier="cubic-bezier(0.19, 1, 0.22, 1)"
              description="Dramatic slowdown at end"
            />
            <EasingPreview
              name="ease-out-back"
              bezier="cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              description="Slight overshoot at end"
            />
            <EasingPreview
              name="ease-out-sine"
              bezier="cubic-bezier(0.39, 0.575, 0.565, 1)"
              description="Gentle, natural deceleration"
            />
          </div>
        </Section>

        {/* Animation Utilities */}
        <Section title="Animation Utilities">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-s2 font-display mb-2">animate-marquee</p>
              <p className="text-body-small font-body opacity-60">
                Infinite horizontal scrolling for carousels
              </p>
            </div>
            <div>
              <p className="text-s2 font-display mb-2">animate-sticky-pop</p>
              <p className="text-body-small font-body opacity-60">
                Pop effect for sticky elements (0.2s)
              </p>
            </div>
            <div>
              <p className="text-s2 font-display mb-2">animate-cloud-text</p>
              <p className="text-body-small font-body opacity-60">
                Text reveal animation (5s cycle)
              </p>
            </div>
            <div>
              <p className="text-s2 font-display mb-2">animate-cloud-scroll</p>
              <p className="text-body-small font-body opacity-60">
                Vertical scrolling for clouds (60s cycle)
              </p>
            </div>
            <div>
              <p className="text-s2 font-display mb-2">hover-scale</p>
              <p className="text-body-small font-body opacity-60">
                Desktop-only scale transform on hover (1.02x)
              </p>
            </div>
            <div>
              <p className="text-s2 font-display mb-2">scrollbar-hide</p>
              <p className="text-body-small font-body opacity-60">
                Hide scrollbars while maintaining scroll functionality
              </p>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
