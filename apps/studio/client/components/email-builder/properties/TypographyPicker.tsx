import type {TypographyStyle} from '@wakey/email';
import {Label} from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface TypographyPickerProps {
  label: string;
  value: TypographyStyle;
  onChange: (style: TypographyStyle) => void;
}

const typographyOptions: {value: TypographyStyle; label: string}[] = [
  {value: 'text-display', label: 'Display'},
  {value: 'text-h1', label: 'H1'},
  {value: 'text-h2', label: 'H2'},
  {value: 'text-h3', label: 'H3'},
  {value: 'text-s1', label: 'S1'},
  {value: 'text-s2', label: 'S2'},
  {value: 'text-paragraph', label: 'Paragraph'},
  {value: 'text-body-small', label: 'Body Small'},
  {value: 'text-small', label: 'Small'},
  {value: 'text-label', label: 'Label'},
];

export function TypographyPicker({
  label,
  value,
  onChange,
}: TypographyPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {typographyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
