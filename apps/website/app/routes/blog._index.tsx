import {Link} from 'react-router';
import type {Route} from './+types/blog._index';
import {getAllArticles} from '~/content/blog';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Blog | Wakey'},
    {
      name: 'description',
      content: 'Read the latest articles about natural deodorant, sustainability, and morning routines.',
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
        <p className="mt-4 max-w-prose font-body text-paragraph text-text/70">
          Stories, tips, and insights about natural personal care and sustainable living.
        </p>
      </header>
      <div className="px-4 pt-8 pb-8 md:px-8 md:pt-12 md:pb-12">
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({
  article,
}: {
  article: ReturnType<typeof getAllArticles>[number];
}) {
  const publishedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <article className="flex flex-col">
      <Link to={`/blog/${article.slug}`} className="block">
        {article.featuredImage && (
          <img
            src={article.featuredImage.url}
            alt={article.featuredImage.alt || article.title}
            className="w-full object-cover"
            width={article.featuredImage.width}
            height={article.featuredImage.height}
            loading="lazy"
            style={{aspectRatio: '9/5'}}
          />
        )}
        <div className="pt-2 pb-8 flex flex-col gap-3 md:pt-3">
          <h2 className="text-s1 font-display">{article.title}</h2>
          <div className="flex items-center gap-2 text-small text-text/60">
            <time dateTime={article.publishedAt}>{publishedAt}</time>
          </div>
          <p className="text-paragraph text-text/75 font-body">
            {article.description}
          </p>
        </div>
      </Link>
    </article>
  );
}
