import type {TextBlockSection, PaddingScale} from '@wakey/email';
import {Label} from '../../ui/label';
import {Textarea} from '../../ui/textarea';
import {ToggleGroup, ToggleGroupItem} from '../../ui/toggle-group';
import {ColorPicker} from './ColorPicker';
import {TypographyPicker} from './TypographyPicker';

const paddingOptions: {value: PaddingScale; label: string}[] = [
  {value: 0, label: '0'},
  {value: 1, label: '1'},
  {value: 2, label: '2'},
  {value: 4, label: '4'},
];

interface TextBlockPropertiesProps {
  config: TextBlockSection['config'];
  onChange: (config: Partial<TextBlockSection['config']>) => void;
}

export function TextBlockProperties({
  config,
  onChange,
}: TextBlockPropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={config.content}
          onChange={(e) => onChange({content: e.target.value})}
          rows={4}
          placeholder="Supports **bold**, *italic*, and [links](url)"
        />
        <p className="text-xs text-muted-foreground">
          Markdown: **bold**, *italic*, [link](url)
        </p>
      </div>
      <TypographyPicker
        label="Text Style"
        value={config.textStyle}
        onChange={(textStyle) => onChange({textStyle})}
      />
      <div className="space-y-2">
        <Label>Alignment</Label>
        <ToggleGroup
          type="single"
          value={config.alignment}
          onValueChange={(value) => {
            if (value)
              onChange({alignment: value as 'left' | 'center' | 'right'});
          }}
          variant="outline"
          className="justify-start"
        >
          <ToggleGroupItem value="left" className="flex-1">
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="center" className="flex-1">
            Center
          </ToggleGroupItem>
          <ToggleGroupItem value="right" className="flex-1">
            Right
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Padding Top</Label>
          <ToggleGroup
            type="single"
            value={String(config.paddingTop ?? 2)}
            onValueChange={(value) => {
              if (value) onChange({paddingTop: Number(value) as PaddingScale});
            }}
            variant="outline"
            className="justify-start"
          >
            {paddingOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={String(option.value)}
                className="flex-1"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="space-y-2">
          <Label>Padding Bottom</Label>
          <ToggleGroup
            type="single"
            value={String(config.paddingBottom ?? 2)}
            onValueChange={(value) => {
              if (value)
                onChange({paddingBottom: Number(value) as PaddingScale});
            }}
            variant="outline"
            className="justify-start"
          >
            {paddingOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={String(option.value)}
                className="flex-1"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
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
