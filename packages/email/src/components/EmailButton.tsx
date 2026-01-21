import {Button} from '@react-email/components';
import {BagIcon, AddBagIcon, CheckoutIcon} from '@wakey/ui';
import type {ButtonVariant, ButtonIcon} from '../types';
import {wakeyEmailColors, wakeyEmailFonts} from '../styles';

interface EmailButtonProps {
  children: React.ReactNode;
  href: string;
  variant?: ButtonVariant;
  icon?: ButtonIcon;
}

// Matches packages/ui/src/Button.tsx variant styles exactly
const variantStyles: Record<
  ButtonVariant,
  {bg: string; text: string; border?: string}
> = {
  primary: {bg: wakeyEmailColors.black, text: wakeyEmailColors.sand},
  secondary: {bg: wakeyEmailColors.sand, text: wakeyEmailColors.black},
  outline: {
    bg: 'transparent',
    text: wakeyEmailColors.text,
    border: wakeyEmailColors.black,
  },
};

// Arrow icon - not in @wakey/ui, so defined here with matching style
function ArrowRightIcon({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Map icon types to components from @wakey/ui
const iconComponents: Record<
  Exclude<ButtonIcon, 'none'>,
  React.ComponentType<{className?: string}>
> = {
  bag: BagIcon,
  'add-bag': AddBagIcon,
  checkout: CheckoutIcon,
  'arrow-right': ArrowRightIcon,
};

export function EmailButton({
  children,
  href,
  variant = 'primary',
  icon = 'none',
}: EmailButtonProps) {
  const styles = variantStyles[variant];
  const IconComponent = icon !== 'none' ? iconComponents[icon] : null;

  // Button styling matches packages/ui/src/Button.tsx exactly:
  // inline-flex items-center justify-center gap-2 px-6 h-14 font-display text-label rounded-full
  return (
    <Button
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px', // gap-2 = 0.5rem = 8px
        padding: '0 24px', // px-6 = 1.5rem = 24px
        height: '56px', // h-14 = 3.5rem = 56px
        lineHeight: '56px',
        fontFamily: wakeyEmailFonts.display, // font-display
        fontSize: '15px', // text-label = 0.94rem ≈ 15px
        fontWeight: 400, // normal weight (no font-weight class in Button.tsx)
        borderRadius: '9999px', // rounded-full
        textDecoration: 'none',
        backgroundColor: styles.bg,
        color: styles.text,
        border: styles.border ? `1px solid ${styles.border}` : 'none',
      }}
    >
      {IconComponent && (
        <span style={{width: '20px', height: '20px', color: styles.text}}>
          <IconComponent />
        </span>
      )}
      {children}
    </Button>
  );
}
