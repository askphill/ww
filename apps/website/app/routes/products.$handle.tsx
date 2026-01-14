import {useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  FAQ,
  ImageBanner,
  IngredientsSection,
  ProductDescription,
  ProductReviews,
  USPSection,
} from '~/components/sections';
import {ProductCarousel} from '~/components/ProductCarousel';
import {StickyAddToCart} from '~/components/StickyAddToCart';

const INGREDIENTS_LIST = `Sweet Almond Oil, Stearic Acid, Squalane, Coconut Oil, Candelilla Wax, Triethyl Citrate, Shea Butter, Tapioca Starch, Arrowroot Powder, Magnesium Hydroxide, Tocopherol (Vitamin E), Citrus Aurantium Bergamia (Bergamot) Fruit Oil, Lavendula Augustifolia (Lavender) Oil, Citrus Aurantium Dulcis Peel Oil (Sweet Orange) Expressed, Citrus Paradisi (Grapefruit) Oil, Eucalyptus Globulus (Eucalyptus) Leaf Oil.`;

const INGREDIENT_ITEMS = [
  {
    id: '1',
    name: '<em>Almond</em> Oil',
    image:
      'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/oil_75b0c2ec-a398-48df-b5a6-188dac0c7829.jpg?v=1761158550',
  },
  {
    id: '2',
    name: 'Sweet <em>Orange</em>',
    image:
      'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/citrus.jpg?v=1761157287',
  },
  {
    id: '3',
    name: '<em>Squalane</em>',
    image:
      'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/gekkie.jpg?v=1753632419',
  },
];

const PRODUCT_FAQ_ITEMS = [
  {
    id: 'sensitive-skin',
    title: 'Is it suitable for sensitive skin?',
    content:
      'Absolutely! Our baking soda-free formula is specifically designed to be gentle on all skin types, including sensitive skin. The natural ingredients soothe rather than irritate.',
  },
  {
    id: 'why-switch',
    title: 'Why should I switch to natural deodorant?',
    content:
      'Natural deodorant allows your body to function as it should while keeping you fresh. Unlike conventional antiperspirants that block sweat with aluminum, our formula uses natural ingredients to neutralize odor-causing bacteria.',
  },
  {
    id: 'adjustment',
    title: 'Is there an adjustment period?',
    content:
      'When transitioning from conventional antiperspirants, your body may need time to adjust. This typically takes under two weeks. During this time, your body is detoxing from aluminum-based products.',
  },
  {
    id: 'how-to-apply',
    title: 'How do I apply the deodorant?',
    content:
      'Apply 2-3 swipes to clean, dry underarms. A little goes a long way! Our formula glides on smoothly and absorbs quickly.',
  },
  {
    id: 'where-made',
    title: 'Where is it made?',
    content:
      'Our deodorant is handcrafted in small batches in the Netherlands, ensuring quality and freshness in every stick.',
  },
  {
    id: 'scent',
    title: 'What does Mighty Citrus smell like?',
    content:
      "Mighty Citrus captures the essence of morning sunshine with a refreshing blend of bergamot, sweet orange, and lavender. It's uplifting without being overpowering.",
  },
  {
    id: 'how-long',
    title: 'How long does one stick last?',
    content:
      'One stick typically lasts up to 3 months with daily use, keeping you effortlessly fresh and confident day after day.',
  },
  {
    id: 'packaging',
    title: 'Is the packaging eco-friendly?',
    content:
      "Yes! We're committed to sustainability. All our packaging is plastic-free and made from compostable materials.",
  },
];

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  const title = product?.seo?.title || product?.title || 'Product';
  const description =
    product?.seo?.description ||
    product?.description ||
    'Natural deodorant made with safe, effective ingredients. Free from aluminum and baking soda.';
  const variant = product?.selectedOrFirstAvailableVariant;
  const firstMediaImage = product?.media?.nodes?.find(
    (node): node is typeof node & {__typename: 'MediaImage'} =>
      node.__typename === 'MediaImage',
  );
  const image = variant?.image?.url || firstMediaImage?.image?.url;

  // Parse review data for aggregateRating
  const ratingValue = product?.reviewRating?.value
    ? parseFloat(product.reviewRating.value)
    : null;
  let reviewCount = 0;
  try {
    if (product?.reviews?.value) {
      const reviews = JSON.parse(product.reviews.value as string);
      reviewCount = Array.isArray(reviews) ? reviews.length : 0;
    }
  } catch {
    reviewCount = 0;
  }

  // Product JSON-LD schema
  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.title,
    description: product?.description,
    image: image,
    brand: {
      '@type': 'Brand',
      name: 'Wakey',
    },
    offers: {
      '@type': 'Offer',
      url: `https://www.wakey.care/products/${product?.handle}`,
      priceCurrency: variant?.price?.currencyCode || 'EUR',
      price: variant?.price?.amount,
      availability: variant?.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Wakey',
      },
    },
  };

  // Add aggregateRating if we have rating data
  if (ratingValue !== null && reviewCount > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue,
      reviewCount: reviewCount,
    };
  }

  // Breadcrumb JSON-LD schema: Home > Products > [Product Name]
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.wakey.care/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: 'https://www.wakey.care/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product?.title || 'Product',
        item: `https://www.wakey.care/products/${product?.handle}`,
      },
    ],
  };

  return [
    {title: `${title} | Wakey`},
    {name: 'description', content: description},
    {property: 'og:title', content: `${title} | Wakey`},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'product'},
    {property: 'og:url', content: `https://www.wakey.care/products/${product?.handle}`},
    {property: 'og:image', content: image},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: `${title} | Wakey`},
    {name: 'twitter:description', content: description},
    {name: 'twitter:image', content: image},
    {rel: 'canonical', href: `/products/${product?.handle}`},
    {'script:ld+json': productSchema},
    {'script:ld+json': breadcrumbSchema},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
      cache: storefront.CacheShort(),
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  return (
    <>
      {/* Media Carousel - full bleed */}
      <ProductCarousel media={product.media.nodes} />

      {/* Description Section - sand background */}
      <ProductDescription
        title="Why you love it"
        descriptionHtml={product.descriptionHtml}
        usps={[
          'Formulated without aluminum, baking soda, exfoliating acids or any other ingredients that are harmful.',
          'Plastic free compostable packaging.',
          'Vegan and cruelty-free, made without animal testing - only humans who willingly volunteer.',
        ]}
      />

      {/* USP Section */}
      <USPSection
        items={[
          {
            title: 'One stick lasts up to 3 months',
            body: 'keeping you effortlessly fresh and confident day after day.',
          },
          {
            title: 'Mighty Citrus',
            body: 'a refreshing blend of bergamot, sweet orange, and lavender.',
          },
          {
            title: 'Free shipping above €50',
            body: 'same-day shipping available on orders placed before 2pm.',
          },
        ]}
      />

      {/* Wakey Fact Banner */}
      <ImageBanner
        backgroundImage="https://cdn.shopify.com/s/files/1/0609/8747/4152/files/a_d092fd3c-b229-4fcc-8d2d-dae0250b6990.jpg"
        label="Wakey Fact"
        text="Most natural deodorants use <em>baking soda</em> which can cause <em>skin irritation</em>. We use safe, natural ingredients to <em>absorb wetness</em> and eliminate <em>odor-causing</em> bacteria."
      />

      {/* Ingredients Section */}
      <IngredientsSection
        title="Ingredients"
        ingredientsList={INGREDIENTS_LIST}
        items={INGREDIENT_ITEMS}
      />

      {/* Product FAQ Section */}
      <FAQ
        title="Wanna know more?"
        description="When you have a deodorant that works effectively and is made with natural, safe ingredients, you can feel confident and refreshed all day long."
        items={PRODUCT_FAQ_ITEMS}
      />

      {/* Product Reviews */}
      <ProductReviews
        productHandle={product.handle}
        videoUrl="https://cdn.shopify.com/videos/c/o/v/30bfb56ee7ec4ab2862899ee934d3be2.mov"
      />

      {/* Analytics */}
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />

      {/* Sticky Add to Cart */}
      <StickyAddToCart
        product={{
          id: product.id,
          title: product.title,
          handle: product.handle,
        }}
        selectedVariant={selectedVariant}
        subtitle={product.subtitle?.value}
        productImage={selectedVariant?.image?.url}
        analytics={{
          products: [
            {
              productGid: product.id,
              variantGid: selectedVariant?.id,
              name: product.title,
              variantName: selectedVariant?.title,
              brand: product.vendor,
              price: selectedVariant?.price.amount,
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    media(first: 10) {
      nodes {
        __typename
        ... on MediaImage {
          id
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          id
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
            width
            height
          }
        }
      }
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
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
