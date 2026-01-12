import type {Route} from './+types/_index';
import Home from '~/content/home.mdx';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Wakey | Feel-Good Morning Rituals'},
    {
      name: 'description',
      content:
        'Start your day right with Wakey natural deodorant. Aluminum-free, baking soda-free, and made with safe ingredients for all-day freshness.',
    },
    {property: 'og:title', content: 'Wakey | Feel-Good Morning Rituals'},
    {
      property: 'og:description',
      content:
        'Start your day right with Wakey natural deodorant. Aluminum-free, baking soda-free, and made with safe ingredients for all-day freshness.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: 'https://www.wakey.care'},
    {property: 'og:image', content: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/wakey-og-image.jpg'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'Wakey | Feel-Good Morning Rituals'},
    {
      name: 'twitter:description',
      content:
        'Start your day right with Wakey natural deodorant. Aluminum-free, baking soda-free, and made with safe ingredients for all-day freshness.',
    },
    {name: 'twitter:image', content: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/wakey-og-image.jpg'},
    {tagName: 'link', rel: 'canonical', href: 'https://www.wakey.care'},
  ];
};

export default function Homepage() {
  return <Home />;
}
