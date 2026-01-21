import type {WakeyColor} from './types';

// Colors must match exactly: packages/tailwind-config/theme.css
export const wakeyEmailColors: Record<WakeyColor, string> = {
  sand: '#FFF5EB',
  softorange: '#FAD103',
  ocher: '#E3B012',
  skyblue: '#99BDFF',
  blue: '#d4e8ff',
  yellow: '#ffff00',
  black: '#1A1A1A',
  white: '#FFFFFF',
  text: '#383838',
} as const;

// Font names must match exactly: packages/tailwind-config/theme.css
// 'Founders' and 'ITC' are the @font-face names used in the website
export const wakeyEmailFonts = {
  display: "'Founders', system-ui, sans-serif",
  body: "'ITC', Georgia, serif",
} as const;

export const emailBaseStyles = {
  maxWidth: '600px',
  padding: '0',
  margin: '0 auto',
} as const;

export function getColorValue(color: WakeyColor): string {
  return wakeyEmailColors[color];
}
