import type {ButtonVariant, ButtonIcon} from '@wakey/email';
import {Label} from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {ToggleGroup, ToggleGroupItem} from '../../ui/toggle-group';

interface ButtonStylePickerProps {
  variant: ButtonVariant;
  icon: ButtonIcon;
  onVariantChange: (variant: ButtonVariant) => void;
  onIconChange: (icon: ButtonIcon) => void;
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

export function ButtonStylePicker({
  variant,
  icon,
  onVariantChange,
  onIconChange,
}: ButtonStylePickerProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Button Variant</Label>
        <ToggleGroup
          type="single"
          value={variant}
          onValueChange={(value) => {
            if (value) onVariantChange(value as ButtonVariant);
          }}
          variant="outline"
          className="justify-start"
        >
          {variants.map((v) => (
            <ToggleGroupItem key={v} value={v} className="flex-1 capitalize">
              {v}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <Label>Button Icon</Label>
        <Select
          value={icon}
          onValueChange={(value) => onIconChange(value as ButtonIcon)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {icons.map((i) => (
              <SelectItem key={i} value={i}>
                {iconLabels[i]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
