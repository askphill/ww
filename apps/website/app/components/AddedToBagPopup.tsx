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

      {/* Product info placeholder - will be styled in US-003 */}
      <div className="text-paragraph">{product.title}</div>
      {product.variantTitle && (
        <div className="text-small opacity-70">{product.variantTitle}</div>
      )}
    </div>
  );
}
