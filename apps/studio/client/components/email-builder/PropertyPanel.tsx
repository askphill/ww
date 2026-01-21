import type {EmailSection} from '@wakey/email';
import {
  HeaderProperties,
  HeroProperties,
  ImageProperties,
  ProductGridProperties,
  TextBlockProperties,
  ImageTextSplitProperties,
  CtaButtonProperties,
  FooterProperties,
} from './properties';

interface PropertyPanelProps {
  section: EmailSection | null;
  onUpdate: (config: Partial<EmailSection['config']>) => void;
}

const sectionLabels: Record<EmailSection['type'], string> = {
  header: 'Header',
  hero: 'Hero',
  image: 'Image',
  product_grid: 'Product Grid',
  text_block: 'Text Block',
  image_text_split: 'Image + Text',
  cta_button: 'CTA Button',
  footer: 'Footer',
};

export function PropertyPanel({section, onUpdate}: PropertyPanelProps) {
  if (!section) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-medium text-foreground">Properties</h2>
        </div>
        <div className="flex min-h-48 items-center justify-center p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Select a section to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-medium text-foreground">
          {sectionLabels[section.type]} Properties
        </h2>
      </div>
      <div className="max-h-[600px] overflow-y-auto p-6">
        {section.type === 'header' && (
          <HeaderProperties config={section.config} onChange={onUpdate} />
        )}
        {section.type === 'hero' && (
          <HeroProperties config={section.config} onChange={onUpdate} />
        )}
        {section.type === 'image' && (
          <ImageProperties config={section.config} onChange={onUpdate} />
        )}
        {section.type === 'product_grid' && (
          <ProductGridProperties config={section.config} onChange={onUpdate} />
        )}
        {section.type === 'text_block' && (
          <TextBlockProperties config={section.config} onChange={onUpdate} />
        )}
        {section.type === 'image_text_split' && (
          <ImageTextSplitProperties
            config={section.config}
            onChange={onUpdate}
          />
        )}
        {section.type === 'cta_button' && (
          <CtaButtonProperties config={section.config} onChange={onUpdate} />
        )}
        {section.type === 'footer' && (
          <FooterProperties config={section.config} onChange={onUpdate} />
        )}
      </div>
    </div>
  );
}
