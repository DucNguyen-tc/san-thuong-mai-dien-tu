import { Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CartItem } from '@/store/useCartStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { formatPrice } from '@/utils/formatters';

interface CartItemRowProps {
  item: CartItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({
  item,
  isSelected,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  const itemTotal = item.price * item.quantity;
  const attributeString = Object.entries(item.attributes || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_120px_140px_140px_auto] gap-md items-center p-lg group transition-colors hover:bg-surface-container-lowest">
      <div className="w-10 flex justify-center order-1 md:order-none">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="item-checkbox w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer rounded"
        />
      </div>
      
      <div className="flex items-center gap-md order-2 md:order-none">
        <img
          src={item.image_url || '/placeholder.png'}
          alt={item.name}
          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg bg-surface-container"
        />
        <div>
          <Link
            to={`/products/${item.product_id}`}
            className="font-label-md text-on-surface hover:text-primary transition-colors block"
          >
            {item.name}
          </Link>
          {attributeString && (
            <p className="text-caption text-on-surface-variant text-sm mt-1">
              {attributeString}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-center order-4 md:order-none hidden md:block">
        <span className="font-body-md text-on-surface-variant">
          {formatPrice(item.price)}
        </span>
      </div>
      
      <div className="order-5 md:order-none flex justify-center">
        <QuantitySelector
          value={item.quantity}
          onChange={(newQuantity) => onUpdateQuantity(item.id, newQuantity)}
          min={1}
          max={99}
        />
      </div>
      
      <div className="text-center order-3 md:order-none">
        <span className="font-label-md text-primary md:text-on-surface">
          {formatPrice(itemTotal)}
        </span>
      </div>
      
      <div className="order-6 md:order-none flex justify-end">
        <button
          onClick={() => onRemove(item.id)}
          className="text-on-surface-variant hover:text-error transition-colors p-sm rounded-full"
          aria-label="Xóa sản phẩm"
        >
          <Trash size={20} />
        </button>
      </div>
    </div>
  );
}
