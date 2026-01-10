import type {Route} from './+types/blog.$slug';
import {BlogArticle} from '~/components/sections';
import {getArticleBySlug, articles} from '~/content/blog';

export const meta: Route.MetaFunction = ({params}) => {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) {
    return [{title: 'Article Not Found | Wakey'}];
  }
  return [
    {title: `${article.title} | Wakey`},
    {name: 'description', content: article.description},
  ];
};

export async function loader({params}: Route.LoaderArgs) {
  const {slug} = params;

  if (!slug) {
    throw new Response('Not found', {status: 404});
  }

  const article = getArticleBySlug(slug);

  if (!article) {
    throw new Response('Not found', {status: 404});
  }

  return {slug};
}

export default function BlogPost({loaderData}: Route.ComponentProps) {
  const {slug} = loaderData;
  const article = getArticleBySlug(slug);

  if (!article) {
    return <div>Article not found</div>;
  }

  const {frontmatter, Component} = article;

  return (
    <BlogArticle frontmatter={frontmatter}>
      <Component />
    </BlogArticle>
  );
}
