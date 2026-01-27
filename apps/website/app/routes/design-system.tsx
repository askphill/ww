import type {Route} from './+types/design-system';
import favicon from '~/assets/favicon.svg';
import {
  Button,
  Stars,
  Accordion,
  Input,
  CheckCircleIcon,
  ProductCard,
  BlogCard,
  Tooltip,
} from '@wakey/ui';
import {AddedToBagPopup} from '~/components/AddedToBagPopup';
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
import {Footer} from '~/components/Footer';
import {ProductTooltip} from '~/components/ProductTooltip';
import {StickyAddToCart} from '~/components/StickyAddToCart';
import type {TooltipProduct} from '~/lib/tooltip-product';

// Section components
import {PageHeader} from '~/components/sections/PageHeader';
import {IntroSection} from '~/components/sections/IntroSection';
import {FAQ} from '~/components/sections/FAQ';
import {ContactSection} from '~/components/sections/ContactSection';
import {USPSection} from '~/components/sections/USPSection';
import {ImageBanner} from '~/components/sections/ImageBanner';
import {Hero, TextSection} from '~/components/sections/Hero';
import {FeaturedProduct} from '~/components/sections/FeaturedProduct';
import {IngredientsSection} from '~/components/sections/IngredientsSection';
import {ProductDescription} from '~/components/sections/ProductDescription';
import {SocialSection} from '~/components/sections/SocialSection';
import {Founder} from '~/components/sections/Founder';
import {CloudSection} from '~/components/sections/CloudSection';
import {BlogArticle} from '~/components/sections/BlogArticle';
import {TextMedia} from '~/components/sections/TextMedia';
import {ProductReviews} from '~/components/sections/ProductReviews';

export function meta(_args: Route.MetaArgs) {
  return [
    {title: 'Design System | Wakey'},
    {name: 'robots', content: 'noindex'},
  ];
}

export const handle = {
  hideFooter: true,
  hideHeader: true,
};

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

// Sidebar navigation structure
const SIDEBAR_NAV = [
  {
    id: 'introduction',
    label: 'Introduction',
    items: [],
  },
  {
    id: 'foundations',
    label: 'Tokens',
    items: [
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
    label: 'Blocks',
    items: [
      {id: 'buttons', label: 'Button'},
      {id: 'inputs', label: 'Input'},
      {id: 'stars', label: 'Stars'},
      {id: 'accordion', label: 'Accordion'},
      {id: 'icons', label: 'Icons'},
      {id: 'product-card', label: 'ProductCard'},
      {id: 'blog-card', label: 'BlogCard'},
      {id: 'tooltip', label: 'Tooltip'},
      {id: 'sticky-atc', label: 'Sticky ATC'},
      {id: 'added-to-bag', label: 'Added to Bag'},
    ],
  },
  {
    id: 'sections',
    label: 'Sections',
    items: [
      {id: 'header', label: 'Header'},
      {id: 'footer', label: 'Footer'},
      {id: 'hero', label: 'Hero'},
      {id: 'featured-product', label: 'FeaturedProduct'},
      {id: 'image-banner', label: 'ImageBanner'},
      {id: 'text-media', label: 'TextMedia'},
      {id: 'founder', label: 'Founder'},
      {id: 'social-section', label: 'SocialSection'},
      {id: 'cloud-section', label: 'CloudSection'},
      {id: 'ingredients-section', label: 'IngredientsSection'},
      {id: 'product-reviews', label: 'ProductReviews'},
      {id: 'page-header', label: 'PageHeader'},
      {id: 'intro-section', label: 'IntroSection'},
      {id: 'usp-section', label: 'USPSection'},
      {id: 'product-description', label: 'ProductDescription'},
      {id: 'text-section', label: 'TextSection'},
      {id: 'blog-article', label: 'BlogArticle'},
      {id: 'faq', label: 'FAQ'},
      {id: 'contact-section', label: 'ContactSection'},
    ],
  },
];

function DesignSystemSidebar() {
  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  return (
    <aside className="hidden lg:block fixed top-0 left-8 w-56 h-svh overflow-y-auto scrollbar-hide">
      <img src={favicon} alt="Wakey" className="w-12 h-12 mb-6 mt-8" />
      <nav className="space-y-6 pb-12">
        {SIDEBAR_NAV.map((section) => (
          <div key={section.id}>
            <button
              onClick={() => handleNavClick(section.id)}
              className="text-small font-display text-text/50 hover:text-text transition-colors uppercase tracking-wide cursor-pointer"
            >
              {section.label}
            </button>
            {section.items.length > 0 && (
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className="text-body-small font-display text-text hover:text-black transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
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
    <div id={id} className="bg-sand rounded-card p-6 md:p-10 scroll-mt-8">
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
    <section id={id} className="scroll-mt-12">
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
        image:
          productData.featuredImage ||
          'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
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

      <div className="lg:ml-64">
        {/* Main Content */}
        <main className="px-4 md:px-8 pt-8 md:pt-12 pb-24 space-y-8">
          {/* INTRODUCTION */}
          <div
            id="introduction"
            className="bg-sand rounded-card p-6 md:p-10 scroll-mt-8"
          >
            <div className="max-w-3xl">
              <h1 className="text-h1 font-display mb-4">Design System</h1>
              <p className="text-s1 font-display text-text/80 mb-6">
                The building blocks of the Wakey brand experience.
              </p>
              <div className="prose prose-lg font-display text-text/70 space-y-4">
                <p>
                  This design system documents the visual language, components,
                  and patterns that make up the Wakey brand. It serves as a
                  single source of truth for designers and developers working on
                  Wakey products.
                </p>
                <p>
                  Built on Tailwind CSS v4 with a custom theme, every element is
                  designed to feel warm, playful, and approachable — just like
                  waking up to a fresh morning.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="bg-white rounded-card p-4 flex-1 min-w-48">
                  <p className="text-s2 font-display text-black mb-1">Tokens</p>
                  <p className="text-body-small font-display text-text/60">
                    Typography, colors, spacing, and motion
                  </p>
                </div>
                <div className="bg-white rounded-card p-4 flex-1 min-w-48">
                  <p className="text-s2 font-display text-black mb-1">Blocks</p>
                  <p className="text-body-small font-display text-text/60">
                    Reusable UI components from @wakey/ui
                  </p>
                </div>
                <div className="bg-white rounded-card p-4 flex-1 min-w-48">
                  <p className="text-s2 font-display text-black mb-1">
                    Sections
                  </p>
                  <p className="text-body-small font-display text-text/60">
                    Page-level layouts and patterns
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TOKENS */}
          <CategoryCard
            id="foundations"
            title="Tokens"
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

          {/* BLOCKS */}
          <CategoryCard
            id="components"
            title="Blocks"
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

            {/* Inputs */}
            <Section id="inputs" title="Inputs">
              <div className="space-y-8">
                <div>
                  <p className="text-small font-body opacity-60 mb-3">
                    Variants
                  </p>
                  <div className="flex flex-col gap-4 max-w-md">
                    <Input placeholder="Outline (default)" />
                    <Input variant="filled" placeholder="Filled" />
                  </div>
                </div>
                <div>
                  <p className="text-small font-body opacity-60 mb-3">
                    With icon (success state)
                  </p>
                  <div className="flex flex-col gap-4 max-w-md">
                    <Input
                      placeholder="Email"
                      value="example@wakey.care"
                      icon={<CheckCircleIcon />}
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <p className="text-small font-body opacity-60 mb-3">
                    Disabled
                  </p>
                  <div className="flex flex-col gap-4 max-w-md">
                    <Input placeholder="Disabled input" disabled />
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

            {/* ProductCard */}
            <Section id="product-card" title="ProductCard">
              <p className="text-body-small font-body mb-4 opacity-70">
                Generic product card from @wakey/ui. Accepts primitive props for
                Shopify-agnostic usage.
              </p>
              <div className="max-w-xs">
                <ProductCard
                  to="/products/deodorant"
                  image={{
                    src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                    alt: 'Wakey Deodorant',
                  }}
                  title="Natural Deodorant"
                  price="$12.00"
                  loading="eager"
                />
              </div>
            </Section>

            {/* BlogCard */}
            <Section id="blog-card" title="BlogCard">
              <p className="text-body-small font-body mb-4 opacity-70">
                Generic blog card from @wakey/ui. Accepts primitive props for
                displaying article previews.
              </p>
              <div className="max-w-sm">
                <BlogCard
                  to="/blog/morning-routine"
                  image={{
                    src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                    alt: 'Morning routine',
                  }}
                  title="The Perfect Morning Routine"
                  description="Start your day with confidence using these simple tips for a fresh, energized morning."
                  date="January 15, 2024"
                  loading="eager"
                />
              </div>
            </Section>

            {/* Tooltip */}
            <Section id="tooltip" title="Tooltip">
              <p className="text-body-small font-body mb-4 opacity-70">
                Product tooltip with hover interaction. Available in dark and
                light variants.
              </p>
              <div className="flex flex-wrap gap-8 items-start py-8">
                <div
                  className="flex flex-col gap-2"
                  style={{minWidth: '275px'}}
                >
                  <span className="text-small opacity-60">
                    Dark (for dark backgrounds)
                  </span>
                  <div className="relative bg-black rounded-card p-4 h-24">
                    <Tooltip
                      product={{
                        title: 'Natural Deodorant',
                        url: '/products/deodorant',
                        image:
                          'https://cdn.shopify.com/s/files/1/0609/8747/4152/products/wakey-shot.png?v=1701280929',
                        subtitle: 'Mighty Citrus',
                        reviewCount: 121,
                        reviewRating: 4.8,
                      }}
                      position={{top: '16px', left: '16px'}}
                      variant="dark"
                    />
                  </div>
                </div>
                <div
                  className="flex flex-col gap-2"
                  style={{minWidth: '275px'}}
                >
                  <span className="text-small opacity-60">
                    Light (for light backgrounds)
                  </span>
                  <div className="relative bg-white rounded-card p-4 h-24">
                    <Tooltip
                      product={{
                        title: 'Natural Deodorant',
                        url: '/products/deodorant',
                        image:
                          'https://cdn.shopify.com/s/files/1/0609/8747/4152/products/wakey-shot.png?v=1701280929',
                        subtitle: 'Mighty Citrus',
                        reviewCount: 121,
                        reviewRating: 4.8,
                      }}
                      position={{top: '16px', left: '16px'}}
                      variant="light"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Sticky Add to Cart */}
            <Section id="sticky-atc" title="Sticky Add to Cart">
              <p className="text-body-small font-body mb-4 opacity-70">
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
            </Section>

            {/* Added to Bag Popup */}
            <Section id="added-to-bag" title="Added to Bag Popup">
              <p className="text-body-small font-body mb-4 opacity-70">
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
                              {productData.selectedVariant?.price?.currencyCode}
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
            </Section>
          </CategoryCard>

          {/* SECTIONS */}
          <CategoryCard
            id="sections"
            title="Sections"
            description="Page-level components and assembled solutions."
          >
            {/* Header */}
            <Section id="header" title="Header">
              <p className="text-body-small font-body mb-4 opacity-70">
                Floating pill header with menu, logo, search, and cart.
              </p>
              <Header cart={cart} inline />
            </Section>

            {/* Footer */}
            <Section id="footer" title="Footer">
              <p className="text-body-small font-body mb-4 opacity-70">
                Site footer with navigation, social links, and payment icons.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <Footer />
              </div>
            </Section>

            {/* Hero */}
            <Section id="hero" title="Hero">
              <p className="text-body-small font-body mb-4 opacity-70">
                Full-bleed hero with Wakey logo and optional product tooltip.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <Hero
                  backgroundImage="https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975"
                  showLogo={true}
                  logoColor="#fad103"
                />
              </div>
            </Section>

            {/* FeaturedProduct */}
            <Section id="featured-product" title="FeaturedProduct">
              <p className="text-body-small font-body mb-4 opacity-70">
                Product showcase with heading, CTA, and optional tooltip.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <FeaturedProduct
                  backgroundImage="https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975"
                  heading={
                    <>
                      Fresh starts
                      <br />
                      <em>every morning</em>
                    </>
                  }
                  buttonText="Shop now"
                  buttonTo="/products/deodorant"
                />
              </div>
            </Section>

            {/* ImageBanner */}
            <Section id="image-banner" title="ImageBanner">
              <p className="text-body-small font-body mb-4 opacity-70">
                Full-width banner with background image/video and text overlay.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <ImageBanner
                  backgroundImage="https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975"
                  text="Start your day with <em>confidence</em> and fresh energy"
                  label="New arrival"
                  textColor="#ffffff"
                  overlayColor="#000000"
                  overlayOpacity={40}
                  alignment="center"
                />
              </div>
            </Section>

            {/* TextMedia */}
            <Section id="text-media" title="TextMedia">
              <p className="text-body-small font-body mb-4 opacity-70">
                Two-column layout with video on one side and text + CTA on the
                other.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <TextMedia
                  videoUrl="https://cdn.shopify.com/videos/c/o/v/30bfb56ee7ec4ab2862899ee934d3be2.mov"
                  videoAlt="Wakey deodorant in use"
                  text="Start your day <em>the right way</em> with natural ingredients that care for your skin."
                  buttonText="Shop now"
                  buttonUrl="/products/deodorant"
                />
              </div>
            </Section>

            {/* Founder */}
            <Section id="founder" title="Founder">
              <p className="text-body-small font-body mb-4 opacity-70">
                Team member profile with image, quote, and signature.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <Founder
                  image="https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975"
                  imageAlt="Founder portrait"
                  heading="We started Wakey because we believed there had to be a better way."
                  signature="https://cdn.shopify.com/s/files/1/0609/8747/4152/files/sig.png?v=1662367678"
                  name="— The Wakey Team"
                >
                  <p>
                    After years of using products filled with chemicals we
                    couldn&apos;t pronounce, we decided to create something
                    different.
                  </p>
                  <p>
                    Something natural. Something that works. Something we&apos;d
                    be proud to share with our friends and family.
                  </p>
                </Founder>
              </div>
            </Section>

            {/* SocialSection */}
            <Section id="social-section" title="SocialSection">
              <p className="text-body-small font-body mb-4 opacity-70">
                Interactive social media gallery with mouse trail effect
                (desktop) or carousel (mobile).
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <SocialSection
                  heading="Get featured"
                  hashtag="#wakeycare"
                  images={[
                    {
                      src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                      alt: 'Customer photo 1',
                    },
                    {
                      src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                      alt: 'Customer photo 2',
                    },
                    {
                      src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                      alt: 'Customer photo 3',
                    },
                    {
                      src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                      alt: 'Customer photo 4',
                    },
                    {
                      src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                      alt: 'Customer photo 5',
                    },
                    {
                      src: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                      alt: 'Customer photo 6',
                    },
                  ]}
                  lerpFactor={2}
                />
              </div>
            </Section>

            {/* CloudSection */}
            <Section id="cloud-section" title="CloudSection">
              <p className="text-body-small font-body mb-4 opacity-70">
                Animated section with floating images and text reveal animation.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <CloudSection />
              </div>
            </Section>

            {/* IngredientsSection */}
            <Section id="ingredients-section" title="IngredientsSection">
              <p className="text-body-small font-body mb-4 opacity-70">
                Ingredient showcase with image carousel.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <IngredientsSection
                  title="Ingredients"
                  ingredientsList="<strong>Coconut Oil</strong> · <strong>Shea Butter</strong> · <strong>Aloe Vera</strong> · <strong>Essential Oils</strong>"
                  items={[
                    {
                      id: 'coconut',
                      name: 'Coconut<br/>Oil',
                      image:
                        'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                    },
                    {
                      id: 'shea',
                      name: 'Shea<br/>Butter',
                      image:
                        'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                    },
                    {
                      id: 'aloe',
                      name: 'Aloe<br/>Vera',
                      image:
                        'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                    },
                  ]}
                />
              </div>
            </Section>

            {/* ProductReviews */}
            <Section id="product-reviews" title="ProductReviews">
              <p className="text-body-small font-body mb-4 opacity-70">
                Reviews section with rating display, review list, and video
                testimonial. Fetches data from /api/reviews/[handle].
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <ProductReviews
                  productHandle="deodorant"
                  videoUrl="https://cdn.shopify.com/videos/c/vp/4d9fde73a12b42bfb9ad89d733cd91e9/4d9fde73a12b42bfb9ad89d733cd91e9.HD-1080p-7.2Mbps-59362307.mp4?v=0"
                  videoAlt="Customer testimonial"
                  tooltipProduct={tooltipProduct}
                />
              </div>
            </Section>

            {/* PageHeader */}
            <Section id="page-header" title="PageHeader">
              <p className="text-body-small font-body mb-4 opacity-70">
                Page title header with optional subtitle.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <PageHeader
                  title="Example Page Title"
                  subtitle="An optional subtitle that provides more context"
                />
              </div>
            </Section>

            {/* IntroSection */}
            <Section id="intro-section" title="IntroSection">
              <p className="text-body-small font-body mb-4 opacity-70">
                Simple text intro with heading, description, and CTA button.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <IntroSection
                  heading={
                    <>
                      We believe in <em>better</em> mornings
                    </>
                  }
                  description="Our mission is to help you start every day feeling fresh, confident, and ready to take on the world."
                  buttonText="Our story"
                  buttonTo="/about"
                />
              </div>
            </Section>

            {/* USPSection */}
            <Section id="usp-section" title="USPSection">
              <p className="text-body-small font-body mb-4 opacity-70">
                Carousel of unique selling points with icons.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <USPSection
                  items={[
                    {
                      title: '100% Natural',
                      body: 'Made with only the finest natural ingredients.',
                    },
                    {
                      title: '24h Protection',
                      body: 'Long-lasting freshness throughout your day.',
                    },
                    {
                      title: 'Eco-Friendly',
                      body: 'Sustainable packaging that cares for our planet.',
                    },
                  ]}
                />
              </div>
            </Section>

            {/* ProductDescription */}
            <Section id="product-description" title="ProductDescription">
              <p className="text-body-small font-body mb-4 opacity-70">
                Product description with title and USP list.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <ProductDescription
                  title="Why you love it"
                  descriptionHtml="Our deodorant is crafted with care using only the <em>finest natural ingredients</em>. No aluminum, no parabens, just pure freshness that lasts all day."
                  usps={[
                    '100% Natural ingredients',
                    '24-hour protection',
                    'Dermatologically tested',
                    'Vegan & cruelty-free',
                  ]}
                />
              </div>
            </Section>

            {/* TextSection */}
            <Section id="text-section" title="TextSection">
              <p className="text-body-small font-body mb-4 opacity-70">
                Simple prose section for MDX content.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <TextSection>
                  <h2>Morning essentials</h2>
                  <p>
                    Start your day right with products designed to make you feel
                    confident and fresh. Our natural formulas work with your
                    body, not against it.
                  </p>
                </TextSection>
              </div>
            </Section>

            {/* BlogArticle */}
            <Section id="blog-article" title="BlogArticle">
              <p className="text-body-small font-body mb-4 opacity-70">
                Blog post layout with header, featured image, and content.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <BlogArticle
                  frontmatter={{
                    title: 'The Science Behind Natural Deodorants',
                    slug: 'science-natural-deodorants',
                    description:
                      'Learn how natural deodorants work and why they are better for your skin.',
                    publishedAt: '2024-01-15',
                    author: 'Wakey Team',
                    tags: ['Science', 'Ingredients', 'Natural'],
                    featuredImage: {
                      url: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
                      alt: 'Natural ingredients',
                    },
                  }}
                >
                  <p>
                    Natural deodorants work differently than traditional
                    antiperspirants. Instead of blocking your sweat glands, they
                    neutralize odor-causing bacteria while allowing your body to
                    function naturally.
                  </p>
                  <p>
                    Our formula uses a combination of coconut oil, shea butter,
                    and essential oils to keep you fresh throughout the day.
                  </p>
                </BlogArticle>
              </div>
            </Section>

            {/* FAQ */}
            <Section id="faq" title="FAQ">
              <p className="text-body-small font-body mb-4 opacity-70">
                Accordion FAQ section with title and description.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <FAQ
                  title="Frequently Asked Questions"
                  description={
                    <>
                      Got questions? We&apos;ve got answers. If you can&apos;t
                      find what you&apos;re looking for, reach out to our team.
                    </>
                  }
                  items={[
                    {
                      id: 'faq-1',
                      title: 'How long does shipping take?',
                      content:
                        'Standard shipping takes 3-5 business days within the EU. Express shipping is available for next-day delivery.',
                    },
                    {
                      id: 'faq-2',
                      title: 'What is your return policy?',
                      content:
                        "We offer a 30-day money-back guarantee. If you're not satisfied, simply return the product for a full refund.",
                    },
                    {
                      id: 'faq-3',
                      title: 'Is the product suitable for sensitive skin?',
                      content:
                        'Yes! Our formula is dermatologically tested and designed to be gentle on all skin types, including sensitive skin.',
                    },
                  ]}
                />
              </div>
            </Section>

            {/* ContactSection */}
            <Section id="contact-section" title="ContactSection">
              <p className="text-body-small font-body mb-4 opacity-70">
                Contact details layout with email and address.
              </p>
              <div className="rounded-card overflow-hidden border border-black/10">
                <ContactSection
                  title="Get in Touch"
                  description={
                    <>
                      We&apos;d love to hear from you. Reach out for questions,
                      feedback, or just to say hi.
                    </>
                  }
                  items={[
                    {
                      title: 'General Inquiries',
                      email: 'hello@wakey.care',
                    },
                    {
                      title: 'Press',
                      email: 'press@wakey.care',
                    },
                    {
                      title: 'Headquarters',
                      address: [
                        'Wakey Care B.V.',
                        'Keizersgracht 123',
                        '1015 CJ Amsterdam',
                        'The Netherlands',
                      ],
                    },
                  ]}
                />
              </div>
            </Section>
          </CategoryCard>
        </main>
      </div>
    </div>
  );
}
