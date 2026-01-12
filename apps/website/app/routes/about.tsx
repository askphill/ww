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
    {property: 'og:url', content: 'https://www.wakey.care/about'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: 'About Us | Wakey'},
    {
      name: 'twitter:description',
      content:
        'Meet the founders behind Wakey. We believe in feel-good morning rituals with natural, effective products.',
    },
    {tagName: 'link', rel: 'canonical', href: 'https://www.wakey.care/about'},
  ];
};

export default function About() {
  return <AboutPage />;
}
