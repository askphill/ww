/**
 * Shipping content and configuration
 *
 * This file centralizes all shipping-related content and thresholds.
 * Update values here to change them across the entire site.
 */

/**
 * Free shipping threshold in euros
 */
export const FREE_SHIPPING_THRESHOLD = 50;

/**
 * Standard shipping cost in euros
 */
export const STANDARD_SHIPPING_COST = 3.95;

/**
 * Countries eligible for shipping
 */
export const SHIPPING_COUNTRIES = ['Netherlands', 'Belgium'] as const;

/**
 * Shipping content strings
 */
export const shippingContent = {
  /** USP text for product pages */
  uspTitle: `Free shipping above €${FREE_SHIPPING_THRESHOLD}`,
  uspBody: 'same-day shipping available on orders placed before 2pm.',

  /** FAQ answer about shipping costs */
  faqAnswer: `Shipping is €${STANDARD_SHIPPING_COST.toFixed(2).replace('.', ',')} for ${SHIPPING_COUNTRIES.join(' and ')}. Orders above €${FREE_SHIPPING_THRESHOLD} qualify for free shipping.`,

  /** Cart free shipping achieved message */
  freeShippingAchieved: 'Congrats! You get free standard shipping.',

  /** Cart free shipping progress message (use with amount remaining) */
  freeShippingProgress: 'away from free shipping',
} as const;
