import type { ArticleFrontmatter } from '../types/index.js';

export function generateFrontmatter(frontmatter: ArticleFrontmatter): string {
  const lines: string[] = ['---'];

  lines.push(`title: "${escapeYaml(frontmatter.title)}"`);
  lines.push(`slug: "${frontmatter.slug}"`);
  lines.push(`description: "${escapeYaml(frontmatter.description)}"`);
  lines.push(`publishedAt: "${frontmatter.publishedAt}"`);
  lines.push(`author: "${frontmatter.author}"`);
  lines.push(`category: "${frontmatter.category}"`);

  // Tags array
  lines.push('tags:');
  for (const tag of frontmatter.tags) {
    lines.push(`  - "${escapeYaml(tag)}"`);
  }

  // Featured image (optional)
  if (frontmatter.featuredImage) {
    lines.push('featuredImage:');
    lines.push(`  url: "${frontmatter.featuredImage.url}"`);
    lines.push(`  alt: "${escapeYaml(frontmatter.featuredImage.alt)}"`);
  }

  // Related product (optional)
  if (frontmatter.relatedProduct) {
    lines.push('relatedProduct:');
    lines.push(`  handle: "${frontmatter.relatedProduct.handle}"`);
  }

  lines.push('---');

  return lines.join('\n');
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"');
}
