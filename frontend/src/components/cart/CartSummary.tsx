import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@/utils/formatters';

interface CartSummaryProps {
  selectedCount: number;
  subtotal: number;
  shippingFee: number;
}

export function CartSummary({
  selectedCount,
  subtotal,
  shippingFee,
}: CartSummaryProps) {
  const navigate = useNavigate();
  const total = subtotal + shippingFee;

  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant sticky top-[100px] space-y-lg shadow-sm">
      <h3 className="font-label-md text-label-md border-b border-outline-variant pb-md mb-md">
        Tóm tắt đơn hàng
      </h3>

      <div className="space-y-md">
        <div className="flex justify-between font-body-md">
          <span className="text-on-surface-variant">Sản phẩm đã chọn</span>
          <span className="font-bold">{selectedCount}</span>
        </div>
        <div className="flex justify-between font-body-md">
          <span className="text-on-surface-variant">Tạm tính</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between font-body-md">
          <span className="text-on-surface-variant">Phí vận chuyển</span>
          <span className="text-green-600">
            {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
          </span>
        </div>
      </div>

      <div className="pt-md border-t border-outline-variant">
        <div className="flex justify-between items-end mb-md">
          <span className="font-label-md text-on-surface">Tổng thanh toán</span>
          <div className="text-right">
            <span className="font-headline-md text-primary block">
              {formatPrice(total)}
            </span>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              (Đã bao gồm VAT)
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        disabled={selectedCount === 0}
        className="w-full py-md bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Tiếp tục thanh toán
        <ArrowRight size={18} />
      </button>

      <div className="p-md bg-surface-container-low rounded-lg border border-outline-variant border-dashed">
        <div className="flex items-start gap-sm">
          <ShieldCheck size={20} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-[12px] font-bold">Cam kết bảo mật</p>
            <p className="text-[11px] text-on-surface-variant leading-tight">
              Mọi giao dịch được mã hóa và bảo mật tuyệt đối.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
