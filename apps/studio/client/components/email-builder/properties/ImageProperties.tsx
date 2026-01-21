import type {ImageSection} from '@wakey/email';
import {Input} from '../../ui/input';
import {Label} from '../../ui/label';
import {ColorPicker} from './ColorPicker';

interface ImagePropertiesProps {
  config: ImageSection['config'];
  onChange: (config: Partial<ImageSection['config']>) => void;
}

export function ImageProperties({config, onChange}: ImagePropertiesProps) {
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
        <Label>Alt Text</Label>
        <Input
          type="text"
          value={config.altText}
          onChange={(e) => onChange({altText: e.target.value})}
          placeholder="Describe the image"
        />
      </div>
      <div className="space-y-2">
        <Label>Link URL (optional)</Label>
        <Input
          type="url"
          value={config.linkUrl || ''}
          onChange={(e) => onChange({linkUrl: e.target.value})}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Full Width</Label>
        <button
          type="button"
          onClick={() => onChange({fullWidth: !config.fullWidth})}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.fullWidth ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.fullWidth ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <ColorPicker
        label="Background"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({backgroundColor})}
      />
    </div>
  );
}
