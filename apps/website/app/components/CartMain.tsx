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

  // Page layout: 2-column grid on desktop
  if (layout === 'page') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 md:gap-8">
        {hasItems ? (
          <>
            {/* Line items - left column on desktop */}
            <div>
              <ul className="space-y-4">
                {(cart?.lines?.nodes ?? []).map((line) => (
                  <CartLineItem key={line.id} line={line} layout={layout} />
                ))}
              </ul>
            </div>
            {/* Summary - right column on desktop */}
            <div className="md:sticky md:top-8 md:self-start">
              <CartSummary cart={cart} layout={layout} />
            </div>
          </>
        ) : (
          <CartEmpty layout={layout} />
        )}
      </div>
    );
  }

  // Aside layout: flex column (original behavior for cart drawer)
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {hasItems ? (
        <>
          {/* Line items - scrollable, doesn't expand */}
          <div className="overflow-y-auto flex-shrink-0 max-h-[50%]">
            <ul>
              {(cart?.lines?.nodes ?? []).map((line) => (
                <CartLineItem key={line.id} line={line} layout={layout} />
              ))}
            </ul>
          </div>
          {/* Summary - expands to fill remaining space */}
          <CartSummary cart={cart} layout={layout} />
        </>
      ) : (
        <CartEmpty layout={layout} />
      )}
    </div>
  );
}

function CartEmpty({layout}: {layout: CartLayout}) {
  const {close} = useAside();

  return (
    <div className="bg-sand p-4 md:p-6 mt-[-1px] flex-1">
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
