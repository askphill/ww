import type {FooterSection as FooterSectionType} from '../types';
import {
  LogoBig,
  VisaIcon,
  MastercardIcon,
  AmexIcon,
  PayPalIcon,
  IdealIcon,
  KlarnaIcon,
} from '@wakey/ui';
import {getColorValue} from '../styles';

interface Props {
  config: FooterSectionType['config'];
}

export function FooterSection({config}: Props) {
  const bgColor = getColorValue(config.backgroundColor);
  const logoColor = getColorValue(config.logoColor);
  const textColor = getColorValue(config.textColor);

  return (
    <footer className="w-full p-4" style={{backgroundColor: bgColor}}>
      {/* Logo */}
      <div className="mb-6" style={{color: logoColor}}>
        <LogoBig className="w-full" />
      </div>

      {/* Social Links */}
      {config.showSocialLinks && (
        <div
          className="flex gap-4 font-display text-label mb-6"
          style={{color: textColor}}
        >
          <a href={config.instagramUrl} className="underline">
            Instagram
          </a>
          <a href={config.tiktokUrl} className="underline">
            TikTok
          </a>
        </div>
      )}

      {/* Payment Icons */}
      {config.showPaymentIcons && (
        <div className="flex gap-1 mb-6">
          <VisaIcon className="h-6 w-auto" />
          <MastercardIcon className="h-6 w-auto" />
          <AmexIcon className="h-6 w-auto" />
          <PayPalIcon className="h-6 w-auto" />
          <IdealIcon className="h-6 w-auto" />
          <KlarnaIcon className="h-6 w-auto" />
        </div>
      )}

      {/* Legal Text */}
      <p
        className="font-display text-small m-0 mb-2"
        style={{color: textColor}}
      >
        {config.legalText}
      </p>

      {/* Unsubscribe */}
      <a
        href="{% unsubscribe_url %}"
        className="font-display text-small underline"
        style={{color: textColor, opacity: 0.7}}
      >
        {config.unsubscribeText}
      </a>
    </footer>
  );
}
