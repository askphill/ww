import {Button, Section} from '@react-email/components';

export interface CallToActionProps {
  text: string;
  url: string;
  variant?: 'primary' | 'secondary';
}

export function CallToAction({
  text,
  url,
  variant = 'primary',
}: CallToActionProps) {
  const isPrimary = variant === 'primary';

  return (
    <Section
      style={{
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <Button
        href={url}
        style={{
          backgroundColor: isPrimary ? '#FAD103' : 'transparent',
          color: isPrimary ? '#1a1a1a' : '#FAD103',
          fontFamily: "'Founders Grotesk', Arial, Helvetica, sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          padding: '16px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block',
          border: isPrimary ? 'none' : '2px solid #FAD103',
        }}
      >
        {text}
      </Button>
    </Section>
  );
}

// Schema for the template editor
export const CallToActionSchema = {
  type: 'CallToAction',
  name: 'Call to Action',
  description: 'Centered button for driving clicks',
  props: {
    text: {
      type: 'string',
      label: 'Button Text',
      description: 'Text displayed on the button',
      required: true,
      default: 'Shop Now',
    },
    url: {
      type: 'string',
      label: 'Button URL',
      description: 'URL the button links to',
      required: true,
      default: 'https://www.wakey.care',
    },
    variant: {
      type: 'select',
      label: 'Variant',
      description: 'Button style variant',
      required: false,
      default: 'primary',
      options: [
        {value: 'primary', label: 'Primary (Yellow background)'},
        {value: 'secondary', label: 'Secondary (Yellow border)'},
      ],
    },
  },
} as const;

export const CallToActionDefaultProps: CallToActionProps = {
  text: 'Shop Now',
  url: 'https://www.wakey.care',
  variant: 'primary',
};
