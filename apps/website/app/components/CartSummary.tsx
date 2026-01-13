import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {Money, type OptimisticCart} from '@shopify/hydrogen';
import {
  IdealIcon,
  KlarnaIcon,
  VisaIcon,
  MastercardIcon,
  AmexIcon,
  ApplePayIcon,
  BancontactIcon,
  PayPalIcon,
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
      <FreeShippingBar currentTotal={totalAmount} />

      {/* Totals section */}
      <div className="space-y-2">
        {/* Total items row */}
        <div className="flex justify-between text-paragraph font-display">
          <span>Total items:</span>
          <span>{totalQuantity}</span>
        </div>

        {/* Total price row */}
        <div className="flex justify-between text-h3 font-display">
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
        <a
          href={cart.checkoutUrl}
          className="w-full flex justify-center items-center bg-black text-sand rounded-full py-4 text-s2 font-display uppercase tracking-wide hover:opacity-90 transition-opacity"
        >
          Checkout
        </a>
      )}

      {/* Payment icons */}
      <div className="flex flex-wrap justify-center gap-3">
        <VisaIcon className="h-5 w-auto text-text" />
        <MastercardIcon className="h-5 w-auto text-text" />
        <AmexIcon className="h-5 w-auto text-text" />
        <ApplePayIcon className="h-5 w-auto text-text" />
        <PayPalIcon className="h-5 w-auto text-text" />
        <KlarnaIcon className="h-5 w-auto text-text" />
        <IdealIcon className="h-5 w-auto text-text" />
        <BancontactIcon className="h-5 w-auto text-text" />
      </div>

      {/* Free shipping message */}
      <p className="text-small text-text text-center">
        Free standard shipping on orders over 80 euros
      </p>
    </div>
  );
}
