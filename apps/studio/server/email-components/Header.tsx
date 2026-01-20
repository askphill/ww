import {Img, Section} from '@react-email/components';

export interface HeaderProps {
  logoUrl: string;
  backgroundColor?: string;
}

export function Header({logoUrl, backgroundColor = '#1a1a1a'}: HeaderProps) {
  return (
    <Section
      style={{
        backgroundColor,
        padding: '24px 0',
        textAlign: 'center',
      }}
    >
      <Img
        src={logoUrl}
        alt="Wakey"
        height="40"
        style={{
          height: '40px',
          width: 'auto',
          margin: '0 auto',
        }}
      />
    </Section>
  );
}

// Schema for the template editor
export const HeaderSchema = {
  type: 'Header',
  name: 'Header',
  description: 'Email header with logo and background color',
  props: {
    logoUrl: {
      type: 'string',
      label: 'Logo URL',
      description: 'URL of the logo image',
      required: true,
      default:
        'https://cdn.shopify.com/s/files/1/0759/2266/8069/files/wakey-logo.png',
    },
    backgroundColor: {
      type: 'color',
      label: 'Background Color',
      description: 'Background color of the header section',
      required: false,
      default: '#1a1a1a',
    },
  },
} as const;

export const HeaderDefaultProps: HeaderProps = {
  logoUrl:
    'https://cdn.shopify.com/s/files/1/0759/2266/8069/files/wakey-logo.png',
  backgroundColor: '#1a1a1a',
};
