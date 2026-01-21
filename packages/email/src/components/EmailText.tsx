import {Text, Heading} from '@react-email/components';
import type {TypographyStyle, WakeyColor} from '../types';
import {wakeyEmailColors, wakeyEmailFonts} from '../styles';

interface EmailTextProps {
  children: React.ReactNode;
  style: TypographyStyle;
  color?: WakeyColor;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

// Typography styles matching packages/tailwind-config/theme.css EXACTLY
// Line-heights must match the design system precisely
// Font sizes are scaled for email (600px width) - between mobile and desktop values
const typographyStyles: Record<
  TypographyStyle,
  {
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    isHeading?: boolean;
  }
> = {
  // line-height: 0.9 (--leading-tight)
  'text-display': {
    fontSize: '48px',
    lineHeight: '0.9',
    fontFamily: wakeyEmailFonts.display,
    isHeading: true,
  },
  'text-h1': {
    fontSize: '40px',
    lineHeight: '0.9',
    fontFamily: wakeyEmailFonts.display,
    isHeading: true,
  },
  // line-height: 1 (--leading-snug)
  'text-h2': {
    fontSize: '36px',
    lineHeight: '1',
    fontFamily: wakeyEmailFonts.display,
    isHeading: true,
  },
  // line-height: 1.1 (--leading-normal)
  'text-h3': {
    fontSize: '28px',
    lineHeight: '1.1',
    fontFamily: wakeyEmailFonts.display,
    isHeading: true,
  },
  // line-height: 1 (--leading-snug)
  'text-s1': {
    fontSize: '26px',
    lineHeight: '1',
    fontFamily: wakeyEmailFonts.display,
  },
  'text-s2': {
    fontSize: '20px',
    lineHeight: '1',
    fontFamily: wakeyEmailFonts.display,
  },
  // line-height: 1.2 (--leading-relaxed) - NOTE: theme.css says 1.2, not 1.4
  'text-paragraph': {
    fontSize: '18px',
    lineHeight: '1.2',
    fontFamily: wakeyEmailFonts.body,
  },
  // line-height: 1 (--leading-snug)
  'text-body-small': {
    fontSize: '15px',
    lineHeight: '1',
    fontFamily: wakeyEmailFonts.body,
  },
  'text-small': {
    fontSize: '13px',
    lineHeight: '1',
    fontFamily: wakeyEmailFonts.body,
  },
  'text-label': {
    fontSize: '15px',
    lineHeight: '1',
    fontFamily: wakeyEmailFonts.display,
  },
};

export function EmailText({
  children,
  style,
  color = 'black',
  align = 'left',
}: EmailTextProps) {
  const typo = typographyStyles[style];
  const textColor = wakeyEmailColors[color];

  const baseStyle = {
    fontSize: typo.fontSize,
    lineHeight: typo.lineHeight,
    fontFamily: typo.fontFamily,
    color: textColor,
    textAlign: align as 'left' | 'center' | 'right',
    margin: '0',
  };

  if (typo.isHeading) {
    return (
      <Heading as="h2" style={baseStyle}>
        {children}
      </Heading>
    );
  }

  return <Text style={baseStyle}>{children}</Text>;
}
