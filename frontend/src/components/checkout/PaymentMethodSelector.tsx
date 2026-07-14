import { CreditCard, Wallet, Truck } from 'lucide-react';
import type { PaymentMethodType } from '@/types/cart';

interface PaymentMethodSelectorProps {
  selected: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({ selected, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant">
      <div className="flex items-center gap-sm mb-lg">
        <CreditCard className="text-primary" size={24} />
        <h2 className="font-headline-md text-headline-md">Phương thức thanh toán</h2>
      </div>

      <div className="space-y-md">
        <label className="flex items-center gap-md p-md border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors group">
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={selected === 'cod'}
            onChange={() => onChange('cod')}
            className="w-5 h-5 text-primary focus:ring-primary"
          />
          <div className="flex items-center gap-sm flex-1">
            <Truck className="text-on-surface-variant group-hover:text-primary transition-colors" />
            <div>
              <p className="font-label-md">Thanh toán khi nhận hàng (COD)</p>
              <p className="text-caption text-on-surface-variant">Kiểm tra hàng trước khi thanh toán</p>
            </div>
          </div>
        </label>

        <label className="flex items-center gap-md p-md border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors group">
          <input
            type="radio"
            name="payment"
            value="vnpay"
            checked={selected === 'vnpay'}
            onChange={() => onChange('vnpay')}
            className="w-5 h-5 text-primary focus:ring-primary"
          />
          <div className="flex items-center gap-sm flex-1">
            <CreditCard className="text-[#005BAA]" />
            <div>
              <p className="font-label-md">Thanh toán qua VNPay</p>
              <p className="text-caption text-on-surface-variant">Thanh toán qua ứng dụng ngân hàng, QR Code</p>
            </div>
          </div>
        </label>

        <label className="flex items-center gap-md p-md border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors group">
          <input
            type="radio"
            name="payment"
            value="momo"
            checked={selected === 'momo'}
            onChange={() => onChange('momo')}
            className="w-5 h-5 text-primary focus:ring-primary"
          />
          <div className="flex items-center gap-sm flex-1">
            <Wallet className="text-[#AF146B]" />
            <div>
              <p className="font-label-md">Thanh toán qua MoMo</p>
              <p className="text-caption text-on-surface-variant">Nhanh chóng, tiện lợi, hoàn tiền 5%</p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
