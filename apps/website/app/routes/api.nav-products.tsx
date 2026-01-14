import type {Route} from './+types/api.nav-products';

const NAV_PRODUCTS_QUERY = `#graphql
  query NavProducts {
    products(first: 10, query: "status:active") {
      nodes {
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
      }
    }
  }
`;

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const {products} = await storefront.query(NAV_PRODUCTS_QUERY);

  return {
    products:
      products?.nodes?.map((product) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.featuredImage?.url || null,
        subtitle: product.subtitle?.value || null,
      })) || [],
  };
}
