import type {Storefront} from '@shopify/hydrogen';
import {z} from 'zod';
import {safeJsonParse} from '~/lib/parse';
import type {TooltipProduct} from '~/lib/tooltip-product';

interface StorefrontProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage: {url: string; altText: string | null} | null;
  subtitle: {value: string | null} | null;
  reviewRating: {value: string | null} | null;
  reviews: {value: string | null} | null;
  variants: {
    nodes: Array<{
      subtitle: {value: string | null} | null;
      selectedOptions: Array<{name: string; value: string}>;
    }>;
  } | null;
}

interface StorefrontQueryResult {
  [key: string]: StorefrontProduct | null;
}

const TOOLTIP_PRODUCT_FRAGMENT = `
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
  variants(first: 1) {
    nodes {
      subtitle: metafield(namespace: "ask_phill", key: "subtitle") {
        value
      }
      selectedOptions {
        name
        value
      }
    }
  }
`;

const ReviewsSchema = z.array(z.string());

function normalizeTooltipProduct(product: StorefrontProduct): TooltipProduct {
  const reviewsData = safeJsonParse(product.reviews?.value, ReviewsSchema);
  const reviewCount = reviewsData?.length ?? null;

  let subtitle = product.subtitle?.value || null;
  if (!subtitle && product.variants?.nodes?.[0]) {
    const variant = product.variants.nodes[0];
    subtitle = variant.subtitle?.value || null;

    if (!subtitle && variant.selectedOptions?.length > 0) {
      const option = variant.selectedOptions[0];
      if (option.value && option.value !== 'Default Title') {
        subtitle = option.value;
      }
    }
  }

  return {
    title: product.title,
    handle: product.handle,
    image: product.featuredImage?.url || '',
    subtitle,
    reviewRating: product.reviewRating?.value
      ? parseFloat(product.reviewRating.value)
      : null,
    reviewCount,
  };
}

export async function getTooltipProducts(
  storefront: Storefront,
  handles: string[],
): Promise<Record<string, TooltipProduct | null>> {
  const uniqueHandles = Array.from(
    new Set(handles.filter((handle) => handle && handle.trim().length > 0)),
  );

  if (uniqueHandles.length === 0) {
    return {};
  }

  const variables: Record<string, string> = {};
  const productSelections = uniqueHandles.map((handle, index) => {
    const variableName = `handle${index}`;
    variables[variableName] = handle;
    return `product${index}: product(handle: $${variableName}) {${TOOLTIP_PRODUCT_FRAGMENT}}`;
  });

  const query = `#graphql
    query TooltipProducts(${uniqueHandles
      .map((_, index) => `$handle${index}: String!`)
      .join(', ')}) {
      ${productSelections.join('\n')}
    }
  `;

  const data = await storefront.query<StorefrontQueryResult>(query, {
    variables,
    cache: storefront.CacheLong(),
  });

  return uniqueHandles.reduce<Record<string, TooltipProduct | null>>(
    (acc, handle, index) => {
      const product = data[`product${index}`];
      acc[handle] = product ? normalizeTooltipProduct(product) : null;
      return acc;
    },
    {},
  );
}
