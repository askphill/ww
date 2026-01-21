import type {HeaderSection} from '@wakey/email';
import {ColorPicker} from './ColorPicker';

interface HeaderPropertiesProps {
  config: HeaderSection['config'];
  onChange: (config: Partial<HeaderSection['config']>) => void;
}

export function HeaderProperties({config, onChange}: HeaderPropertiesProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Uses the Wakey logo from the design system.
      </p>
      <ColorPicker
        label="Background"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({backgroundColor})}
      />
      <ColorPicker
        label="Logo Color"
        value={config.logoColor}
        onChange={(logoColor) => onChange({logoColor})}
      />
    </div>
  );
}
