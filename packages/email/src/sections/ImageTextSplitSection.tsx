import {Button, BagIcon, AddBagIcon, CheckoutIcon} from '@wakey/ui';
import type {
  ImageTextSplitSection as ImageTextSplitSectionType,
  ButtonIcon,
} from '../types';
import {parseMarkdown} from '../utils/parseMarkdown';

interface Props {
  config: ImageTextSplitSectionType['config'];
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

export function ImageTextSplitSection({config}: Props) {
  const imageContent = config.imageUrl ? (
    <img src={config.imageUrl} alt="" className="w-full block" />
  ) : (
    <div className="bg-sand h-48 flex items-center justify-center">
      <span className="text-black/50 text-small">Add Image</span>
    </div>
  );

  // Parse markdown and preserve line breaks for body text
  const bodyHtml = parseMarkdown(config.bodyText).replace(/\n/g, '<br />');

  const textContent = (
    <div className="p-8 flex flex-col justify-center">
      <h2 className={`${config.headlineStyle} font-display text-black m-0`}>
        {config.headline}
      </h2>
      <p
        className={`mt-4 ${config.bodyStyle} font-display text-black m-0`}
        dangerouslySetInnerHTML={{__html: bodyHtml}}
      />
      {config.ctaText && config.ctaUrl && (
        <div className="mt-5">
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
  );

  return (
    <section className={`w-full bg-${config.backgroundColor}`}>
      <div className="flex">
        {config.imagePosition === 'left' ? (
          <>
            <div className="w-1/2">{imageContent}</div>
            <div className="w-1/2">{textContent}</div>
          </>
        ) : (
          <>
            <div className="w-1/2">{textContent}</div>
            <div className="w-1/2">{imageContent}</div>
          </>
        )}
      </div>
    </section>
  );
}
