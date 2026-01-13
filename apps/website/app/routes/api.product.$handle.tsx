import {z} from 'zod';
import type {Route} from './+types/api.product.$handle';
import {safeJsonParse} from '~/lib/parse';

const PRODUCT_QUERY = `#graphql
  query ApiProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage {
        url
        altText
      }
      subtitle: metafield(namespace: "ask_phill", key: "subtitle") {
        value
      }
      reviewRating: metafield(namespace: "ask_phill", key: "review_average_rating") {
        value
      }
      reviews: metafield(namespace: "askphill", key: "reviews") {
        value
      }
      variants(first: 10) {
        nodes {
          id
          title
          selectedOptions {
            name
            value
          }
          subtitle: metafield(namespace: "ask_phill", key: "subtitle") {
            value
          }
        }
      }
    }
  }
`;

export async function loader({params, context}: Route.LoaderArgs) {
  const {storefront} = context;
  const {handle} = params;

  if (!handle) {
    return {product: null};
  }

  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle},
  });

  // Parse reviews array to get count using safe JSON parsing
  // Reviews metafield contains an array of metaobject IDs (strings like "gid://shopify/Metaobject/123")
  const ReviewsSchema = z.array(z.string());
  const reviewsData = safeJsonParse(product?.reviews?.value, ReviewsSchema);
  const reviewCount = reviewsData?.length ?? null;

  // Get subtitle from product metafield, variant metafield, or variant selected option
  let subtitle = product?.subtitle?.value || null;

  if (!subtitle && product?.variants?.nodes?.[0]) {
    const variant = product.variants.nodes[0];
    subtitle = variant.subtitle?.value || null;

    // Use variant selected option value if not "Default Title"
    if (!subtitle && variant.selectedOptions?.length > 0) {
      const option = variant.selectedOptions[0];
      if (option.value && option.value !== 'Default Title') {
        subtitle = option.value;
      }
    }
  }

  return {
    product: product ? {
      id: product.id,
      title: product.title,
      handle: product.handle,
      featuredImage: product.featuredImage,
      subtitle,
      reviewRating: product.reviewRating?.value ? parseFloat(product.reviewRating.value) : null,
      reviewCount,
    } : null,
  };
}
