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
    <div>
      {/* Placeholder - styling will be added in US-002 */}
      <span>Added to your bag</span>
    </div>
  );
}
