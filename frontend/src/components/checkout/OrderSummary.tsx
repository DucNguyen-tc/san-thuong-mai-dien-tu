import { ShieldCheck } from 'lucide-react';
import type { CartItem } from '@/store/useCartStore';
import { formatPrice } from '@/utils/formatters';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount?: number;
  isValid: boolean;
  onSubmit: () => void;
}

export function OrderSummary({
  items,
  subtotal,
  shippingFee,
  discount = 0,
  isValid,
  onSubmit,
}: OrderSummaryProps) {
  const total = subtotal + shippingFee - discount;

  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant sticky top-[100px]">
      <h3 className="font-headline-md text-headline-md border-b border-outline-variant pb-md mb-md">
        Chi tiết đơn hàng
      </h3>

      {/* Product List */}
      <div className="space-y-md mb-lg max-h-[300px] overflow-y-auto pr-sm">
        {items.map((item) => {
          const attributeString = Object.entries(item.attributes || {})
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ');

          return (
            <div key={item.id} className="flex gap-md">
              <img
                className="w-16 h-16 object-cover rounded-lg bg-surface-container"
                src={item.image_url || '/placeholder.png'}
                alt={item.name}
              />
              <div className="flex-1">
                <p className="text-label-md line-clamp-1">{item.name}</p>
                <p className="text-caption text-on-surface-variant">
                  SL: {item.quantity} {attributeString ? `| ${attributeString}` : ''}
                </p>
                <p className="text-label-md text-primary">{formatPrice(item.price)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-md pt-md border-t border-outline-variant">
        <div className="flex justify-between text-body-md">
          <span className="text-on-surface-variant">Tổng tiền hàng</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-body-md">
          <span className="text-on-surface-variant">Phí vận chuyển</span>
          <span className="text-green-600">
            {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-body-md">
            <span className="text-on-surface-variant">Giảm giá</span>
            <span className="text-error">-{formatPrice(discount)}</span>
          </div>
        )}

        <div className="pt-md border-t border-outline-variant flex justify-between items-baseline">
          <span className="font-label-md">Tổng thanh toán</span>
          <div className="text-right">
            <p className="text-[28px] font-bold text-primary leading-none">
              {formatPrice(total)}
            </p>
            <p className="text-caption text-on-surface-variant mt-1">
              (Đã bao gồm VAT)
            </p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={!isValid || items.length === 0}
          className="w-full py-md bg-primary text-on-primary text-headline-md font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 uppercase tracking-wide mt-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ĐẶT HÀNG
        </button>

        {/* Side Notice */}
        <div className="p-md bg-surface-container-low rounded-lg border border-outline-variant border-dashed flex items-start gap-sm">
          <ShieldCheck className="text-primary flex-shrink-0" size={24} />
          <p className="text-caption text-on-surface-variant">
            Thông tin thanh toán của bạn được bảo mật tuyệt đối.
          </p>
        </div>
      </div>
    </div>
  );
}
