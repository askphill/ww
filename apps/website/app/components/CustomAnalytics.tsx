import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';

/**
 * Custom analytics component that subscribes to Hydrogen analytics events
 * and sends them to Shopify Pixel (web pixels).
 *
 * This component should be rendered inside Analytics.Provider.
 *
 * Events handled:
 * - page_viewed: Fires on every navigation
 * - product_viewed: Fires when Analytics.ProductView renders
 * - collection_viewed: Fires when Analytics.CollectionView renders
 * - search_submitted: Fires when Analytics.SearchView renders
 * - cart_viewed: Fires when cart drawer/page is opened
 * - cart_updated: Fires when cart lines change (add/remove/update)
 */
export function CustomAnalytics() {
  const {subscribe, register} = useAnalytics();
  const {ready} = register('CustomAnalytics');

  useEffect(() => {
    // Subscribe to page views
    subscribe('page_viewed', (data) => {
      // Shopify Pixel automatically receives this via Analytics.Provider
      // Add custom tracking here if needed (e.g., GA4, Meta Pixel)
      console.debug('[Analytics] page_viewed', data.url);
    });

    // Subscribe to product views
    subscribe('product_viewed', (data) => {
      console.debug('[Analytics] product_viewed', data.products);
    });

    // Subscribe to collection views
    subscribe('collection_viewed', (data) => {
      console.debug('[Analytics] collection_viewed', data.collection);
    });

    // Subscribe to search submissions (custom event)
    subscribe('custom_search_submitted', (data) => {
      console.debug('[Analytics] search_submitted', data);
    });

    // Subscribe to cart views
    subscribe('cart_viewed', (data) => {
      console.debug('[Analytics] cart_viewed', data.cart?.id);
    });

    // Subscribe to cart updates (add to cart, remove, quantity change)
    subscribe('cart_updated', (data) => {
      console.debug('[Analytics] cart_updated', {
        cartId: data.cart?.id,
        totalQuantity: data.cart?.totalQuantity,
        prevTotalQuantity: data.prevCart?.totalQuantity,
      });

      // Detect add to cart by comparing cart states
      const prevQuantity = data.prevCart?.totalQuantity ?? 0;
      const newQuantity = data.cart?.totalQuantity ?? 0;

      if (newQuantity > prevQuantity) {
        console.debug('[Analytics] Items added to cart');
      } else if (newQuantity < prevQuantity) {
        console.debug('[Analytics] Items removed from cart');
      }
    });

    // Signal that this analytics integration is ready
    ready();
  }, [subscribe, ready]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to publish custom events through the analytics system.
 * Use this in components that need to track custom interactions.
 *
 * Example:
 * ```tsx
 * const {publish} = useCustomAnalytics();
 * publish('newsletter_signup', { email: 'user@example.com' });
 * ```
 */
export function useCustomAnalytics() {
  const {publish, shop, cart, prevCart} = useAnalytics();

  return {
    publish: (eventName: string, payload: Record<string, unknown>) => {
      publish(eventName as 'custom_event', {
        shop,
        cart,
        prevCart,
        ...payload,
      });
    },
  };
}
