import type {FooterSection} from '@wakey/email';
import {Checkbox} from '../../ui/checkbox';
import {Input} from '../../ui/input';
import {Label} from '../../ui/label';
import {ColorPicker} from './ColorPicker';

interface FooterPropertiesProps {
  config: FooterSection['config'];
  onChange: (config: Partial<FooterSection['config']>) => void;
}

export function FooterProperties({config, onChange}: FooterPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Social Links */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="showSocialLinks"
          checked={config.showSocialLinks}
          onCheckedChange={(checked) =>
            onChange({showSocialLinks: checked === true})
          }
        />
        <Label htmlFor="showSocialLinks">Show Social Links</Label>
      </div>
      {config.showSocialLinks && (
        <>
          <div className="space-y-2">
            <Label>Instagram URL</Label>
            <Input
              type="text"
              value={config.instagramUrl}
              onChange={(e) => onChange({instagramUrl: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>TikTok URL</Label>
            <Input
              type="text"
              value={config.tiktokUrl}
              onChange={(e) => onChange({tiktokUrl: e.target.value})}
            />
          </div>
        </>
      )}

      {/* Payment Icons */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="showPaymentIcons"
          checked={config.showPaymentIcons}
          onCheckedChange={(checked) =>
            onChange({showPaymentIcons: checked === true})
          }
        />
        <Label htmlFor="showPaymentIcons">Show Payment Icons</Label>
      </div>

      {/* Legal Text */}
      <div className="space-y-2">
        <Label>Legal Text</Label>
        <Input
          type="text"
          value={config.legalText}
          onChange={(e) => onChange({legalText: e.target.value})}
        />
      </div>

      {/* Unsubscribe */}
      <div className="space-y-2">
        <Label>Unsubscribe Text</Label>
        <Input
          type="text"
          value={config.unsubscribeText}
          onChange={(e) => onChange({unsubscribeText: e.target.value})}
        />
      </div>

      {/* Colors */}
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
      <ColorPicker
        label="Text Color"
        value={config.textColor}
        onChange={(textColor) => onChange({textColor})}
      />
    </div>
  );
}
