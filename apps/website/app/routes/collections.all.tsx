import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import {PageHeader} from '~/components/sections/PageHeader';
import type {CollectionItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'All Products | Wakey'},
    {
      name: 'description',
      content:
        'Welcome to the Wakey collection, where natural ingredients meet joyful mornings. Discover our carefully crafted products designed to make your daily routine brighter.',
    },
    {property: 'og:title', content: 'All Products | Wakey'},
    {
      property: 'og:description',
      content:
        'Welcome to the Wakey collection, where natural ingredients meet joyful mornings. Discover our carefully crafted products designed to make your daily routine brighter.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: 'https://www.wakey.care/collections/all'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: 'All Products | Wakey'},
    {
      name: 'twitter:description',
      content:
        'Welcome to the Wakey collection, where natural ingredients meet joyful mornings.',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: 'https://www.wakey.care/collections/all',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
  ]);
  return {products};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="All Products"
        subtitle="Welcome to the Wakey collection, where natural ingredients meet joyful mornings. Discover our range of carefully crafted products designed to make your daily routine a little brighter, starting with our best-selling Natural Deodorant."
      />
      <section className="bg-sand p-4 pb-8 md:p-8 md:pb-12">
        <PaginatedResourceSection<CollectionItemFragment>
          connection={products}
          resourcesClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4"
        >
          {({node: product, index}) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          )}
        </PaginatedResourceSection>
      </section>
    </div>
  );
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;
