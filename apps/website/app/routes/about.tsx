import type {Route} from './+types/about';
import AboutPage from '~/content/about.mdx';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'About Us | Wakey'},
    {
      name: 'description',
      content:
        'Meet the founders behind Wakey. We believe in feel-good morning rituals with natural, effective products that are kind to your skin and the planet.',
    },
    {property: 'og:title', content: 'About Us | Wakey'},
    {
      property: 'og:description',
      content:
        'Meet the founders behind Wakey. We believe in feel-good morning rituals with natural, effective products.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: 'https://wakeywakey.com/about'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: 'About Us | Wakey'},
    {
      name: 'twitter:description',
      content:
        'Meet the founders behind Wakey. We believe in feel-good morning rituals with natural, effective products.',
    },
    {rel: 'canonical', href: 'https://wakeywakey.com/about'},
  ];
};

export default function About() {
  return <AboutPage />;
}
