import {Button, BagIcon, AddBagIcon, CheckoutIcon} from '@wakey/ui';
import type {HeroSection as HeroSectionType, ButtonIcon} from '../types';
import {parseMarkdown} from '../utils/parseMarkdown';

interface Props {
  config: HeroSectionType['config'];
}

// Map icon types to components from @wakey/ui
function getIconComponent(icon: ButtonIcon) {
  const iconMap = {
    bag: <BagIcon className="w-5 h-5" />,
    'add-bag': <AddBagIcon className="w-5 h-5" />,
    checkout: <CheckoutIcon className="w-5 h-5" />,
    'arrow-right': (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path
          d="M5 12H19M19 12L12 5M19 12L12 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };
  return icon !== 'none' ? iconMap[icon] : undefined;
}

export function HeroSection({config}: Props) {
  return (
    <section className={`w-full bg-${config.backgroundColor}`}>
      {config.imageUrl && (
        <img src={config.imageUrl} alt="" className="w-full block" />
      )}
      <div className="px-8 py-10 text-center">
        <h1
          className={`${config.headlineStyle} font-display text-${config.textColor}`}
          dangerouslySetInnerHTML={{__html: parseMarkdown(config.headline)}}
        />
        {config.subheadline && (
          <p
            className={`mt-4 ${config.subheadlineStyle} font-display text-${config.textColor}`}
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(config.subheadline),
            }}
          />
        )}
        {config.ctaText && config.ctaUrl && (
          <div className="mt-6">
            <Button
              href={config.ctaUrl}
              variant={config.ctaVariant}
              icon={getIconComponent(config.ctaIcon)}
            >
              {config.ctaText}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
