import type {Route} from './+types/design-system';
import {useState} from 'react';
import {Button, Stars, Accordion, AddedToBagPopup} from '@wakey/ui';
import {
  LogoBig,
  LogoSmall,
  HamburgerIcon,
  MenuCloseIcon,
  CrossIcon,
  SmileyIcon,
  VisaIcon,
  MastercardIcon,
  AmexIcon,
  PayPalIcon,
  IdealIcon,
  KlarnaIcon,
  ShapeCircle,
  ShapeStar,
  ShapeFlower,
  ShapeSparkle,
  ShapeHexagon,
  ShapeHalfCircle,
  BagIcon,
  AddBagIcon,
  CheckoutIcon,
  NotificationIcon,
  SearchIcon,
  AiIcon,
} from '@wakey/ui';
import {Header} from '~/components/Header';
import {ProductTooltip} from '~/components/ProductTooltip';
import {StickyAddToCart} from '~/components/StickyAddToCart';
import type {TooltipProduct} from '~/lib/tooltip-product';

export function meta(_args: Route.MetaArgs) {
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
          product {
            title
            handle
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

  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle: 'deodorant'},
  });

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

// Navigation structure
const NAV_ITEMS = [
  {
    id: 'foundations',
    label: 'Foundations',
    sections: [
      {id: 'typography', label: 'Typography'},
      {id: 'colors', label: 'Colors'},
      {id: 'spacing', label: 'Spacing'},
      {id: 'grid', label: 'Grid'},
      {id: 'border-radius', label: 'Border Radius'},
      {id: 'animation', label: 'Animation'},
    ],
  },
  {
    id: 'components',
    label: 'Components',
    sections: [
      {id: 'buttons', label: 'Buttons'},
      {id: 'stars', label: 'Stars'},
      {id: 'accordion', label: 'Accordion'},
      {id: 'tooltip', label: 'Tooltip'},
      {id: 'icons', label: 'Icons'},
    ],
  },
  {
    id: 'patterns',
    label: 'Patterns',
    sections: [
      {id: 'header', label: 'Header'},
      {id: 'footer', label: 'Footer'},
      {id: 'cart-components', label: 'Cart Components'},
      {id: 'section-components', label: 'Section Components'},
      {id: 'website-components', label: 'Website Components'},
    ],
  },
];

// Desktop Sidebar Navigation
function DesignSystemSidebar() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({behavior: 'auto', block: 'start'});
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <aside className="hidden lg:block fixed left-0 top-24 w-56 h-[calc(100vh-6rem)] overflow-y-auto p-6 border-r border-black/10 bg-white">
      <nav className="space-y-6">
        {NAV_ITEMS.map((category) => (
          <div key={category.id}>
            <button
              type="button"
              onClick={() => scrollToSection(category.id)}
              className="text-s2 font-display text-black hover:text-softorange transition-colors text-left"
            >
              {category.label}
            </button>
            <ul className="mt-2 space-y-1">
              {category.sections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className="text-body-small font-body text-text/70 hover:text-black transition-colors block py-1 text-left"
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

// Mobile Tabs Navigation
function DesignSystemTabs() {
  const [activeTab, setActiveTab] = useState('foundations');

  const handleTabClick = (categoryId: string) => {
    setActiveTab(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({behavior: 'auto', block: 'start'});
    }
  };

  return (
    <div className="lg:hidden sticky top-20 z-40 bg-white border-b border-black/10">
      <div className="flex">
        {NAV_ITEMS.map((category) => (
          <button
            key={category.id}
            onClick={() => handleTabClick(category.id)}
            className={`flex-1 py-3 text-label font-display text-center transition-colors ${
              activeTab === category.id
                ? 'text-black border-b-2 border-softorange'
                : 'text-text/60 hover:text-black'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Category Card Container
function CategoryCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-sand rounded-card p-6 md:p-10 scroll-mt-28">
      <div className="mb-8 md:mb-12">
        <h2 className="text-h2 font-display mb-2">{title}</h2>
        {description && (
          <p className="text-paragraph font-body text-text/70">{description}</p>
        )}
      </div>
      <div className="space-y-12 md:space-y-16">{children}</div>
    </div>
  );
}

// Section within a Category
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32">
      <h3 className="text-h3 font-display mb-6 pb-3 border-b border-black/10">
        {title}
      </h3>
      {children}
    </section>
  );
}

// Helper Components
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
        className="w-16 h-16 rounded-card border border-black/10 shrink-0"
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
    <div className="bg-white p-6 rounded-card">
      <div className="relative h-12 mb-4 flex items-center">
        <div className="absolute inset-x-0 h-px bg-black/20" />
        <div
          className="absolute w-6 h-6 bg-softorange rounded-full"
          style={{
            animation: `easing-demo-${name} 2s ${bezier} infinite`,
          }}
        />
      </div>
      <p className="text-s2 font-display mb-1">{name}</p>
      <p className="text-small font-body opacity-60 mb-2">{bezier}</p>
      <p className="text-body-small font-body">{description}</p>
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

function ComponentCard({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="bg-white p-4 rounded-card">
      <p className="text-s2 font-display mb-2">{name}</p>
      <p className="text-body-small font-body opacity-70">{description}</p>
    </div>
  );
}

export default function DesignSystem({loaderData}: Route.ComponentProps) {
  const {cart, productData} = loaderData;
  const tooltipProduct: TooltipProduct | null = productData
    ? {
        title: productData.title,
        handle: productData.handle,
        image: productData.featuredImage || '',
        subtitle: productData.subtitle,
        reviewCount: productData.reviewCount,
        reviewRating: productData.reviewRating,
      }
    : null;

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
    <div className="min-h-screen bg-white">
      <DesignSystemSidebar />

      <div className="lg:ml-56">
        {/* Page Header */}
        <header className="pt-24 md:pt-28 px-4 md:px-8 pb-6">
          <h1 className="text-h1 font-display mb-3">Design System</h1>
          <p className="text-paragraph font-body text-text/70 max-w-prose">
            A comprehensive overview of Wakey&apos;s design tokens, typography,
            colors, and UI components.
          </p>
        </header>

        <DesignSystemTabs />

        {/* Main Content */}
        <main className="px-4 md:px-8 py-8 space-y-8">
          {/* FOUNDATIONS */}
          <CategoryCard
            id="foundations"
            title="Foundations"
            description="The building blocks of the Wakey design system."
          >
            {/* Typography */}
            <Section id="typography" title="Typography">
              <div className="space-y-10">
                {/* Font Families */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    Font Families
                  </h4>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="bg-white p-4 rounded-card">
                      <p className="text-small font-body opacity-60 mb-2">
                        Founders (display)
                      </p>
                      <p className="text-h3 font-display leading-tight">
                        The quick brown fox
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-card">
                      <p className="text-small font-body opacity-60 mb-2">
                        ITC (body)
                      </p>
                      <p className="text-h3 font-body leading-tight">
                        The quick brown fox
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-card">
                      <p className="text-small font-body opacity-60 mb-2">
                        ITC Italic
                      </p>
                      <p className="text-h3 font-body italic leading-tight">
                        The quick brown fox
                      </p>
                    </div>
                  </div>
                </div>

                {/* Type Scale */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    Type Scale
                  </h4>
                  <div className="bg-white rounded-card overflow-hidden">
                    <div className="grid grid-cols-3 gap-4 p-4 border-b border-black/10 text-small font-display opacity-60">
                      <div>Class</div>
                      <div>Mobile</div>
                      <div className="hidden md:block">Desktop</div>
                    </div>
                    {[
                      {
                        name: 'text-display',
                        mobile: '2.56rem',
                        desktop: '8.75rem',
                        label: 'Display',
                      },
                      {
                        name: 'text-h1',
                        mobile: '2.5rem',
                        desktop: '5rem',
                        label: 'H1',
                      },
                      {
                        name: 'text-h2',
                        mobile: '1.88rem',
                        desktop: '3.75rem',
                        label: 'H2',
                      },
                      {
                        name: 'text-h3',
                        mobile: '1.63rem',
                        desktop: '2.5rem',
                        label: 'H3',
                      },
                      {
                        name: 'text-s1',
                        mobile: '1.5rem',
                        desktop: '1.88rem',
                        label: 'S1',
                      },
                      {
                        name: 'text-s2',
                        mobile: '1.13rem',
                        desktop: '1.44rem',
                        label: 'S2',
                      },
                      {
                        name: 'text-paragraph',
                        mobile: '1rem',
                        desktop: '1.25rem',
                        label: 'Paragraph',
                      },
                      {
                        name: 'text-body-small',
                        mobile: '0.81rem',
                        desktop: '1.06rem',
                        label: 'Body small',
                      },
                      {
                        name: 'text-small',
                        mobile: '0.75rem',
                        desktop: '0.88rem',
                        label: 'Small',
                      },
                      {
                        name: 'text-label',
                        mobile: '0.88rem',
                        desktop: '0.94rem',
                        label: 'Label',
                      },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="grid grid-cols-3 gap-4 items-center p-4 border-b border-black/5 last:border-0"
                      >
                        <div>
                          <code className="text-small bg-black/5 px-2 py-1 rounded font-body">
                            {item.name}
                          </code>
                        </div>
                        <div
                          className="font-display truncate"
                          style={{fontSize: item.mobile}}
                        >
                          {item.label}
                        </div>
                        <div
                          className="font-display truncate hidden md:block"
                          style={{fontSize: item.desktop}}
                        >
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Colors */}
            <Section id="colors" title="Colors">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ColorSwatch
                  name="Black"
                  variable="--color-black"
                  hex="#1A1A1A"
                />
                <ColorSwatch
                  name="White"
                  variable="--color-white"
                  hex="#FFFFFF"
                />
                <ColorSwatch
                  name="Text"
                  variable="--color-text"
                  hex="#383838"
                />
                <ColorSwatch
                  name="Sand"
                  variable="--color-sand"
                  hex="#FFF5EB"
                />
                <ColorSwatch
                  name="Soft Orange"
                  variable="--color-softorange"
                  hex="#FAD103"
                />
                <ColorSwatch
                  name="Ocher"
                  variable="--color-ocher"
                  hex="#E3B012"
                />
                <ColorSwatch
                  name="Sky Blue"
                  variable="--color-skyblue"
                  hex="#99BDFF"
                />
                <ColorSwatch
                  name="Blue"
                  variable="--color-blue"
                  hex="#d4e8ff"
                />
                <ColorSwatch
                  name="Yellow"
                  variable="--color-yellow"
                  hex="#ffff00"
                />
              </div>
            </Section>

            {/* Spacing */}
            <Section id="spacing" title="Spacing">
              <p className="text-paragraph font-body mb-6 opacity-80">
                Tailwind spacing scale (4px base unit).
              </p>
              <div className="flex flex-wrap gap-4 items-end">
                {[1, 2, 4, 6, 8, 10, 12, 16, 20, 24].map((size) => (
                  <div key={size} className="text-center">
                    <div
                      className="bg-softorange mb-2"
                      style={{width: `${size * 4}px`, height: `${size * 4}px`}}
                    />
                    <p className="text-small font-body">p-{size}</p>
                    <p className="text-small font-body opacity-60">
                      {size * 4}px
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Grid */}
            <Section id="grid" title="Grid">
              <p className="text-paragraph font-body mb-6 opacity-80">
                12 columns on mobile, 24 columns on desktop.
              </p>
              <div className="grid grid-cols-12 md:grid-cols-24 gap-0">
                {Array.from({length: 24}).map((_, i) => (
                  <div
                    key={i}
                    className={`relative h-12 border-x border-softorange/50 bg-softorange/20 ${i >= 12 ? 'hidden md:block' : ''}`}
                  >
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-softorange px-1 text-small font-display">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-small font-body opacity-60 mt-3">
                grid-cols-12 md:grid-cols-24 gap-0
              </p>
            </Section>

            {/* Border Radius */}
            <Section id="border-radius" title="Border Radius">
              <div className="flex flex-wrap gap-8 items-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-softorange rounded-card" />
                  <p className="text-small font-body mt-2">rounded-card</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-softorange rounded-full" />
                  <p className="text-small font-body mt-2">rounded-full</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-softorange rounded-lg" />
                  <p className="text-small font-body mt-2">rounded-lg</p>
                </div>
              </div>
            </Section>

            {/* Animation */}
            <Section id="animation" title="Animation">
              <div className="space-y-8">
                {/* Easings */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    Easings
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <EasingPreview
                      name="ease-out-expo"
                      bezier="cubic-bezier(0.19, 1, 0.22, 1)"
                      description="Dramatic slowdown"
                    />
                    <EasingPreview
                      name="ease-out-back"
                      bezier="cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                      description="Slight overshoot"
                    />
                    <EasingPreview
                      name="ease-out-sine"
                      bezier="cubic-bezier(0.39, 0.575, 0.565, 1)"
                      description="Natural deceleration"
                    />
                  </div>
                </div>

                {/* Utilities */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    Utilities
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        name: 'animate-marquee',
                        desc: 'Infinite horizontal scrolling',
                      },
                      {
                        name: 'animate-sticky-pop',
                        desc: 'Pop effect for sticky elements',
                      },
                      {
                        name: 'animate-cloud-text',
                        desc: 'Text reveal animation',
                      },
                      {
                        name: 'animate-cloud-scroll',
                        desc: 'Vertical cloud scrolling',
                      },
                      {
                        name: 'hover-scale',
                        desc: 'Desktop-only scale on hover',
                      },
                      {name: 'scrollbar-hide', desc: 'Hide scrollbars'},
                    ].map((util) => (
                      <div
                        key={util.name}
                        className="bg-white p-4 rounded-card"
                      >
                        <p className="text-s2 font-display mb-1">{util.name}</p>
                        <p className="text-body-small font-body opacity-60">
                          {util.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </CategoryCard>

          {/* COMPONENTS */}
          <CategoryCard
            id="components"
            title="Components"
            description="Reusable UI elements from @wakey/ui."
          >
            {/* Buttons */}
            <Section id="buttons" title="Buttons">
              <div className="space-y-8">
                <div>
                  <p className="text-small font-body opacity-60 mb-3">
                    Variants
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                  </div>
                </div>
                <div>
                  <p className="text-small font-body opacity-60 mb-3">
                    With icon
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary" icon={<AddBagIcon />}>
                      Add to Bag
                    </Button>
                    <Button variant="secondary" icon={<AddBagIcon />}>
                      Add to Bag
                    </Button>
                    <Button variant="outline" icon={<AddBagIcon />}>
                      Add to Bag
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-small font-body opacity-60 mb-3">
                    Disabled
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary" disabled>
                      Primary
                    </Button>
                    <Button variant="secondary" disabled>
                      Secondary
                    </Button>
                    <Button variant="outline" disabled>
                      Outline
                    </Button>
                  </div>
                </div>
              </div>
            </Section>

            {/* Stars */}
            <Section id="stars" title="Stars">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-small font-body opacity-60 mb-2">5.0</p>
                    <Stars rating={5} color="black" />
                  </div>
                  <div>
                    <p className="text-small font-body opacity-60 mb-2">4.8</p>
                    <Stars rating={4.8} color="black" />
                  </div>
                  <div>
                    <p className="text-small font-body opacity-60 mb-2">3.5</p>
                    <Stars rating={3.5} color="black" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-small font-body opacity-60 mb-2">
                      Size: sm
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
              </div>
            </Section>

            {/* Accordion */}
            <Section id="accordion" title="Accordion">
              <div className="max-w-xl">
                <Accordion items={accordionItems} defaultOpenIndex={0} />
              </div>
            </Section>

            {/* Tooltip */}
            <Section id="tooltip" title="Tooltip">
              <p className="text-paragraph font-body mb-6 opacity-80">
                Product tooltip with hover interaction. Uses real Shopify data.
              </p>
              <div className="relative h-72 bg-skyblue rounded-card">
                <ProductTooltip
                  handle={productData?.handle || 'deodorant'}
                  position={{top: '20%', left: '10%'}}
                  priority
                  product={tooltipProduct}
                />
              </div>
            </Section>

            {/* Icons */}
            <Section id="icons" title="Icons">
              <div className="space-y-8">
                {/* Logo */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">Logo</h4>
                  <div className="flex flex-wrap gap-8 items-end">
                    <div className="text-center">
                      <LogoSmall className="h-8 text-black" />
                      <p className="text-small font-body mt-2">LogoSmall</p>
                    </div>
                    <div className="text-center">
                      <LogoBig className="h-12 text-black" />
                      <p className="text-small font-body mt-2">LogoBig</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    Navigation
                  </h4>
                  <div className="flex flex-wrap gap-6 items-end">
                    {[
                      {Icon: HamburgerIcon, name: 'HamburgerIcon'},
                      {Icon: MenuCloseIcon, name: 'MenuCloseIcon'},
                      {Icon: CrossIcon, name: 'CrossIcon'},
                      {Icon: SmileyIcon, name: 'SmileyIcon'},
                      {Icon: BagIcon, name: 'BagIcon'},
                      {Icon: AddBagIcon, name: 'AddBagIcon'},
                      {Icon: CheckoutIcon, name: 'CheckoutIcon'},
                      {Icon: NotificationIcon, name: 'NotificationIcon'},
                      {Icon: SearchIcon, name: 'SearchIcon'},
                      {Icon: AiIcon, name: 'AiIcon'},
                    ].map(({Icon, name}) => (
                      <div key={name} className="text-center">
                        <Icon className="w-8 h-8 text-black" />
                        <p className="text-small font-body mt-2">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shapes */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    Wakey Shapes
                  </h4>
                  <div className="flex flex-wrap gap-6">
                    {[
                      {Icon: ShapeCircle, name: 'Circle'},
                      {Icon: ShapeHalfCircle, name: 'HalfCircle'},
                      {Icon: ShapeStar, name: 'Star'},
                      {Icon: ShapeFlower, name: 'Flower'},
                      {Icon: ShapeSparkle, name: 'Sparkle'},
                      {Icon: ShapeHexagon, name: 'Hexagon'},
                    ].map(({Icon, name}) => (
                      <div key={name} className="text-center">
                        <Icon className="w-12 h-12 text-black" />
                        <p className="text-small font-body mt-2">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    Payment
                  </h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    {[
                      {Icon: VisaIcon, name: 'Visa'},
                      {Icon: MastercardIcon, name: 'Mastercard'},
                      {Icon: AmexIcon, name: 'Amex'},
                      {Icon: PayPalIcon, name: 'PayPal'},
                      {Icon: IdealIcon, name: 'iDEAL'},
                      {Icon: KlarnaIcon, name: 'Klarna'},
                    ].map(({Icon, name}) => (
                      <div key={name} className="text-center">
                        <Icon className="h-8 w-auto" />
                        <p className="text-small font-body mt-2">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </CategoryCard>

          {/* PATTERNS */}
          <CategoryCard
            id="patterns"
            title="Patterns"
            description="Assembled solutions and page-level components."
          >
            {/* Header */}
            <Section id="header" title="Header">
              <p className="text-paragraph font-body mb-6 opacity-80">
                Floating pill header with menu, logo, search, and cart.
              </p>
              <Header cart={cart} inline />
            </Section>

            {/* Footer */}
            <Section id="footer" title="Footer">
              <p className="text-paragraph font-body mb-4 opacity-80">
                Site footer with navigation, social links, and payment icons.
              </p>
              <div className="bg-white p-4 rounded-card">
                <p className="text-s2 font-display mb-3">Features</p>
                <ul className="text-body-small font-body space-y-1 opacity-70">
                  <li>Dynamic background (blue default, yellow on /about)</li>
                  <li>Responsive layout</li>
                  <li>Social media links (Instagram, TikTok)</li>
                  <li>Payment method icons</li>
                </ul>
              </div>
            </Section>

            {/* Cart Components */}
            <Section id="cart-components" title="Cart Components">
              <div className="space-y-10">
                {/* Sticky Add to Cart */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    StickyAddToCart
                  </h4>
                  <p className="text-paragraph font-body mb-4 opacity-80">
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
                      productImage={productData.featuredImage}
                      inline
                    />
                  )}
                </div>

                {/* Added to Bag Popup */}
                <div>
                  <h4 className="text-s2 font-display mb-4 opacity-60">
                    AddedToBagPopup
                  </h4>
                  <p className="text-paragraph font-body mb-4 opacity-80">
                    Confirmation popup after adding items to cart.
                  </p>
                  <div className="relative">
                    <AddedToBagPopup
                      isOpen={true}
                      onClose={() => {}}
                      product={
                        productData
                          ? {
                              image: productData.featuredImage,
                              title: productData.title,
                              variantTitle: productData.subtitle,
                              price: (
                                <>
                                  {productData.selectedVariant?.price?.amount}{' '}
                                  {
                                    productData.selectedVariant?.price
                                      ?.currencyCode
                                  }
                                </>
                              ),
                            }
                          : null
                      }
                      cartCount={2}
                      checkoutUrl="/cart"
                      relative
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Section Components */}
            <Section id="section-components" title="Section Components">
              <p className="text-paragraph font-body mb-6 opacity-80">
                Page section components from{' '}
                <code className="bg-white px-2 py-1 rounded text-small">
                  ~/components/sections
                </code>
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ComponentCard
                  name="Hero"
                  description="Full-bleed hero with background, logo, CTA, tooltip"
                />
                <ComponentCard
                  name="FeaturedProduct"
                  description="Product showcase with add-to-cart"
                />
                <ComponentCard
                  name="TextMedia"
                  description="Two-column text + media layout"
                />
                <ComponentCard
                  name="ImageBanner"
                  description="Full-width banner with text overlay"
                />
                <ComponentCard
                  name="USPSection"
                  description="Three-column selling points"
                />
                <ComponentCard
                  name="IngredientsSection"
                  description="Ingredient carousel display"
                />
                <ComponentCard
                  name="ProductDescription"
                  description="Product description + USPs"
                />
                <ComponentCard
                  name="ProductReviews"
                  description="Reviews with video testimonial"
                />
                <ComponentCard name="FAQ" description="Accordion FAQ section" />
                <ComponentCard
                  name="CloudSection"
                  description="Animated clouds with text"
                />
                <ComponentCard
                  name="SocialSection"
                  description="Instagram/TikTok embeds"
                />
                <ComponentCard
                  name="Founder"
                  description="Team member profile"
                />
                <ComponentCard
                  name="IntroSection"
                  description="Simple text intro"
                />
                <ComponentCard
                  name="PageHeader"
                  description="Page title header"
                />
                <ComponentCard
                  name="BlogArticle"
                  description="Blog post layout"
                />
              </div>
            </Section>

            {/* Website Components */}
            <Section id="website-components" title="Website Components">
              <p className="text-paragraph font-body mb-6 opacity-80">
                Core website components from{' '}
                <code className="bg-white px-2 py-1 rounded text-small">
                  ~/components
                </code>
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ComponentCard
                  name="Header"
                  description="Floating pill header"
                />
                <ComponentCard
                  name="Footer"
                  description="Site footer with nav + payment"
                />
                <ComponentCard
                  name="ProductCarousel"
                  description="Media carousel for products"
                />
                <ComponentCard
                  name="MediaItem"
                  description="Image/video renderer"
                />
                <ComponentCard
                  name="StickyAddToCart"
                  description="Sticky product add-to-cart"
                />
                <ComponentCard
                  name="ProductTooltip"
                  description="Hoverable product info"
                />
                <ComponentCard
                  name="NavigationDropdown"
                  description="Full-screen nav overlay"
                />
                <ComponentCard
                  name="AnnouncementBar"
                  description="Top announcement banner"
                />
                <ComponentCard
                  name="FreeShippingBar"
                  description="Shipping progress bar"
                />
                <ComponentCard
                  name="CartMain"
                  description="Main cart component"
                />
                <ComponentCard
                  name="CartLineItem"
                  description="Cart line item"
                />
                <ComponentCard
                  name="SearchResults"
                  description="Search results display"
                />
              </div>
            </Section>
          </CategoryCard>
        </main>
      </div>
    </div>
  );
}
