import {ProductTooltip} from '~/components/ProductTooltip';
import {Button} from '~/components/Button';

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
  buttonText?: string;
  buttonTo?: string;
}

export function FeaturedProduct({
  backgroundImage,
  backgroundImageMobile,
  heading,
  productHandle,
  tooltipPosition,
  buttonText,
  buttonTo,
}: FeaturedProductProps) {
  return (
    <section className="relative w-full min-h-dvh flex items-center overflow-hidden rounded-card md:min-h-section ">
      <picture>
        {backgroundImageMobile && (
          <source media="(max-width: 48rem)" srcSet={backgroundImageMobile} />
        )}
        <img
          src={backgroundImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      </picture>

      <div className="relative z-10 p-4 md:p-8">
        <div className="text-h2 text-sand">{heading}</div>
        {buttonText && buttonTo && (
          <div className="mt-4">
            <Button variant="outline" to={buttonTo}>{buttonText}</Button>
          </div>
        )}
      </div>

      {productHandle && (
        <ProductTooltip handle={productHandle} position={tooltipPosition} />
      )}
    </section>
  );
}
