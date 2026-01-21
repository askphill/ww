export type SectionType =
  | 'header'
  | 'hero'
  | 'image'
  | 'product_grid'
  | 'text_block'
  | 'image_text_split'
  | 'cta_button'
  | 'footer';

export type WakeyColor =
  | 'sand'
  | 'softorange'
  | 'ocher'
  | 'skyblue'
  | 'blue'
  | 'yellow'
  | 'black'
  | 'white'
  | 'text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

export type ButtonIcon =
  | 'none'
  | 'bag'
  | 'add-bag'
  | 'checkout'
  | 'arrow-right';

export type TypographyStyle =
  | 'text-display'
  | 'text-h1'
  | 'text-h2'
  | 'text-h3'
  | 'text-s1'
  | 'text-s2'
  | 'text-paragraph'
  | 'text-body-small'
  | 'text-small'
  | 'text-label';

export type PaddingScale = 0 | 1 | 2 | 4;

export interface BaseSection {
  id: string;
  type: SectionType;
}

export interface HeaderSection extends BaseSection {
  type: 'header';
  config: {
    logoUrl: string;
    backgroundColor: WakeyColor;
    logoColor: WakeyColor;
  };
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  config: {
    imageUrl: string;
    headline: string;
    headlineStyle: TypographyStyle;
    subheadline?: string;
    subheadlineStyle: TypographyStyle;
    ctaText?: string;
    ctaUrl?: string;
    ctaVariant: ButtonVariant;
    ctaIcon: ButtonIcon;
    backgroundColor: WakeyColor;
    textColor: WakeyColor;
  };
}

export interface ImageSection extends BaseSection {
  type: 'image';
  config: {
    imageUrl: string;
    altText: string;
    linkUrl?: string;
    fullWidth: boolean;
    backgroundColor: WakeyColor;
  };
}

export interface ProductGridSection extends BaseSection {
  type: 'product_grid';
  config: {
    columns: 1 | 2 | 3;
    products: Array<{
      imageUrl: string;
      title: string;
      price: string;
      url: string;
      rating?: number;
    }>;
    showRatings: boolean;
    titleStyle: TypographyStyle;
    priceStyle: TypographyStyle;
    backgroundColor: WakeyColor;
  };
}

export interface TextBlockSection extends BaseSection {
  type: 'text_block';
  config: {
    content: string;
    textStyle: TypographyStyle;
    alignment: 'left' | 'center' | 'right';
    paddingTop: PaddingScale;
    paddingBottom: PaddingScale;
    backgroundColor: WakeyColor;
    textColor: WakeyColor;
  };
}

export interface ImageTextSplitSection extends BaseSection {
  type: 'image_text_split';
  config: {
    imageUrl: string;
    imagePosition: 'left' | 'right';
    headline: string;
    headlineStyle: TypographyStyle;
    bodyText: string;
    bodyStyle: TypographyStyle;
    ctaText?: string;
    ctaUrl?: string;
    ctaVariant: ButtonVariant;
    ctaIcon: ButtonIcon;
    backgroundColor: WakeyColor;
  };
}

export interface CtaButtonSection extends BaseSection {
  type: 'cta_button';
  config: {
    text: string;
    url: string;
    variant: ButtonVariant;
    icon: ButtonIcon;
    alignment: 'left' | 'center' | 'right';
    backgroundColor: WakeyColor;
  };
}

export interface FooterSection extends BaseSection {
  type: 'footer';
  config: {
    showSocialLinks: boolean;
    instagramUrl: string;
    tiktokUrl: string;
    showPaymentIcons: boolean;
    legalText: string;
    unsubscribeText: string;
    backgroundColor: WakeyColor;
    logoColor: WakeyColor;
    textColor: WakeyColor;
  };
}

export type EmailSection =
  | HeaderSection
  | HeroSection
  | ImageSection
  | ProductGridSection
  | TextBlockSection
  | ImageTextSplitSection
  | CtaButtonSection
  | FooterSection;

export interface EmailTemplate {
  id?: number;
  name: string;
  description?: string;
  sections: EmailSection[];
}
