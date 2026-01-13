import type {Route} from './+types/api.reviews.$handle';

const REVIEWS_QUERY = `#graphql
  query ProductReviews($handle: String!) {
    product(handle: $handle) {
      reviewRating: metafield(namespace: "ask_phill", key: "review_average_rating") {
        value
      }
      reviews: metafield(namespace: "askphill", key: "reviews") {
        references(first: 25) {
          nodes {
            ... on Metaobject {
              fields {
                key
                value
              }
            }
          }
        }
      }
    }
  }
`;

interface ReviewMetaobject {
  fields: Array<{key: string; value?: string | null}>;
}

interface Review {
  name: string;
  rating: number;
  title: string;
  body: string;
}

function parseReviewMetaobject(metaobject: ReviewMetaobject): Review {
  const fields = metaobject.fields.reduce(
    (acc, field) => {
      acc[field.key] = field.value ?? '';
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    name: fields.name || '',
    rating: parseFloat(fields.rating) || 5,
    title: fields.title || '',
    body: fields.body || '',
  };
}

export async function loader({params, context}: Route.LoaderArgs) {
  const {storefront} = context;
  const {handle} = params;

  const cacheHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };

  if (!handle) {
    return new Response(
      JSON.stringify({reviews: [], averageRating: null, totalCount: 0}),
      {status: 200, headers: cacheHeaders},
    );
  }

  const {product} = await storefront.query(REVIEWS_QUERY, {
    variables: {handle},
  });

  if (!product) {
    return new Response(
      JSON.stringify({reviews: [], averageRating: null, totalCount: 0}),
      {status: 200, headers: cacheHeaders},
    );
  }

  const averageRating = product.reviewRating?.value
    ? parseFloat(product.reviewRating.value)
    : null;

  const reviewNodes = product.reviews?.references?.nodes || [];
  const reviews = reviewNodes.map(parseReviewMetaobject);

  return new Response(
    JSON.stringify({
      reviews,
      averageRating,
      totalCount: reviews.length,
    }),
    {status: 200, headers: cacheHeaders},
  );
}
