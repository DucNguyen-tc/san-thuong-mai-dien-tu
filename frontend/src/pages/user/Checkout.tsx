import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import type { CheckoutFormData, PaymentMethodType } from '@/types/cart';
import toast from 'react-hot-toast';


export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 0 : 0;
  const discount = 500000; // Mock discount

  const handleFormUpdate = (isValid: boolean, data: CheckoutFormData | null) => {
    setIsFormValid(isValid);
    setFormData(data);
  };

  const handleSubmitOrder = () => {
    if (!isFormValid || !formData || items.length === 0) return;

    const orderData = {
      items,
      shipping: formData,
      payment: paymentMethod,
      total: subtotal + shippingFee - discount,
    };

    console.log('--- ĐẶT HÀNG THÀNH CÔNG ---', orderData);
    toast.success('Đặt hàng thành công! Đang chuyển về trang chủ.');
    clearCart();
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <main className="max-w-container-max mx-auto px-lg py-xl text-center">
        <h2 className="text-headline-md font-bold mb-md">Không có sản phẩm để thanh toán</h2>
        <Link to="/" className="text-primary hover:underline">
          Quay lại mua sắm
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-container-max mx-auto px-lg py-lg">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-xs text-caption text-on-surface-variant mb-lg">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} />
        <Link to="/cart" className="hover:text-primary transition-colors">
          Giỏ hàng
        </Link>
        <ChevronRight size={16} />
        <span className="text-on-surface font-bold">Thanh toán</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* LEFT COLUMN (65%) */}
        <div className="lg:col-span-8 space-y-lg">
          <ShippingForm onFormUpdate={handleFormUpdate} />
          <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
        </div>

        {/* RIGHT COLUMN (35%) */}
        <div className="lg:col-span-4">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            discount={discount}
            isValid={isFormValid}
            onSubmit={handleSubmitOrder}
          />
        </div>
      </div>
    </main>
  );
}
