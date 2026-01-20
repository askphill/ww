import {ProductTooltip} from '~/components/ProductTooltip';
import {Button} from '@wakey/ui';
import {optimizeShopifyImage, imagePresets} from '~/lib/shopify-image';
import type {TooltipProduct} from '~/lib/tooltip-product';

interface FeaturedProductProps {
  backgroundImage: string;
  backgroundImageMobile?: string;
  heading: React.ReactNode;
  productHandle?: string;
  tooltipPosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  tooltipProduct?: TooltipProduct | null;
  buttonText?: string;
  buttonTo?: string;
}

export function FeaturedProduct({
  backgroundImage,
  backgroundImageMobile,
  heading,
  productHandle,
  tooltipPosition,
  tooltipProduct,
  buttonText,
  buttonTo,
}: FeaturedProductProps) {
  // Optimize images with Shopify CDN transformations
  const optimizedDesktop = optimizeShopifyImage(
    backgroundImage,
    imagePresets.hero,
  );
  const optimizedMobile = backgroundImageMobile
    ? optimizeShopifyImage(backgroundImageMobile, imagePresets.heroMobile)
    : optimizeShopifyImage(backgroundImage, imagePresets.heroMobile);

  return (
    <section className="relative w-full min-h-[max(50rem,100dvh)] flex items-center overflow-hidden">
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

      <div className="relative z-10 p-4 md:p-8">
        <div className="text-h2 text-sand">{heading}</div>
        {buttonText && buttonTo && (
          <div className="mt-4">
            <Button variant="outline" to={buttonTo} prefetch="intent">
              {buttonText}
            </Button>
          </div>
        )}
      </div>

      {productHandle && (
        <ProductTooltip
          handle={productHandle}
          position={tooltipPosition}
          product={tooltipProduct}
        />
      )}
    </section>
  );
}
