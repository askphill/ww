import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {ReactNode} from 'react';

export interface BlogArticleFrontmatter {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  author: string;
  category?: string;
  tags?: string[];
  featuredImage?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  relatedProduct?: {
    handle: string;
  };
}

interface BlogArticleProps {
  frontmatter: BlogArticleFrontmatter;
  children: ReactNode;
}

export function BlogArticle({frontmatter, children}: BlogArticleProps) {
  const {title, publishedAt, author, featuredImage, tags} = frontmatter;

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(publishedAt));

  // Estimate read time from content (rough estimate)
  const readTime = 4; // Default estimate for MDX articles

  return (
    <article className="bg-sand">
      {/* Header */}
      <header className="px-4 pt-24 pb-4 max-w-4xl mx-auto md:pt-36 md:px-0 md:text-center">
        <div className="flex flex-wrap items-center gap-2 text-small text-text/60 md:justify-center">
          <time dateTime={publishedAt}>{publishedDate}</time>
          <span aria-hidden="true">•</span>
          <span>{readTime} min read</span>
        </div>
        <h1 className="text-h1 font-display mt-4">{title}</h1>
        {author && (
          <p className="text-small text-text/60 mt-4 md:mt-6">By {author}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 md:justify-center">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-small bg-black/5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {featuredImage && (
        <figure className="mt-8 md:mt-12">
          <img
            src={featuredImage.url}
            alt={featuredImage.alt || title}
            className="w-full aspect-video object-cover"
            width={featuredImage.width}
            height={featuredImage.height}
            loading="eager"
          />
        </figure>
      )}

      {/* Content */}
      <div className="px-4 pt-8 pb-16 max-w-2xl mx-auto md:px-0 md:pt-12 md:pb-20">
        <div className="prose-wakey font-body text-paragraph">{children}</div>

        {/* Back to blog */}
        <div className="mt-12 pt-8 border-t border-text/20">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-small text-text/70 hover:text-text"
          >
            ← Back to all articles
          </Link>
        </div>
      </div>
    </article>
  );
}
