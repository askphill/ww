import type {Route} from './+types/contact';
import ContactPage from '~/content/contact.mdx';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Contact | Wakey'},
    {
      name: 'description',
      content:
        'Get in touch with Wakey. Contact us for customer service, press inquiries, or wholesale opportunities.',
    },
    {property: 'og:title', content: 'Contact | Wakey'},
    {
      property: 'og:description',
      content:
        'Get in touch with Wakey. Contact us for customer service, press inquiries, or wholesale opportunities.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: 'https://www.wakey.care/contact'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: 'Contact | Wakey'},
    {
      name: 'twitter:description',
      content:
        'Get in touch with Wakey. Contact us for customer service, press inquiries, or wholesale opportunities.',
    },
    {tagName: 'link', rel: 'canonical', href: 'https://www.wakey.care/contact'},
  ];
};

export default function Contact() {
  return <ContactPage />;
}
