import type {Route} from './+types/blog._index';
import {BlogCard} from '@wakey/ui';
import {getAllArticles} from '~/content/blog';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Blog | Wakey'},
    {
      name: 'description',
      content:
        'Read the latest articles about natural deodorant, sustainability, and morning routines.',
    },
  ];
};

export async function loader() {
  const articles = getAllArticles();
  return {articles};
}

export default function BlogIndex({loaderData}: Route.ComponentProps) {
  const {articles} = loaderData;

  return (
    <div className="bg-sand">
      <header className="pt-24 px-4 pb-4 md:pt-36 md:px-8 md:pb-6">
        <h1 className="text-h1 font-display">Blog</h1>
        <p className="mt-4 max-w-prose font-display text-paragraph text-text/70">
          Stories, tips, and insights about natural personal care and
          sustainable living.
        </p>
      </header>
      <div className="px-4 pt-8 pb-8 md:px-8 md:pt-12 md:pb-12">
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {articles.map((article, index) => {
            const publishedAt = new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }).format(new Date(article.publishedAt));

            return (
              <BlogCard
                key={article.slug}
                to={`/blog/${article.slug}`}
                image={
                  article.featuredImage
                    ? {
                        src: article.featuredImage.url,
                        alt: article.featuredImage.alt,
                      }
                    : undefined
                }
                title={article.title}
                description={article.description}
                date={publishedAt}
                loading={index < 3 ? 'eager' : 'lazy'}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
