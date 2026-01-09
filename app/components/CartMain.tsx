import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const hasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;

  return (
    <div className="flex flex-col flex-1">
      {/* Line items - scrollable area */}
      <div className="flex-shrink overflow-y-auto">
        {hasItems ? (
          <ul>
            {(cart?.lines?.nodes ?? []).map((line) => (
              <CartLineItem key={line.id} line={line} layout={layout} />
            ))}
          </ul>
        ) : (
          <CartEmpty layout={layout} />
        )}
      </div>

      {/* Summary - sticky at bottom */}
      {hasItems && <CartSummary cart={cart} layout={layout} />}
    </div>
  );
}

function CartEmpty({layout}: {layout: CartLayout}) {
  const {close} = useAside();

  return (
    <div className="bg-sand rounded-card p-4 md:p-6 mt-[-1px]">
      <h3 className="text-h3 font-display pb-4 md:pb-6">
        Wakey Wakey, there are no products in your cart yet.
      </h3>
      <Link
        to="/"
        onClick={() => layout === 'aside' && close()}
        className="underline text-paragraph font-display"
        prefetch="viewport"
      >
        Go shopping
      </Link>
    </div>
  );
}
