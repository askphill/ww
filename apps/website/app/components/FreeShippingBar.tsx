export type FreeShippingBarProps = {
  /** Current cart total in the base currency unit (e.g., euros) */
  currentTotal: number;
};

const FREE_SHIPPING_THRESHOLD = 80;

/**
 * A progress bar showing how close the user is to free shipping.
 * Hardcoded threshold at 80 euros.
 */
export function FreeShippingBar({currentTotal}: FreeShippingBarProps) {
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
  const isFreeShipping = currentTotal >= FREE_SHIPPING_THRESHOLD;
  const progress = Math.min(100, (currentTotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="w-full">
      {/* Progress bar track */}
      <div className="h-2 bg-sand/30 rounded-full overflow-hidden">
        {/* Progress bar fill */}
        <div
          className="h-full bg-softorange rounded-full transition-all duration-300 ease-out"
          style={{width: `${progress}%`}}
        />
      </div>

      {/* Message text */}
      <p className="mt-2 text-small text-sand">
        {isFreeShipping ? (
          'Congrats! You get free standard shipping.'
        ) : (
          <>
            <span className="font-display">{amountRemaining.toFixed(0)} euros</span>{' '}
            away from free shipping
          </>
        )}
      </p>
    </div>
  );
}
