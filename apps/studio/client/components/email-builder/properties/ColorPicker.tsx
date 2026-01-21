import type {WakeyColor} from '@wakey/email';
import {wakeyEmailColors} from '@wakey/email';
import {Label} from '../../ui/label';
import {ToggleGroup, ToggleGroupItem} from '../../ui/toggle-group';

interface ColorPickerProps {
  label: string;
  value: WakeyColor;
  onChange: (color: WakeyColor) => void;
}

const colorOptions: {value: WakeyColor; label: string}[] = [
  {value: 'sand', label: 'Sand'},
  {value: 'softorange', label: 'Soft Orange'},
  {value: 'ocher', label: 'Ocher'},
  {value: 'skyblue', label: 'Sky Blue'},
  {value: 'blue', label: 'Blue'},
  {value: 'yellow', label: 'Yellow'},
  {value: 'black', label: 'Black'},
  {value: 'white', label: 'White'},
];

export function ColorPicker({label, value, onChange}: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v as WakeyColor);
        }}
        className="flex-wrap justify-start gap-1"
      >
        {colorOptions.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="h-8 w-8 rounded-md border p-0"
            style={{backgroundColor: wakeyEmailColors[option.value]}}
            title={option.label}
          >
            {value === option.value && (
              <svg
                className={`h-4 w-4 ${
                  option.value === 'black' ? 'text-white' : 'text-black'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
