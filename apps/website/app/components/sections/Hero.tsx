/**
 * Hero component for displaying full-screen hero sections with the Wakey logo.
 *
 * TODO: Currently unused but retained for future pages that need a logo-centric
 * hero layout (vs. FeaturedProduct which shows text headings). This component
 * is documented in CLAUDE.md as an available MDX section component.
 *
 * Usage in MDX:
 * ```mdx
 * import {Hero} from '~/components/sections'
 * <Hero backgroundImage="..." productHandle="deodorant" />
 * ```
 */
import {WakeyLogo} from '~/components/WakeyLogo';
import {ProductTooltip} from '~/components/ProductTooltip';
import {optimizeShopifyImage, imagePresets} from '~/lib/shopify-image';
import type {TooltipProduct} from '~/lib/tooltip-product';

interface HeroProps {
  backgroundImage: string;
  backgroundImageMobile?: string;
  showLogo?: boolean;
  logoColor?: string;
  productHandle?: string;
  tooltipPosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  tooltipProduct?: TooltipProduct | null;
}

export function Hero({
  backgroundImage,
  backgroundImageMobile,
  showLogo = true,
  logoColor = '#fad103',
  productHandle,
  tooltipPosition,
  tooltipProduct,
}: HeroProps) {
  // Optimize images with Shopify CDN transformations
  const optimizedDesktop = optimizeShopifyImage(
    backgroundImage,
    imagePresets.hero,
  );
  const optimizedMobile = backgroundImageMobile
    ? optimizeShopifyImage(backgroundImageMobile, imagePresets.heroMobile)
    : optimizeShopifyImage(backgroundImage, imagePresets.heroMobile);

  return (
    <section className="relative w-full min-h-[max(50rem,100dvh)] flex items-end justify-start overflow-hidden">
      <picture>
        <source media="(max-width: 48rem)" srcSet={optimizedMobile} />
        <img
          src={optimizedDesktop}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      {productHandle && (
        <ProductTooltip
          handle={productHandle}
          position={tooltipPosition}
          priority
          product={tooltipProduct}
        />
      )}
      {showLogo && (
        <div className="relative z-1 w-full p-4 md:p-8 max-w-section">
          <WakeyLogo className="w-full h-auto" color={logoColor} />
        </div>
      )}
    </section>
  );
}

interface TextSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function TextSection({children, className = ''}: TextSectionProps) {
  return (
    <section className={`p-6 md:p-12 bg-sand ${className}`}>
      <div className="prose-wakey">{children}</div>
    </section>
  );
}
