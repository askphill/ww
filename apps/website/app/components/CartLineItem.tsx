import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Image, Money, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from './Aside';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {CrossIcon} from '@wakey/ui';

type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 */
export function CartLineItem({
  layout,
  line,
}: {
  layout: CartLayout;
  line: CartLine;
}) {
  const {id, merchandise, quantity, cost, isOptimistic} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();

  return (
    <li className="relative rounded-card overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-[175px_1fr]">
        {/* Image */}
        {image && (
          <Link
            to={lineItemUrl}
            onClick={() => layout === 'aside' && close()}
            className="bg-skyblue overflow-hidden aspect-square flex items-center justify-center p-4 md:p-8"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              alt={title}
              data={image}
              width={150}
              height={150}
              loading="lazy"
              className="w-full h-auto"
            />
          </Link>
        )}

        {/* Details */}
        <div className="bg-white p-4 md:p-6 flex flex-col justify-between">
          <div>
            <Link
              to={lineItemUrl}
              onClick={() => layout === 'aside' && close()}
              prefetch="intent"
              className="text-paragraph md:text-s2 font-display pb-1 block pr-8"
            >
              {product.title}
            </Link>
            {/* Show variant options if not default */}
            {selectedOptions.length > 0 &&
              selectedOptions[0].value !== 'Default Title' && (
                <div className="text-small font-display opacity-70">
                  {selectedOptions.map((opt) => opt.value).join(' / ')}
                </div>
              )}
            <div className="text-paragraph font-display mt-2 flex gap-2">
              {cost?.compareAtAmountPerQuantity && (
                <span className="line-through opacity-50">
                  <Money data={cost.compareAtAmountPerQuantity} withoutTrailingZeros />
                </span>
              )}
              {cost?.totalAmount && <Money data={cost.totalAmount} withoutTrailingZeros />}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="mt-4">
            <QuantitySelector
              lineId={id}
              quantity={quantity}
              disabled={!!isOptimistic}
            />
          </div>
        </div>
      </div>

      {/* Remove button (X) - positioned top-right of card */}
      <div className="absolute top-3 right-3">
        <CartLineRemoveButton lineIds={[id]} disabled={!!isOptimistic} />
      </div>
    </li>
  );
}

function QuantitySelector({
  lineId,
  quantity,
  disabled,
}: {
  lineId: string;
  quantity: number;
  disabled: boolean;
}) {
  const prevQuantity = Math.max(0, quantity - 1);
  const nextQuantity = quantity + 1;

  return (
    <div className="flex gap-2 items-center">
      <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          disabled={quantity <= 1 || disabled}
          className="w-6 h-6 border border-text rounded-full flex items-center justify-center text-label hover-scale disabled:opacity-50"
          aria-label="Decrease quantity"
        >
          <span className="leading-none mt-[-2px]">-</span>
        </button>
      </CartLineUpdateButton>

      <span className="min-w-4 text-center text-label font-display">
        {quantity}
      </span>

      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          disabled={disabled}
          className="w-6 h-6 border border-text rounded-full flex items-center justify-center text-label hover-scale disabled:opacity-50"
          aria-label="Increase quantity"
        >
          <span className="leading-none mt-[-2px]">+</span>
        </button>
      </CartLineUpdateButton>
    </div>
  );
}

function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        disabled={disabled}
        type="submit"
        className="w-6 h-6 text-black/70 hover:text-black transition-colors disabled:opacity-50"
        aria-label="Remove item"
      >
        <CrossIcon className="w-full h-full" />
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
