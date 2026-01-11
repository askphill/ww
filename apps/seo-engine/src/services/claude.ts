import Anthropic from '@anthropic-ai/sdk';
import type { ArticleFrontmatter } from '../types/index.js';
import { getArticlePrompt, getSystemPrompt } from '../templates/prompts.js';

interface RelatedProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
}

export interface GeneratedArticle {
  frontmatter: ArticleFrontmatter;
  content: string;
  jsonLd: object;
}

export async function generateArticle(
  topic: string,
  relatedProduct: RelatedProduct | null
): Promise<GeneratedArticle> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY in .env');
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = getSystemPrompt();
  const userPrompt = getArticlePrompt(topic, relatedProduct);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Extract text content
  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse the JSON response
  const jsonMatch = textContent.text.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Could not parse article JSON from Claude response');
  }

  const articleData = JSON.parse(jsonMatch[1]) as {
    frontmatter: ArticleFrontmatter;
    content: string;
  };

  // Generate JSON-LD structured data
  const jsonLd = generateJsonLd(articleData.frontmatter, relatedProduct);

  return {
    frontmatter: articleData.frontmatter,
    content: articleData.content,
    jsonLd,
  };
}

function generateJsonLd(
  frontmatter: ArticleFrontmatter,
  relatedProduct: RelatedProduct | null
): object {
  const baseUrl = 'https://wakey.care';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description,
    author: {
      '@type': 'Organization',
      name: frontmatter.author,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Wakey',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${frontmatter.slug}`,
    },
    image: frontmatter.featuredImage?.url,
    keywords: frontmatter.tags.join(', '),
  };

  const schemas: object[] = [articleSchema];

  // Add product mention if related product exists
  if (relatedProduct) {
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: relatedProduct.title,
      url: `${baseUrl}/products/${relatedProduct.handle}`,
    };
    schemas.push(productSchema);
  }

  return schemas.length === 1 ? schemas[0]! : schemas;
}
