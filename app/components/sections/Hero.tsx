import {WakeyLogo} from '~/components/WakeyLogo';
import {ProductTooltip} from '~/components/ProductTooltip';

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
}

export function Hero({
  backgroundImage,
  backgroundImageMobile,
  showLogo = true,
  logoColor = '#fad103',
  productHandle,
  tooltipPosition,
}: HeroProps) {
  return (
    <section className="relative w-full min-h-dvh flex items-end justify-start overflow-hidden rounded-[1.25rem] md:rounded-[1.875rem]">
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
      {productHandle && (
        <ProductTooltip handle={productHandle} position={tooltipPosition} />
      )}
      {showLogo && (
        <div className="relative z-10 w-full p-4 md:p-8">
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

export function TextSection({ children, className = '' }: TextSectionProps) {
  return (
    <section className={`p-6 md:p-12 rounded-[1.25rem] md:rounded-[1.875rem] bg-sand ${className}`}>
      <div className="prose-wakey">
        {children}
      </div>
    </section>
  );
}
