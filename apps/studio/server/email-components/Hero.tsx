import {Button, Img, Section, Text} from '@react-email/components';

export interface HeroProps {
  headline: string;
  subheadline?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
}

export function Hero({
  headline,
  subheadline,
  imageUrl,
  buttonText,
  buttonUrl,
  backgroundColor = '#1a1a1a',
}: HeroProps) {
  return (
    <Section
      style={{
        backgroundColor,
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {imageUrl && (
        <Img
          src={imageUrl}
          alt=""
          style={{
            maxWidth: '100%',
            width: '100%',
            height: 'auto',
            marginBottom: '24px',
          }}
        />
      )}
      <Text
        style={{
          fontFamily: "'Founders Grotesk', Arial, Helvetica, sans-serif",
          fontSize: '32px',
          fontWeight: 600,
          lineHeight: 1.2,
          color: '#FFF5EB',
          margin: '0 0 16px 0',
        }}
      >
        {headline}
      </Text>
      {subheadline && (
        <Text
          style={{
            fontFamily:
              "'ITC Avant Garde Gothic', Arial, Helvetica, sans-serif",
            fontSize: '18px',
            lineHeight: 1.5,
            color: '#FFF5EB',
            margin: '0 0 24px 0',
          }}
        >
          {subheadline}
        </Text>
      )}
      {buttonText && buttonUrl && (
        <Button
          href={buttonUrl}
          style={{
            backgroundColor: '#FAD103',
            color: '#1a1a1a',
            fontFamily: "'Founders Grotesk', Arial, Helvetica, sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          {buttonText}
        </Button>
      )}
    </Section>
  );
}

// Schema for the template editor
export const HeroSchema = {
  type: 'Hero',
  name: 'Hero',
  description: 'Hero section with headline, image, and call-to-action button',
  props: {
    headline: {
      type: 'string',
      label: 'Headline',
      description: 'Main headline text. Use {{firstName}} for personalization.',
      required: true,
      default: 'Welcome to Wakey',
    },
    subheadline: {
      type: 'string',
      label: 'Subheadline',
      description:
        'Secondary text below the headline. Use {{firstName}} for personalization.',
      required: false,
      default: '',
    },
    imageUrl: {
      type: 'string',
      label: 'Image URL',
      description: 'URL of the hero image',
      required: false,
      default: '',
    },
    buttonText: {
      type: 'string',
      label: 'Button Text',
      description: 'Text displayed on the CTA button',
      required: false,
      default: 'Shop Now',
    },
    buttonUrl: {
      type: 'string',
      label: 'Button URL',
      description: 'URL the button links to',
      required: false,
      default: 'https://www.wakey.care',
    },
    backgroundColor: {
      type: 'color',
      label: 'Background Color',
      description: 'Background color of the hero section',
      required: false,
      default: '#1a1a1a',
    },
  },
} as const;

export const HeroDefaultProps: HeroProps = {
  headline: 'Welcome to Wakey',
  subheadline: 'Your morning routine just got better',
  imageUrl: '',
  buttonText: 'Shop Now',
  buttonUrl: 'https://www.wakey.care',
  backgroundColor: '#1a1a1a',
};
