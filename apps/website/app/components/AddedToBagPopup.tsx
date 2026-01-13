import {CrossIcon} from '@wakey/ui';

interface AddedToBagPopupProduct {
  image: string | null;
  title: string;
  variantTitle: string | null;
  price: string;
  currencyCode: string;
}

interface AddedToBagPopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: AddedToBagPopupProduct | null;
  cartCount: number;
  checkoutUrl: string;
}

export function AddedToBagPopup({
  isOpen,
  onClose,
  product,
  cartCount,
  checkoutUrl,
}: AddedToBagPopupProps) {
  if (!isOpen || !product) {
    return null;
  }

  return (
    <div className="bg-black text-sand rounded-card p-6">
      {/* Header with title and close button */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-s2 font-display">Added to your bag</span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-sand hover:opacity-70 transition-opacity"
        >
          <CrossIcon className="w-8 h-8" />
        </button>
      </div>

      {/* Product info with image and details */}
      <div className="flex gap-4">
        {/* Product thumbnail - square, ~80px */}
        {product.image && (
          <div className="shrink-0">
            <img
              src={product.image}
              alt={product.title}
              className="w-20 h-20 object-cover rounded"
            />
          </div>
        )}

        {/* Product details */}
        <div className="flex flex-col justify-center">
          <span className="text-paragraph font-display">{product.title}</span>
          {product.variantTitle && (
            <span className="text-small opacity-70">{product.variantTitle}</span>
          )}
          <span className="text-paragraph mt-1">
            {product.price} {product.currencyCode}
          </span>
        </div>
      </div>
    </div>
  );
}
