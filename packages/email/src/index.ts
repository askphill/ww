// Types
export type {
  SectionType,
  WakeyColor,
  ButtonVariant,
  ButtonIcon,
  TypographyStyle,
  PaddingScale,
  BaseSection,
  HeaderSection,
  HeroSection,
  ImageSection,
  ProductGridSection,
  TextBlockSection,
  ImageTextSplitSection,
  CtaButtonSection,
  FooterSection,
  EmailSection,
  EmailTemplate,
} from './types';

// Email Components (React Email compatible)
export {EmailButton, EmailStars, EmailText} from './components';

// Styles
export {
  wakeyEmailColors,
  wakeyEmailFonts,
  emailBaseStyles,
  getColorValue,
} from './styles';

// Utils
export {parseMarkdown, containsMarkdown} from './utils/parseMarkdown';

// Defaults
export {
  defaultHeaderConfig,
  defaultHeroConfig,
  defaultImageConfig,
  defaultProductGridConfig,
  defaultTextBlockConfig,
  defaultImageTextSplitConfig,
  defaultCtaButtonConfig,
  defaultFooterConfig,
  sectionDefaults,
  getDefaultConfig,
} from './defaults';

// Section Components - exported with View suffix to avoid type conflicts
export {HeaderSection as HeaderSectionView} from './sections/HeaderSection';
export {HeroSection as HeroSectionView} from './sections/HeroSection';
export {ImageSection as ImageSectionView} from './sections/ImageSection';
export {ProductGridSection as ProductGridSectionView} from './sections/ProductGridSection';
export {TextBlockSection as TextBlockSectionView} from './sections/TextBlockSection';
export {ImageTextSplitSection as ImageTextSplitSectionView} from './sections/ImageTextSplitSection';
export {CtaButtonSection as CtaButtonSectionView} from './sections/CtaButtonSection';
export {FooterSection as FooterSectionView} from './sections/FooterSection';

// Export
export {renderToEmail} from './export';
