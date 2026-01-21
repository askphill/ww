import type {ImageTextSplitSection} from '@wakey/email';
import {Input} from '../../ui/input';
import {Label} from '../../ui/label';
import {Textarea} from '../../ui/textarea';
import {ToggleGroup, ToggleGroupItem} from '../../ui/toggle-group';
import {ColorPicker} from './ColorPicker';
import {TypographyPicker} from './TypographyPicker';
import {ButtonStylePicker} from './ButtonStylePicker';

interface ImageTextSplitPropertiesProps {
  config: ImageTextSplitSection['config'];
  onChange: (config: Partial<ImageTextSplitSection['config']>) => void;
}

export function ImageTextSplitProperties({
  config,
  onChange,
}: ImageTextSplitPropertiesProps) {
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
        <Label>Image Position</Label>
        <ToggleGroup
          type="single"
          value={config.imagePosition}
          onValueChange={(value) => {
            if (value) onChange({imagePosition: value as 'left' | 'right'});
          }}
          variant="outline"
          className="justify-start"
        >
          <ToggleGroupItem value="left" className="flex-1">
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="right" className="flex-1">
            Right
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <Label>Headline</Label>
        <Input
          type="text"
          value={config.headline}
          onChange={(e) => onChange({headline: e.target.value})}
        />
      </div>
      <TypographyPicker
        label="Headline Style"
        value={config.headlineStyle}
        onChange={(headlineStyle) => onChange({headlineStyle})}
      />
      <div className="space-y-2">
        <Label>Body Text</Label>
        <Textarea
          value={config.bodyText}
          onChange={(e) => onChange({bodyText: e.target.value})}
          rows={3}
          placeholder="Supports **bold**, *italic*, and [links](url)"
        />
        <p className="text-xs text-muted-foreground">
          Markdown: **bold**, *italic*, [link](url)
        </p>
      </div>
      <TypographyPicker
        label="Body Style"
        value={config.bodyStyle}
        onChange={(bodyStyle) => onChange({bodyStyle})}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            type="text"
            value={config.ctaText || ''}
            onChange={(e) => onChange({ctaText: e.target.value})}
            placeholder="Learn More"
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
    </div>
  );
}
