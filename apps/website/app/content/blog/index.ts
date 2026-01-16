import type {BlogArticleFrontmatter} from '~/components/sections';

// Article imports
import JoinTheGoodMorningMovement from './join-the-good-morning-movement.mdx';
import PregnantAndDeodorant from './pregnant-and-deodorant.mdx';
import ImpactOfDeodorantOnHormones from './impact-of-deodorant-on-hormones.mdx';
import DeodorantAndMenopause from './deodorant-and-menopause.mdx';
import SayGoodbyeToPlastic from './say-goodbye-to-plastic.mdx';

// Article metadata for listing pages
export const articles: BlogArticleFrontmatter[] = [
  {
    title: 'Join The Good Morning Movement',
    slug: 'join-the-good-morning-movement',
    description:
      'Discover Wakey - a new generation brand focused on morning rituals and sustainable personal care.',
    publishedAt: '2023-09-06',
    author: 'Juliette Schreiner',
    category: 'brand',
    tags: ['wakey', 'morning routine', 'natural deodorant', 'sustainability'],
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/articles/0_0_1_7ea9e9eb-8bec-4129-9d7a-9a835fce1e97.jpg?v=1761317682',
      alt: 'Wakey brand',
      width: 2464,
      height: 1856,
    },
    relatedProduct: {handle: 'deodorant'},
  },
  {
    title: 'Pregnant and deodorant: why choose for a natural option',
    slug: 'pregnant-and-deodorant',
    description:
      'Find a safe deodorant without harmful ingredients for pregnancy or when trying to conceive.',
    publishedAt: '2023-03-17',
    author: 'Juliette Schreiner',
    category: 'health',
    tags: ['pregnancy', 'natural deodorant', 'aluminum-free', 'safe skincare'],
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/articles/zwanger-natuurlijkedeodorant.jpg?v=1679057430',
      alt: 'Natural deodorant for pregnancy',
      width: 800,
      height: 1200,
    },
    relatedProduct: {handle: 'deodorant'},
  },
  {
    title: 'The impact of deodorant on our hormones',
    slug: 'impact-of-deodorant-on-hormones',
    description:
      'Learn how aluminium in deodorant can affect your hormones and why natural alternatives might be better.',
    publishedAt: '2023-03-17',
    author: 'Juliette Schreiner',
    category: 'health',
    tags: ['hormones', 'aluminum', 'natural deodorant', 'health'],
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/articles/impact_of_deodorant_on_hormones.jpg?v=1679056649',
      alt: 'Impact of deodorant on hormones',
      width: 1080,
      height: 1297,
    },
    relatedProduct: {handle: 'deodorant'},
  },
  {
    title: 'Deodorant and hormonal changes during menopause',
    slug: 'deodorant-and-menopause',
    description:
      'Find a safe and natural deodorant during menopause to reduce unpleasant odors from hormonal changes.',
    publishedAt: '2023-03-17',
    author: 'Juliette Schreiner',
    category: 'health',
    tags: ['menopause', 'hormones', 'natural deodorant', "women's health"],
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/articles/deodorant-overgang.png?v=1679055519',
      alt: 'Deodorant during menopause',
      width: 1100,
      height: 1310,
    },
    relatedProduct: {handle: 'deodorant'},
  },
  {
    title: 'Say goodbye to plastic',
    slug: 'say-goodbye-to-plastic',
    description:
      'Discover why plastic-free deodorant packaging is better for the environment and your skin.',
    publishedAt: '2023-03-17',
    author: 'Juliette Schreiner',
    category: 'sustainability',
    tags: ['plastic-free', 'sustainable', 'eco-friendly', 'packaging'],
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0609/8747/4152/articles/plasticfree-deodorant.jpg?v=1679055639',
      alt: 'Plastic-free deodorant',
      width: 1080,
      height: 1620,
    },
    relatedProduct: {handle: 'deodorant'},
  },
];

// Map of slug to MDX component
export const articleComponents: Record<string, React.ComponentType> = {
  'join-the-good-morning-movement': JoinTheGoodMorningMovement,
  'pregnant-and-deodorant': PregnantAndDeodorant,
  'impact-of-deodorant-on-hormones': ImpactOfDeodorantOnHormones,
  'deodorant-and-menopause': DeodorantAndMenopause,
  'say-goodbye-to-plastic': SayGoodbyeToPlastic,
};

// Helper to get article by slug
export function getArticleBySlug(slug: string) {
  const frontmatter = articles.find((a) => a.slug === slug);
  const Component = articleComponents[slug];
  return frontmatter && Component ? {frontmatter, Component} : null;
}

// Get all articles sorted by date (newest first)
export function getAllArticles() {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
