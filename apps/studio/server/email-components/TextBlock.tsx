import {Section, Text} from '@react-email/components';

export interface TextBlockProps {
  content: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: 'paragraph' | 'small';
}

export function TextBlock({
  content,
  alignment = 'left',
  fontSize = 'paragraph',
}: TextBlockProps) {
  const fontSizeMap = {
    paragraph: '16px',
    small: '14px',
  };

  return (
    <Section
      style={{
        padding: '24px',
      }}
    >
      <Text
        style={{
          fontFamily: "'ITC Avant Garde Gothic', Arial, Helvetica, sans-serif",
          fontSize: fontSizeMap[fontSize],
          lineHeight: 1.6,
          color: '#1a1a1a',
          textAlign: alignment,
          margin: 0,
        }}
        dangerouslySetInnerHTML={{__html: content}}
      />
    </Section>
  );
}

// Schema for the template editor
export const TextBlockSchema = {
  type: 'TextBlock',
  name: 'Text Block',
  description: 'Body text content with formatting support',
  props: {
    content: {
      type: 'textarea',
      label: 'Content',
      description:
        'Text content. Supports basic HTML (bold, italic, links). Use {{firstName}} for personalization.',
      required: true,
      default: 'Enter your text here...',
    },
    alignment: {
      type: 'select',
      label: 'Alignment',
      description: 'Text alignment',
      required: false,
      default: 'left',
      options: [
        {value: 'left', label: 'Left'},
        {value: 'center', label: 'Center'},
        {value: 'right', label: 'Right'},
      ],
    },
    fontSize: {
      type: 'select',
      label: 'Font Size',
      description: 'Text size',
      required: false,
      default: 'paragraph',
      options: [
        {value: 'paragraph', label: 'Paragraph'},
        {value: 'small', label: 'Small'},
      ],
    },
  },
} as const;

export const TextBlockDefaultProps: TextBlockProps = {
  content: 'Enter your text here...',
  alignment: 'left',
  fontSize: 'paragraph',
};
