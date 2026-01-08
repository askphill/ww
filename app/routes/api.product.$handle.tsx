import type {Route} from './+types/api.product.$handle';

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
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

  // Parse reviews array to get count
  let reviewCount = null;
  if (product?.reviews?.value) {
    try {
      const reviewsData = JSON.parse(product.reviews.value);
      // Reviews is an array of metaobject IDs
      reviewCount = Array.isArray(reviewsData) ? reviewsData.length : null;
    } catch (e) {
      // ignore parse errors
    }
  }

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
