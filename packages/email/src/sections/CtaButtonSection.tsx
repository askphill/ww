import {Button, BagIcon, AddBagIcon, CheckoutIcon} from '@wakey/ui';
import type {
  CtaButtonSection as CtaButtonSectionType,
  ButtonIcon,
} from '../types';

interface Props {
  config: CtaButtonSectionType['config'];
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

export function CtaButtonSection({config}: Props) {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[config.alignment];

  return (
    <section className={`w-full bg-${config.backgroundColor}`}>
      <div className={`p-8 ${alignmentClass}`}>
        <Button
          href={config.url}
          variant={config.variant}
          icon={getIconComponent(config.icon)}
        >
          {config.text}
        </Button>
      </div>
    </section>
  );
}
