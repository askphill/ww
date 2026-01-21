import type {
  HeaderSection,
  HeroSection,
  ImageSection,
  ProductGridSection,
  TextBlockSection,
  ImageTextSplitSection,
  CtaButtonSection,
  FooterSection,
  SectionType,
} from './types';

export const defaultHeaderConfig: HeaderSection['config'] = {
  logoUrl:
    'https://cdn.shopify.com/s/files/1/0689/1443/0062/files/wakey-logo.png',
  backgroundColor: 'sand',
  logoColor: 'black',
};

export const defaultHeroConfig: HeroSection['config'] = {
  imageUrl: '',
  headline: 'Your Headline Here',
  headlineStyle: 'text-h2',
  subheadline: 'Add a subheadline to support your message',
  subheadlineStyle: 'text-paragraph',
  ctaText: 'Shop Now',
  ctaUrl: 'https://www.wakey.care',
  ctaVariant: 'primary',
  ctaIcon: 'none',
  backgroundColor: 'sand',
  textColor: 'black',
};

export const defaultImageConfig: ImageSection['config'] = {
  imageUrl: '',
  altText: 'Image description',
  linkUrl: '',
  fullWidth: true,
  backgroundColor: 'white',
};

export const defaultProductGridConfig: ProductGridSection['config'] = {
  columns: 2,
  products: [
    {
      imageUrl: '',
      title: 'Product Name',
      price: '€29.99',
      url: 'https://www.wakey.care',
      rating: 4.5,
    },
  ],
  showRatings: true,
  titleStyle: 'text-label',
  priceStyle: 'text-small',
  backgroundColor: 'white',
};

export const defaultTextBlockConfig: TextBlockSection['config'] = {
  content:
    'Add your text content here. You can write about your brand, products, or share a story with your audience.',
  textStyle: 'text-paragraph',
  alignment: 'left',
  paddingTop: 2,
  paddingBottom: 2,
  backgroundColor: 'white',
  textColor: 'black',
};

export const defaultImageTextSplitConfig: ImageTextSplitSection['config'] = {
  imageUrl: '',
  imagePosition: 'left',
  headline: 'Section Headline',
  headlineStyle: 'text-h3',
  bodyText:
    'Add descriptive text that complements your image and engages your readers.',
  bodyStyle: 'text-paragraph',
  ctaText: 'Learn More',
  ctaUrl: 'https://www.wakey.care',
  ctaVariant: 'primary',
  ctaIcon: 'none',
  backgroundColor: 'white',
};

export const defaultCtaButtonConfig: CtaButtonSection['config'] = {
  text: 'Shop Now',
  url: 'https://www.wakey.care',
  variant: 'primary',
  icon: 'none',
  alignment: 'center',
  backgroundColor: 'white',
};

export const defaultFooterConfig: FooterSection['config'] = {
  showSocialLinks: true,
  instagramUrl: 'https://instagram.com/wakeywakey',
  tiktokUrl: 'https://tiktok.com/@wakeywakey',
  showPaymentIcons: true,
  legalText: `${new Date().getFullYear()} Wakey. All rights reserved.`,
  unsubscribeText: 'Unsubscribe',
  backgroundColor: 'softorange',
  logoColor: 'black',
  textColor: 'black',
};

export const sectionDefaults: Record<SectionType, unknown> = {
  header: defaultHeaderConfig,
  hero: defaultHeroConfig,
  image: defaultImageConfig,
  product_grid: defaultProductGridConfig,
  text_block: defaultTextBlockConfig,
  image_text_split: defaultImageTextSplitConfig,
  cta_button: defaultCtaButtonConfig,
  footer: defaultFooterConfig,
};

export function getDefaultConfig<T extends SectionType>(type: T): unknown {
  return sectionDefaults[type];
}
