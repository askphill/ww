import {Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {FREE_SHIPPING_THRESHOLD, shippingContent} from '~/content/shipping';

export type FreeShippingBarProps = {
  /** Current cart total in the base currency unit (e.g., euros) */
  currentTotal: number;
  /** Currency code for formatting */
  currencyCode?: CurrencyCode;
};

/**
 * A progress bar showing how close the user is to free shipping.
 * Threshold is configured in ~/content/shipping.ts
 */
export function FreeShippingBar({
  currentTotal,
  currencyCode = 'EUR',
}: FreeShippingBarProps) {
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
  const isFreeShipping = currentTotal >= FREE_SHIPPING_THRESHOLD;
  const progress = Math.min(
    100,
    (currentTotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  return (
    <div className="w-full">
      {/* Progress bar track */}
      <div className="h-2 bg-black/10 rounded-full overflow-hidden">
        {/* Progress bar fill */}
        <div
          className="h-full bg-softorange rounded-full transition-all duration-300 ease-out"
          style={{width: `${progress}%`}}
        />
      </div>

      {/* Message text */}
      <p className="mt-2 text-small text-text">
        {isFreeShipping ? (
          shippingContent.freeShippingAchieved
        ) : (
          <span className="whitespace-nowrap">
            <span className="font-display inline">
              <Money
                data={{
                  amount: String(Math.ceil(amountRemaining)),
                  currencyCode,
                }}
                withoutTrailingZeros
                as="span"
              />
            </span>{' '}
            {shippingContent.freeShippingProgress}
          </span>
        )}
      </p>
    </div>
  );
}
