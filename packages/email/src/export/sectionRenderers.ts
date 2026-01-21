import type {
  HeaderSection,
  HeroSection,
  ImageSection,
  ProductGridSection,
  TextBlockSection,
  ImageTextSplitSection,
  CtaButtonSection,
  FooterSection,
  ButtonVariant,
  ButtonIcon,
  TypographyStyle,
  PaddingScale,
} from '../types';
import {getColorValue, wakeyEmailFonts} from '../styles';
import {parseMarkdown} from '../utils/parseMarkdown';

// Padding scale to pixel values
const paddingScaleMap: Record<PaddingScale, number> = {
  0: 0,
  1: 16,
  2: 32,
  4: 64,
};

// Button variant styles - matches packages/ui/src/Button.tsx exactly
const buttonVariantStyles: Record<
  ButtonVariant,
  {bg: string; text: string; border?: string}
> = {
  primary: {bg: getColorValue('black'), text: getColorValue('sand')},
  secondary: {bg: getColorValue('sand'), text: getColorValue('black')},
  outline: {
    bg: 'transparent',
    text: getColorValue('text'),
    border: getColorValue('black'),
  },
};

// Typography style mappings - matches packages/tailwind-config/theme.css EXACTLY
// Line-heights must match the design system precisely
// Font sizes are scaled for email (600px width) - between mobile and desktop values
const typographyStyleMap: Record<
  TypographyStyle,
  {fontSize: string; lineHeight: string; fontFamily: string}
> = {
  // line-height: 0.9 (--leading-tight)
  'text-display': {
    fontSize: '48px',
    lineHeight: '0.9',
    fontFamily: wakeyEmailFonts.display,
  },
  'text-h1': {
    fontSize: '40px',
    lineHeight: '0.9',
    fontFamily: wakeyEmailFonts.display,
  },
  // line-height: 1 (--leading-snug)
  'text-h2': {
    fontSize: '36px',
    lineHeight: '1',
    fontFamily: wakeyEmailFonts.display,
  },
  // line-height: 1.1 (--leading-normal)
  'text-h3': {
    fontSize: '28px',
    lineHeight: '1.1',
    fontFamily: wakeyEmailFonts.display,
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
  // line-height: 1.2 (--leading-relaxed)
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

// Button HTML matches packages/ui/src/Button.tsx exactly:
// inline-flex items-center justify-center gap-2 px-6 h-14 font-display text-label rounded-full
function renderButtonHtml(
  text: string,
  url: string,
  variant: ButtonVariant,
  icon: ButtonIcon,
): string {
  const styles = buttonVariantStyles[variant];
  const borderStyle = styles.border
    ? `border: 1px solid ${styles.border};`
    : '';

  // height: 56px (h-14), padding: 0 24px (px-6), font-weight: 400 (normal)
  return `<a href="${url}" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 56px; line-height: 56px; padding: 0 24px; background-color: ${styles.bg}; color: ${styles.text}; text-decoration: none; font-family: ${wakeyEmailFonts.display}; font-size: 15px; font-weight: 400; border-radius: 9999px; ${borderStyle}">${text}</a>`;
}

function renderTextHtml(
  text: string,
  style: TypographyStyle,
  color: string,
  align: string = 'left',
): string {
  const typo = typographyStyleMap[style];
  return `<p style="margin: 0; font-size: ${typo.fontSize}; line-height: ${typo.lineHeight}; font-family: ${typo.fontFamily}; color: ${color}; text-align: ${align};">${text}</p>`;
}

// Wakey small logo SVG for email header - matches packages/ui/src/icons/LogoSmall.tsx
const wakeyLogoSmallSvg = (
  color: string,
) => `<svg height="32" viewBox="0 0 104 31" xmlns="http://www.w3.org/2000/svg">
  <path d="M22.4828 7.20972L19.1879 17.674H19.0318L16.2813 7.20972H11.7844L9.031 17.674H8.87777L5.58192 7.20972H0L5.46771 24.4199H10.9307L13.684 14.0327H13.8373L16.6287 24.4199H22.0964L27.5594 7.20972H22.4828Z" fill="${color}"/>
  <path d="M43.8885 19.7296C43.8885 20.6205 44.2749 21.0088 44.9735 21.0088C45.4769 21.0088 45.9052 20.9307 46.4087 20.6976V23.6822C45.555 24.3027 44.47 24.8062 42.7655 24.8062C40.7107 24.8062 39.2003 23.7212 38.6939 21.7825C37.726 23.7602 35.5951 24.8062 32.9198 24.8062C29.4707 24.8062 27.2988 23.0626 27.2988 20.117C27.2988 16.824 29.78 15.4278 33.5784 14.6912L38.3846 13.8394V13.5281C38.3846 11.9007 37.5699 10.9309 35.8654 10.9309C34.2379 10.9309 33.4232 11.9378 33.1139 13.373L27.9194 12.9866C28.5009 9.30435 31.2514 6.74609 36.1766 6.74609C40.6716 6.74609 43.8895 8.76187 43.8895 13.452V19.7296H43.8885ZM38.3846 16.784L35.5561 17.3655C33.8125 17.7139 32.7256 18.1412 32.7256 19.4965C32.7256 20.5053 33.5013 21.1258 34.7033 21.1258C36.7581 21.1258 38.3856 19.5745 38.3856 17.1324V16.784H38.3846Z" fill="${color}"/>
  <path d="M48.396 0V24.4186H53.9779V18.7977L55.6806 17.1341L61.0702 24.4186H67.3888L59.8682 14.0305L67.1185 7.21034H60.4887L53.9779 13.5679V0H48.396Z" fill="${color}"/>
  <path d="M84.1428 18.759C83.2501 22.6745 80.1884 24.8835 75.6933 24.8835C70.2285 24.8835 66.353 21.5514 66.353 16.0856C66.353 10.6598 70.3056 6.74341 75.5763 6.74341C81.2743 6.74341 84.2589 10.6588 84.2589 15.348V17.0535H71.8579C72.0111 19.3415 73.7166 20.6578 75.8884 20.6578C77.8252 20.6578 79.0282 19.9211 79.6468 18.3327L84.1428 18.759ZM78.8721 14.0699C78.7551 12.3643 77.671 10.813 75.5382 10.813C73.2912 10.813 72.2452 12.2482 71.934 14.0699H78.8721Z" fill="${color}"/>
  <path d="M98.495 7.20972L94.2702 17.9462H94.117L89.9684 7.20972H84.0771L91.1304 24.5741L88.6112 30.6976H94.117L104 7.20972H98.495Z" fill="${color}"/>
</svg>`;

export function renderHeaderHtml(config: HeaderSection['config']): string {
  const bgColor = getColorValue(config.backgroundColor);
  const logoColor = getColorValue(config.logoColor);

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${bgColor};">
  <tr>
    <td style="padding: 24px 32px; text-align: center;">
      ${wakeyLogoSmallSvg(logoColor)}
    </td>
  </tr>
</table>`;
}

export function renderHeroHtml(config: HeroSection['config']): string {
  const imageHtml = config.imageUrl
    ? `<tr><td><img src="${config.imageUrl}" alt="" style="width: 100%; display: block;" /></td></tr>`
    : '';

  const headlineStyle = typographyStyleMap[config.headlineStyle];
  const subheadlineStyle = typographyStyleMap[config.subheadlineStyle];

  const ctaHtml =
    config.ctaText && config.ctaUrl
      ? `<div style="margin-top: 24px;">${renderButtonHtml(config.ctaText, config.ctaUrl, config.ctaVariant, config.ctaIcon)}</div>`
      : '';

  const subheadlineHtml = config.subheadline
    ? `<p style="margin: 16px 0 0 0; font-size: ${subheadlineStyle.fontSize}; line-height: ${subheadlineStyle.lineHeight}; font-family: ${subheadlineStyle.fontFamily}; color: ${getColorValue(config.textColor)};">${config.subheadline}</p>`
    : '';

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${getColorValue(config.backgroundColor)};">
  ${imageHtml}
  <tr>
    <td style="padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; font-size: ${headlineStyle.fontSize}; line-height: ${headlineStyle.lineHeight}; font-family: ${headlineStyle.fontFamily}; color: ${getColorValue(config.textColor)};">${config.headline}</h1>
      ${subheadlineHtml}
      ${ctaHtml}
    </td>
  </tr>
</table>`;
}

export function renderImageHtml(config: ImageSection['config']): string {
  const imageStyle = config.fullWidth
    ? 'width: 100%; display: block;'
    : 'max-width: 400px; display: block; margin: 0 auto;';

  const imageHtml = config.imageUrl
    ? `<img src="${config.imageUrl}" alt="${config.altText}" style="${imageStyle}" />`
    : `<div style="background-color: ${getColorValue('sand')}; height: 200px; ${config.fullWidth ? '' : 'max-width: 400px; margin: 0 auto;'}"></div>`;

  const wrappedContent = config.linkUrl
    ? `<a href="${config.linkUrl}" style="display: block;">${imageHtml}</a>`
    : imageHtml;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${getColorValue(config.backgroundColor)};">
  <tr>
    <td style="padding: 0;">
      ${wrappedContent}
    </td>
  </tr>
</table>`;
}

export function renderProductGridHtml(
  config: ProductGridSection['config'],
): string {
  const columnWidth = Math.floor(100 / config.columns);
  const titleStyle = typographyStyleMap[config.titleStyle];
  const priceStyle = typographyStyleMap[config.priceStyle];

  const productCells = config.products
    .map(
      (product) => `
      <td width="${columnWidth}%" style="padding: 8px; vertical-align: top; text-align: center;">
        <a href="${product.url}" style="text-decoration: none; color: inherit;">
          ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" style="width: 100%; max-width: 200px; display: block; margin: 0 auto 12px;" />` : ''}
          <p style="margin: 0 0 8px 0; font-size: ${titleStyle.fontSize}; font-family: ${titleStyle.fontFamily}; color: ${getColorValue('black')};">${product.title}</p>
          <p style="margin: 0; font-size: ${priceStyle.fontSize}; font-family: ${priceStyle.fontFamily}; color: ${getColorValue('black')};">${product.price}</p>
        </a>
      </td>`,
    )
    .join('');

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${getColorValue(config.backgroundColor)};">
  <tr>
    <td style="padding: 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${productCells}
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function renderTextBlockHtml(
  config: TextBlockSection['config'],
): string {
  const textStyle = typographyStyleMap[config.textStyle];
  const textColor = getColorValue(config.textColor);
  const paddingTop = paddingScaleMap[config.paddingTop ?? 2];
  const paddingBottom = paddingScaleMap[config.paddingBottom ?? 2];

  // Parse markdown and convert newlines to <br> for email
  const htmlContent = parseMarkdown(config.content, textColor).replace(
    /\n/g,
    '<br />',
  );

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${getColorValue(config.backgroundColor)};">
  <tr>
    <td style="padding: ${paddingTop}px 32px ${paddingBottom}px 32px; text-align: ${config.alignment};">
      <p style="margin: 0; font-size: ${textStyle.fontSize}; line-height: ${textStyle.lineHeight}; font-family: ${textStyle.fontFamily}; color: ${textColor};">${htmlContent}</p>
    </td>
  </tr>
</table>`;
}

export function renderImageTextSplitHtml(
  config: ImageTextSplitSection['config'],
): string {
  const imageHtml = config.imageUrl
    ? `<img src="${config.imageUrl}" alt="" style="width: 100%; display: block;" />`
    : `<div style="background-color: ${getColorValue('sand')}; height: 200px;"></div>`;

  const imageCell = `<td width="50%" style="vertical-align: middle;">${imageHtml}</td>`;

  const headlineStyle = typographyStyleMap[config.headlineStyle];
  const bodyStyle = typographyStyleMap[config.bodyStyle];
  const textColor = getColorValue('black');

  // Parse markdown and convert newlines to <br> for email
  const bodyHtml = parseMarkdown(config.bodyText, textColor).replace(
    /\n/g,
    '<br />',
  );

  const ctaHtml =
    config.ctaText && config.ctaUrl
      ? `<div style="margin-top: 20px;">${renderButtonHtml(config.ctaText, config.ctaUrl, config.ctaVariant, config.ctaIcon)}</div>`
      : '';

  const textCell = `
    <td width="50%" style="padding: 32px; vertical-align: middle;">
      <h2 style="margin: 0; font-size: ${headlineStyle.fontSize}; line-height: ${headlineStyle.lineHeight}; font-family: ${headlineStyle.fontFamily}; color: ${textColor};">${config.headline}</h2>
      <p style="margin: 16px 0 0 0; font-size: ${bodyStyle.fontSize}; line-height: ${bodyStyle.lineHeight}; font-family: ${bodyStyle.fontFamily}; color: ${textColor};">${bodyHtml}</p>
      ${ctaHtml}
    </td>`;

  const cells =
    config.imagePosition === 'left'
      ? imageCell + textCell
      : textCell + imageCell;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${getColorValue(config.backgroundColor)};">
  <tr>
    ${cells}
  </tr>
</table>`;
}

export function renderCtaButtonHtml(
  config: CtaButtonSection['config'],
): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${getColorValue(config.backgroundColor)};">
  <tr>
    <td style="padding: 32px; text-align: ${config.alignment};">
      ${renderButtonHtml(config.text, config.url, config.variant, config.icon)}
    </td>
  </tr>
</table>`;
}

// Wakey logo SVG for email footer
const wakeyLogoSvg = (color: string) =>
  `<svg width="100%" viewBox="0 0 3048 1299" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_115_1935)"><path d="M1.00539 1071.5L162.735 1122.36L342.019 835.208L346.625 836.656L331.333 1175.36L493.043 1226.21L816.901 758.927L666.654 711.702L470.564 996.113L465.979 994.676L483.147 653.991L350.099 612.149L170.067 901.647L165.477 900.194L166.58 554.458L1.42447 502.526L1.00539 1071.5Z" fill="${color}"/><path d="M1117.39 1043.89L1028.89 1060.81C974.352 1070.95 940.225 1083.83 939.027 1126.56C938.133 1158.29 961.678 1178.19 999.049 1178.79C1062.93 1179.8 1114.92 1131.77 1117.08 1054.87L1117.39 1043.89ZM1285.91 1139.33C1285.11 1167.4 1296.82 1179.8 1318.52 1180.14C1334.19 1180.38 1347.51 1178.16 1363.39 1171.07L1360.73 1265.06C1333.66 1284.17 1299.48 1299.5 1246.45 1298.66C1182.57 1297.67 1136.54 1262.74 1122.59 1201.47C1090.7 1263.25 1023.49 1295.16 940.345 1293.85C833.08 1292.17 767.145 1236.17 769.756 1143.42C772.687 1039.67 851.052 996.946 969.823 975.628L1120.01 951.124L1120.29 941.358C1121.75 890.098 1097.29 859.188 1044.25 858.347C993.638 857.543 967.44 888.884 956.527 933.885L795.375 919.138C816.724 803.476 904.563 724.27 1057.62 726.675C1197.42 728.874 1295.66 793.909 1291.5 941.58L1285.91 1139.33Z" fill="${color}"/><path d="M1655.17 1237.74L1486.15 1278.94L1314.8 530.171L1483.82 488.986L1579.01 904.953L1731.59 661.976L1932.31 613.042L1760.69 875.726L2061.28 1138.74L1869.96 1185.37L1655.68 1001.72L1615.73 1065.4L1655.17 1237.74Z" fill="${color}"/><path d="M2319.67 646.604C2293.11 600.342 2241.6 572.208 2182.07 602.504C2119.27 634.456 2109.66 689.608 2125.9 745.197L2319.67 646.604ZM2531.02 703.442C2559.64 826.089 2504.33 931.666 2378.77 995.561C2226.14 1073.21 2072.31 1034.65 1997.59 881.12C1923.41 728.687 1980.3 562.521 2127.53 487.628C2286.64 406.66 2423.51 474.233 2487.64 605.98L2510.95 653.893L2164.56 830.135C2200.14 892.184 2265.8 904.962 2326.41 874.125C2380.55 846.585 2404.02 808.831 2399.61 755.37L2531.02 703.442Z" fill="${color}"/><path d="M2914.9 880.682L2854.96 681.323L2343.2 402.645L2485.01 283.718L2796.28 460.36L2800 457.231L2690.29 111.618L2822.77 0.509379L3047.39 769.573L2914.9 880.682Z" fill="${color}"/></g></svg>`;

// Payment icon SVGs for email (inline SVG doesn't work in all clients, but works in Gmail, Apple Mail)
const paymentIconSvgs = {
  visa: `<svg width="41" height="28" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M940,0H60C26.9,0,0,26.9,0,60v560c0,33.1,26.9,60,60,60h880c33.1,0,60-26.9,60-60V60C1000,26.9,973.1,0,940,0z"/><path fill="#1A1F71" d="M496.3,224.3l-50.7,232.1h-61.5l50.7-232.1H496.3L496.3,224.3z M754.7,374.1L787,287l18.6,87.2H754.7L754.7,374.1z M823.2,456.4H880l-49.6-232.1H778c-11.8,0-21.8,6.7-26.2,17l-92.2,215.1h64.5l12.8-34.7h78.8L823.2,456.4L823.2,456.4z M662.9,380.6c0.2-61.3-86.6-64.7-86-92.1c0.2-8.3,8.3-17.1,26-19.4c8.8-1.1,33-2,60.5,10.4l10.8-49.2c-14.8-5.2-33.8-10.3-57.5-10.3c-60.7,0-103.4,31.5-103.7,76.7c-0.4,33.4,30.5,52,53.7,63.2c24,11.4,32,18.7,31.9,28.8c-0.1,15.6-19.1,22.5-36.7,22.7c-30.9,0.5-48.8-8.2-63.1-14.7l-11.1,50.9c14.4,6.4,40.9,12,68.3,12.3C620.5,460,662.7,428.8,662.9,380.6L662.9,380.6z M408.6,224.2L309,456.4h-64.9l-48.9-185.2c-3-11.4-5.5-15.6-14.6-20.4c-14.8-7.8-39.2-15.2-60.6-19.7l1.4-6.7h104.5c13.3,0,25.3,8.7,28.3,23.7l25.9,134.4l63.9-158L408.6,224.2L408.6,224.2z"/></svg>`,
  mastercard: `<svg width="41" height="28" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M940,0H60C26.9,0,0,26.9,0,60v560c0,33.1,26.9,60,60,60h880c33.1,0,60-26.9,60-60V60C1000,26.9,973.1,0,940,0z"/><path fill="#FF5F00" d="M551.8,188.3H433.1V406h118.7"/><path fill="#EB001B" d="M440.6,297.2c0-44.3,20.4-83.5,51.6-108.9c-23-18.4-52-29.6-83.6-29.6c-75,0-135.6,61.9-135.6,138.5c0,76.5,60.6,138.4,135.6,138.4c31.6,0,60.6-11.1,83.6-29.6C460.9,381,440.6,341.4,440.6,297.2L440.6,297.2z"/><path fill="#F79E1B" d="M711.8,297.2c0,76.5-60.7,138.4-135.6,138.4c-31.6,0-60.6-11.1-83.6-29.6c31.6-25.4,51.6-64.6,51.6-108.8c0-44.3-20.3-83.5-51.6-108.9c23-18.4,52-29.6,83.6-29.6C651.1,158.7,711.8,221,711.8,297.2L711.8,297.2z"/></svg>`,
  amex: `<svg width="41" height="28" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M940,0H60C26.9,0,0,26.9,0,60v560c0,33.1,26.9,60,60,60h880c33.1,0,60-26.9,60-60V60C1000,26.9,973.1,0,940,0z"/><path fill="#2E77BC" d="M425.8,284.7H370v-20.4h54.7v-20.4H370v-18.2h55.8v-20.4h-79.7v99.9h79.7V284.7z"/><path fill="#2E77BC" d="M163.8,305.1h49v-78.4l35.3,78.4h21.6l35.3-78.4v78.4h25.1v-99.9h-39.9l-28.5,68.1l-31.9-68.1h-38.7v94.3l-41-94.3h-35.3l-43.3,99.9h26.2l9.1-22.7H157L163.8,305.1z M112.6,261.9l15.9-39.8l15.9,39.8H112.6z"/><path fill="#2E77BC" d="M466.8,268.8H493c9.1,0,13.7,1.1,17.1,4.5c4.6,4.5,3.4,13.6,3.4,19.3v12.5h23.9v-19.3c0-9.1-1.1-13.6-3.4-18.2c-2.3-3.4-6.8-6.8-11.4-8c5.7-2.3,17.1-10.2,17.1-27.3c0-11.4-4.6-18.2-12.5-22.7c-8-4.5-17.1-4.5-29.6-4.5h-54.7v99.9h23.9L466.8,268.8z M466.8,225.6h29.6c4.6,0,9.1,0,11.4,2.3c3.4,1.1,4.6,4.5,4.6,9.1s-2.3,8-4.6,9.1c-3.4,2.3-6.8,2.3-11.4,2.3h-29.6V225.6z"/><path fill="#2E77BC" d="M552.2,205.2h25.1v99.9h-25.1V205.2z"/></svg>`,
  paypal: `<svg width="41" height="28" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M940,0H60C26.9,0,0,26.9,0,60v560c0,33.1,26.9,60,60,60h880c33.1,0,60-26.9,60-60V60C1000,26.9,973.1,0,940,0z"/><path fill="#253B80" d="M170.9,227.4h-67.6c-4.6,0-8.6,3.4-9.3,7.9L66.6,409.2c-0.5,3.4,2.1,6.5,5.6,6.5h32.3c4.6,0,8.6-3.4,9.3-8l7.4-46.9c0.7-4.6,4.7-8,9.3-8h21.4c44.5,0,70.2-21.6,77-64.4c3-18.7,0.1-33.4-8.6-43.7C210.5,233.4,193.5,227.4,170.9,227.4L170.9,227.4z M178.6,290.9c-3.7,24.3-22.2,24.3-40.2,24.3h-10.2l7.2-45.4c0.4-2.7,2.8-4.8,5.6-4.8h4.7c12.2,0,23.7,0,29.7,7C178.9,276.2,180,282.4,178.6,290.9L178.6,290.9z"/><path fill="#179BD7" d="M653.2,227.4h-67.6c-4.6,0-8.6,3.4-9.3,7.9l-27.4,173.8c-0.5,3.4,2.1,6.5,5.6,6.5h34.7c3.2,0,6-2.4,6.5-5.6l7.8-49.3c0.7-4.6,4.7-8,9.3-8h21.4c44.6,0,70.2-21.6,77-64.4c3-18.7,0.1-33.4-8.6-43.7C692.8,233.4,675.8,227.4,653.2,227.4L653.2,227.4z M661,290.9c-3.7,24.3-22.2,24.3-40.2,24.3h-10.2l7.2-45.4c0.4-2.7,2.8-4.8,5.6-4.8h4.7c12.2,0,23.7,0,29.7,7C661.3,276.2,662.3,282.4,661,290.9L661,290.9z"/></svg>`,
  ideal: `<svg width="41" height="28" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M940,0H60C26.9,0,0,26.9,0,60v560c0,33.1,26.9,60,60,60h880c33.1,0,60-26.9,60-60V60C1000,26.9,973.1,0,940,0z"/><path fill="#0B0B0A" d="M279.6,376.5h99.1v160.8h-99.1V376.5z"/><path fill="#0B0B0A" d="M386.2,296.2c0,30.3-25.1,54.8-56.1,54.8c-31,0-56.1-24.5-56.1-54.8s25.1-54.8,56.1-54.8C361.1,241.4,386.2,265.9,386.2,296.2z"/><path fill="#B9215E" d="M550,537.4H424.2V157.5H550h-5.1c104.9,0,216.5,40.4,216.5,190.4c0,158.6-111.6,189.4-216.5,189.4H550z"/></svg>`,
  klarna: `<svg width="41" height="28" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg"><path fill="#F4B6C7" d="M940,0H60C26.9,0,0,26.9,0,60v560c0,33.1,26.9,60,60,60h880c33.1,0,60-26.9,60-60V60C1000,26.9,973.1,0,940,0z"/><path fill="#0B0B0A" d="M244.5,260h-38.8c0,32.6-14.6,62.3-40.1,81.9l-15.3,11.7l59.6,82.9h48.9L204,360.2C229.9,333.9,244.5,298.3,244.5,260L244.5,260z"/><path fill="#0B0B0A" d="M120,260h39.7v176.6H120V260z"/><path fill="#0B0B0A" d="M284.6,260H322v176.6h-37.4V260z"/></svg>`,
};

export function renderFooterHtml(config: FooterSection['config']): string {
  const logoColor = getColorValue(config.logoColor);
  const textColor = getColorValue(config.textColor);
  const bgColor = getColorValue(config.backgroundColor);

  // Logo section (SVG)
  const logoHtml = `<tr><td style="padding: 0 0 24px 0;">${wakeyLogoSvg(logoColor)}</td></tr>`;

  // Social links section
  const socialLinksHtml = config.showSocialLinks
    ? `<tr><td style="padding: 0 0 24px 0; font-family: ${wakeyEmailFonts.display}; font-size: 15px;">
        <a href="${config.instagramUrl}" style="color: ${textColor}; text-decoration: underline; margin-right: 16px;">Instagram</a>
        <a href="${config.tiktokUrl}" style="color: ${textColor}; text-decoration: underline;">TikTok</a>
      </td></tr>`
    : '';

  // Payment icons section (using inline SVGs)
  const paymentIconsHtml = config.showPaymentIcons
    ? `<tr><td style="padding: 0 0 24px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right: 4px;">${paymentIconSvgs.visa}</td>
          <td style="padding-right: 4px;">${paymentIconSvgs.mastercard}</td>
          <td style="padding-right: 4px;">${paymentIconSvgs.amex}</td>
          <td style="padding-right: 4px;">${paymentIconSvgs.paypal}</td>
          <td style="padding-right: 4px;">${paymentIconSvgs.ideal}</td>
          <td>${paymentIconSvgs.klarna}</td>
        </tr></table>
      </td></tr>`
    : '';

  // Legal text
  const legalHtml = config.legalText
    ? `<tr><td style="padding: 0 0 8px 0; font-family: ${wakeyEmailFonts.display}; font-size: 13px; color: ${textColor};">${config.legalText}</td></tr>`
    : '';

  // Unsubscribe link
  const unsubscribeHtml = `<tr><td style="font-family: ${wakeyEmailFonts.display}; font-size: 13px;">
    <a href="{% unsubscribe_url %}" style="color: ${textColor}; opacity: 0.7; text-decoration: underline;">${config.unsubscribeText}</a>
  </td></tr>`;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${bgColor};">
  <tr>
    <td style="padding: 16px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${logoHtml}
        ${socialLinksHtml}
        ${paymentIconsHtml}
        ${legalHtml}
        ${unsubscribeHtml}
      </table>
    </td>
  </tr>
</table>`;
}
