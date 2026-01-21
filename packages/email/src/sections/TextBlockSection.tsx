import type {
  TextBlockSection as TextBlockSectionType,
  PaddingScale,
} from '../types';
import {parseMarkdown} from '../utils/parseMarkdown';

interface Props {
  config: TextBlockSectionType['config'];
}

// Map padding scale to Tailwind classes
const paddingTopClasses: Record<PaddingScale, string> = {
  0: 'pt-0',
  1: 'pt-4',
  2: 'pt-8',
  4: 'pt-16',
};

const paddingBottomClasses: Record<PaddingScale, string> = {
  0: 'pb-0',
  1: 'pb-4',
  2: 'pb-8',
  4: 'pb-16',
};

export function TextBlockSection({config}: Props) {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[config.alignment];

  const paddingTop = paddingTopClasses[config.paddingTop ?? 2];
  const paddingBottom = paddingBottomClasses[config.paddingBottom ?? 2];

  // Parse markdown and preserve line breaks
  const htmlContent = parseMarkdown(config.content).replace(/\n/g, '<br />');

  return (
    <section className={`w-full bg-${config.backgroundColor}`}>
      <div className={`px-8 ${paddingTop} ${paddingBottom} ${alignmentClass}`}>
        <p
          className={`${config.textStyle} font-display text-${config.textColor} m-0`}
          dangerouslySetInnerHTML={{__html: htmlContent}}
        />
      </div>
    </section>
  );
}
