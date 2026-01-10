import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {Money, type OptimisticCart} from '@shopify/hydrogen';
import {IdealIcon, KlarnaIcon, IcsIcon, VisaIcon} from '~/components/icons';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  return (
    <div className="bg-sand rounded-card p-4 md:p-8 mt-[-1px] flex-1 flex flex-col justify-between">
      {/* Message at top */}
      <div className="text-small font-display">
        Free shipping on orders over 50 euros
      </div>

      {/* Pricing at bottom */}
      <div>
        {/* Price breakdown */}
        <dl className="grid grid-cols-2 text-small md:text-label font-display gap-y-1">
          <dt>Subtotal</dt>
          <dd className="text-right">
            {cart?.cost?.subtotalAmount ? (
              <Money data={cart.cost.subtotalAmount} />
            ) : (
              '-'
            )}
          </dd>

          <dt>Shipping</dt>
          <dd className="text-right">Calculated at checkout</dd>

          <dt className="text-paragraph md:text-s2 font-bold pt-2">Total</dt>
          <dd className="text-paragraph md:text-s2 font-bold text-right pt-2">
            {cart?.cost?.totalAmount ? (
              <Money data={cart.cost.totalAmount} />
            ) : (
              '-'
            )}
          </dd>
        </dl>

        {/* Checkout button */}
        {cart?.checkoutUrl && (
          <a
            href={cart.checkoutUrl}
            className="mt-4 md:mt-6 w-full flex justify-center items-center bg-softorange text-text border border-black/10 rounded-full py-3 md:py-4 text-paragraph font-display hover-scale"
          >
            Checkout
          </a>
        )}

        {/* Payment icons */}
        <div className="flex justify-center gap-2 pt-4 md:pt-6">
          <IdealIcon className="h-4 w-auto text-text" />
          <KlarnaIcon className="h-4 w-auto text-text" />
          <IcsIcon className="h-4 w-auto text-text" />
          <VisaIcon className="h-4 w-auto text-text" />
        </div>
      </div>
    </div>
  );
}
