import type {Route} from './+types/_index';
import {useLoaderData} from 'react-router';
import Home from '~/content/home.mdx';
import {getTooltipProducts} from '~/lib/tooltip-product.server';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Wakey | Natural Morning Essentials for a Feel-Good Start'},
    {
      name: 'description',
      content:
        'Wakey crafts upbeat, zero-fuss morning essentials designed to spark joy. Shop our natural deodorant and other feel-good products!',
    },
    {
      property: 'og:title',
      content: 'Wakey | Natural Morning Essentials for a Feel-Good Start',
    },
    {
      property: 'og:description',
      content:
        'Wakey crafts upbeat, zero-fuss morning essentials designed to spark joy. Shop our natural deodorant and other feel-good products!',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: 'https://www.wakey.care'},
    {
      property: 'og:image',
      content:
        'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/wakey-og-image.jpg',
    },
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {
      name: 'twitter:title',
      content: 'Wakey | Natural Morning Essentials for a Feel-Good Start',
    },
    {
      name: 'twitter:description',
      content:
        'Wakey crafts upbeat, zero-fuss morning essentials designed to spark joy. Shop our natural deodorant and other feel-good products!',
    },
    {
      name: 'twitter:image',
      content:
        'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/wakey-og-image.jpg',
    },
    {tagName: 'link', rel: 'canonical', href: 'https://www.wakey.care'},
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const tooltipProducts = await getTooltipProducts(context.storefront, [
    'deodorant',
  ]);

  return {tooltipProducts};
}

export default function Homepage() {
  const {tooltipProducts} = useLoaderData<typeof loader>();

  return <Home tooltipProducts={tooltipProducts} />;
}
