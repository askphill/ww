import {Column, Link, Row, Section, Text} from '@react-email/components';

export interface SocialLink {
  platform: 'instagram' | 'tiktok';
  url: string;
}

export interface FooterProps {
  unsubscribeUrl: string;
  address: string;
  socialLinks?: SocialLink[];
}

// Inline SVG icons for email compatibility
const InstagramIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{display: 'inline-block', verticalAlign: 'middle'}}
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="5"
      stroke="#666666"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="4" stroke="#666666" strokeWidth="2" />
    <circle cx="18" cy="6" r="1.5" fill="#666666" />
  </svg>
);

const TikTokIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{display: 'inline-block', verticalAlign: 'middle'}}
  >
    <path
      d="M9 12V18C9 19.6569 10.3431 21 12 21C13.6569 21 15 19.6569 15 18V3H18C18 5.20914 19.7909 7 22 7V10C19.7909 10 18 8.20914 18 6V18C18 21.3137 15.3137 24 12 24C8.68629 24 6 21.3137 6 18V12H9Z"
      stroke="#666666"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export function Footer({
  unsubscribeUrl,
  address,
  socialLinks = [],
}: FooterProps) {
  const instagramLink = socialLinks.find((s) => s.platform === 'instagram');
  const tiktokLink = socialLinks.find((s) => s.platform === 'tiktok');

  return (
    <Section
      style={{
        backgroundColor: '#1a1a1a',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      {/* Social Links */}
      {socialLinks.length > 0 && (
        <Row style={{marginBottom: '24px'}}>
          <Column style={{textAlign: 'center'}}>
            {instagramLink && (
              <Link
                href={instagramLink.url}
                style={{
                  display: 'inline-block',
                  margin: '0 12px',
                }}
              >
                <InstagramIcon />
              </Link>
            )}
            {tiktokLink && (
              <Link
                href={tiktokLink.url}
                style={{
                  display: 'inline-block',
                  margin: '0 12px',
                }}
              >
                <TikTokIcon />
              </Link>
            )}
          </Column>
        </Row>
      )}

      {/* Physical Address - CAN-SPAM requirement */}
      <Text
        style={{
          fontFamily: "'ITC Avant Garde Gothic', Arial, Helvetica, sans-serif",
          fontSize: '12px',
          color: '#666666',
          lineHeight: '1.6',
          margin: '0 0 16px 0',
        }}
      >
        {address}
      </Text>

      {/* Unsubscribe Link - Prominent and clickable */}
      <Text
        style={{
          fontFamily: "'ITC Avant Garde Gothic', Arial, Helvetica, sans-serif",
          fontSize: '12px',
          color: '#666666',
          margin: '0',
        }}
      >
        <Link
          href={unsubscribeUrl}
          style={{
            color: '#666666',
            textDecoration: 'underline',
          }}
        >
          Unsubscribe
        </Link>
        {' from these emails'}
      </Text>
    </Section>
  );
}

// Schema for the template editor
export const FooterSchema = {
  type: 'Footer',
  name: 'Footer',
  description:
    'Email footer with unsubscribe link, physical address, and social links',
  props: {
    unsubscribeUrl: {
      type: 'string',
      label: 'Unsubscribe URL',
      description:
        'URL for the unsubscribe page (will be auto-generated with token)',
      required: true,
      default: '{{unsubscribeUrl}}',
    },
    address: {
      type: 'textarea',
      label: 'Physical Address',
      description: 'Your physical mailing address (required by CAN-SPAM)',
      required: true,
      default: 'Wakey Care Inc.\n123 Main Street\nLos Angeles, CA 90001',
    },
    socialLinks: {
      type: 'array',
      label: 'Social Links',
      description: 'Social media profile links (Instagram, TikTok)',
      required: false,
      maxItems: 2,
      itemSchema: {
        platform: {
          type: 'select',
          label: 'Platform',
          description: 'Social media platform',
          required: true,
          options: [
            {value: 'instagram', label: 'Instagram'},
            {value: 'tiktok', label: 'TikTok'},
          ],
        },
        url: {
          type: 'string',
          label: 'URL',
          description: 'Profile URL',
          required: true,
        },
      },
      default: [],
    },
  },
} as const;

export const FooterDefaultProps: FooterProps = {
  unsubscribeUrl: '{{unsubscribeUrl}}',
  address: 'Wakey Care Inc.\n123 Main Street\nLos Angeles, CA 90001',
  socialLinks: [
    {platform: 'instagram', url: 'https://instagram.com/wakeycare'},
    {platform: 'tiktok', url: 'https://tiktok.com/@wakeycare'},
  ],
};
