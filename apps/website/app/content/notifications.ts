/**
 * Notification type definition
 */
export interface Notification {
  id: string;
  type: 'product' | 'blog';
  title: string;
  description: string;
  href: string;
  date: string;
  image?: string;
}

/**
 * Notifications content
 *
 * This file defines the notifications that appear in the notification center.
 * Each notification has:
 * - id: unique identifier (used for read state tracking)
 * - type: 'product' or 'blog'
 * - title: notification title
 * - description: brief description
 * - href: link to the content
 * - date: ISO date string for sorting/display
 */
export const notifications: Notification[] = [
  {
    id: 'product-deodorant-2024',
    type: 'product',
    title: 'New: Mighty Citrus Deodorant',
    description:
      'Our refreshing new scent is here. Natural, aluminum-free protection.',
    href: '/products/deodorant',
    date: '2024-01-10',
    image:
      'https://cdn.shopify.com/s/files/1/0609/8747/4152/products/wakey-shot.png?v=1701280929',
  },
  {
    id: 'blog-good-morning-movement',
    type: 'blog',
    title: 'Join The Good Morning Movement',
    description: 'Discover how Wakey is transforming morning rituals.',
    href: '/blog/join-the-good-morning-movement',
    date: '2023-09-06',
    image:
      'https://cdn.shopify.com/s/files/1/0609/8747/4152/articles/0_0_1_7ea9e9eb-8bec-4129-9d7a-9a835fce1e97.jpg?v=1761317682',
  },
  {
    id: 'blog-plastic-free',
    type: 'blog',
    title: 'Say Goodbye to Plastic',
    description: 'Why plastic-free packaging matters for you and the planet.',
    href: '/blog/say-goodbye-to-plastic',
    date: '2023-03-17',
    image:
      'https://cdn.shopify.com/s/files/1/0609/8747/4152/articles/plasticfree-deodorant.jpg?v=1679055639',
  },
];
