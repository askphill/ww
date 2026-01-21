import {LogoSmall} from '@wakey/ui';
import type {HeaderSection as HeaderSectionType} from '../types';
import {getColorValue} from '../styles';

interface Props {
  config: HeaderSectionType['config'];
}

export function HeaderSection({config}: Props) {
  const bgColor = getColorValue(config.backgroundColor);
  const logoColor = getColorValue(config.logoColor);

  return (
    <header className="w-full" style={{backgroundColor: bgColor}}>
      <div className="px-8 py-6 text-center" style={{color: logoColor}}>
        <LogoSmall className="inline-block h-8 w-auto" />
      </div>
    </header>
  );
}
