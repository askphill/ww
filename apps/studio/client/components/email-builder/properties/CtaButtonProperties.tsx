import type {CtaButtonSection, ButtonVariant, ButtonIcon} from '@wakey/email';
import {Input} from '../../ui/input';
import {Label} from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {ToggleGroup, ToggleGroupItem} from '../../ui/toggle-group';
import {ColorPicker} from './ColorPicker';

interface CtaButtonPropertiesProps {
  config: CtaButtonSection['config'];
  onChange: (config: Partial<CtaButtonSection['config']>) => void;
}

const variants: ButtonVariant[] = ['primary', 'secondary', 'outline'];
const icons: ButtonIcon[] = [
  'none',
  'bag',
  'add-bag',
  'checkout',
  'arrow-right',
];

const iconLabels: Record<ButtonIcon, string> = {
  none: 'None',
  bag: 'Bag',
  'add-bag': 'Add to Bag',
  checkout: 'Checkout',
  'arrow-right': 'Arrow',
};

export function CtaButtonProperties({
  config,
  onChange,
}: CtaButtonPropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          type="text"
          value={config.text}
          onChange={(e) => onChange({text: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          type="url"
          value={config.url}
          onChange={(e) => onChange({url: e.target.value})}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>Variant</Label>
        <ToggleGroup
          type="single"
          value={config.variant}
          onValueChange={(value) => {
            if (value) onChange({variant: value as ButtonVariant});
          }}
          variant="outline"
          className="justify-start"
        >
          {variants.map((variant) => (
            <ToggleGroupItem
              key={variant}
              value={variant}
              className="flex-1 capitalize"
            >
              {variant}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <Label>Icon</Label>
        <Select
          value={config.icon}
          onValueChange={(value) => onChange({icon: value as ButtonIcon})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {icons.map((icon) => (
              <SelectItem key={icon} value={icon}>
                {iconLabels[icon]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
      <ColorPicker
        label="Section Background"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({backgroundColor})}
      />
    </div>
  );
}
