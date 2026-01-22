import type {HeroSection} from '@wakey/email';
import {Input} from '../../ui/input';
import {Label} from '../../ui/label';
import {ColorPicker} from './ColorPicker';
import {TypographyPicker} from './TypographyPicker';
import {ButtonStylePicker} from './ButtonStylePicker';

interface HeroPropertiesProps {
  config: HeroSection['config'];
  onChange: (config: Partial<HeroSection['config']>) => void;
}

export function HeroProperties({config, onChange}: HeroPropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          type="url"
          value={config.imageUrl}
          onChange={(e) => onChange({imageUrl: e.target.value})}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>Headline</Label>
        <Input
          type="text"
          value={config.headline}
          onChange={(e) => onChange({headline: e.target.value})}
        />
        <p className="text-xs text-muted-foreground">
          Use *italic* or **bold** for formatting
        </p>
      </div>
      <TypographyPicker
        label="Headline Style"
        value={config.headlineStyle}
        onChange={(headlineStyle) => onChange({headlineStyle})}
      />
      <div className="space-y-2">
        <Label>Subheadline</Label>
        <Input
          type="text"
          value={config.subheadline || ''}
          onChange={(e) => onChange({subheadline: e.target.value})}
        />
        <p className="text-xs text-muted-foreground">
          Use *italic* or **bold** for formatting
        </p>
      </div>
      <TypographyPicker
        label="Subheadline Style"
        value={config.subheadlineStyle}
        onChange={(subheadlineStyle) => onChange({subheadlineStyle})}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            type="text"
            value={config.ctaText || ''}
            onChange={(e) => onChange({ctaText: e.target.value})}
            placeholder="Shop Now"
          />
        </div>
        <div className="space-y-2">
          <Label>CTA URL</Label>
          <Input
            type="url"
            value={config.ctaUrl || ''}
            onChange={(e) => onChange({ctaUrl: e.target.value})}
            placeholder="https://..."
          />
        </div>
      </div>
      <ButtonStylePicker
        variant={config.ctaVariant}
        icon={config.ctaIcon}
        onVariantChange={(ctaVariant) => onChange({ctaVariant})}
        onIconChange={(ctaIcon) => onChange({ctaIcon})}
      />
      <ColorPicker
        label="Background"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({backgroundColor})}
      />
      <ColorPicker
        label="Text Color"
        value={config.textColor}
        onChange={(textColor) => onChange({textColor})}
      />
    </div>
  );
}
