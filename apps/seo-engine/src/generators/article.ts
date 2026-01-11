import type { GeneratedArticle } from '../services/claude.js';
import { generateFrontmatter } from './frontmatter.js';
import { generateJsonLdScript } from './jsonld.js';

export function buildMdxArticle(article: GeneratedArticle): string {
  const frontmatter = generateFrontmatter(article.frontmatter);
  const jsonLdScript = generateJsonLdScript(article.jsonLd);

  return `${frontmatter}

${jsonLdScript}

${article.content}
`;
}
