import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {Money, type OptimisticCart} from '@shopify/hydrogen';
import {
  VisaIcon,
  MastercardIcon,
  AmexIcon,
  PayPalIcon,
  IdealIcon,
  KlarnaIcon,
  Button,
  CheckoutIcon,
} from '@wakey/ui';
import {FreeShippingBar} from './FreeShippingBar';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  // Get total amount as number for free shipping bar
  const totalAmount = cart?.cost?.totalAmount?.amount
    ? parseFloat(cart.cost.totalAmount.amount)
    : 0;

  const totalQuantity = cart?.totalQuantity ?? 0;

  return (
    <div className="bg-white p-4 md:p-8 rounded-card flex flex-col gap-6">
      {/* Free shipping progress bar at top */}
      <FreeShippingBar
        currentTotal={totalAmount}
        currencyCode={cart?.cost?.totalAmount?.currencyCode}
      />

      {/* Totals section */}
      <div className="space-y-2">
        {/* Total items row */}
        <div className="flex justify-between text-base font-display">
          <span>Total items:</span>
          <span>{totalQuantity}</span>
        </div>

        {/* Total price row */}
        <div className="flex justify-between text-lg md:text-xl font-display">
          <span>Total:</span>
          <span>
            {cart?.cost?.totalAmount ? (
              <Money data={cart.cost.totalAmount} withoutTrailingZeros />
            ) : (
              '-'
            )}
          </span>
        </div>
      </div>

      {/* Checkout button - large, full width */}
      {cart?.checkoutUrl && (
        <Button
          href={cart.checkoutUrl}
          className="w-full"
          icon={<CheckoutIcon className="w-5 h-5" />}
        >
          Checkout
        </Button>
      )}

      {/* Payment icons */}
      <div className="flex flex-wrap justify-center gap-2">
        <VisaIcon className="h-6 md:h-5 w-auto" />
        <MastercardIcon className="h-6 md:h-5 w-auto" />
        <AmexIcon className="h-6 md:h-5 w-auto" />
        <PayPalIcon className="h-6 md:h-5 w-auto" />
        <IdealIcon className="h-6 md:h-5 w-auto" />
        <KlarnaIcon className="h-6 md:h-5 w-auto" />
      </div>

      {/* Free shipping message */}
      <p className="text-small text-text text-center">
        Free standard shipping on orders over 80 euros
      </p>
    </div>
  );
}
