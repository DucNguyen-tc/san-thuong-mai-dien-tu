import { useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { createOrder } from "@/services/orderService";
import { createPayment } from "@/services/paymentService";
import type { CheckoutFormData, PaymentMethodType } from "@/types/cart";

export default function Checkout() {
  const { items: allItems, removeItem } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedIds = location.state?.selectedIds || [];
  const items =
    selectedIds.length > 0
      ? allItems.filter((item) => selectedIds.includes(item.id))
      : allItems;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("cod");
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shippingFee = subtotal > 500000 ? 0 : subtotal > 0 ? 30000 : 0;
  const discount = 0;

  const handleFormUpdate = useCallback(
    (isValid: boolean, data: CheckoutFormData | null) => {
      setIsFormValid(isValid);
      setFormData(data);
    },
    [],
  );

  const handleSubmitOrder = async () => {
    if (!isFormValid || !formData || items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Ánh xạ phương thức thanh toán chuẩn Backend
      const backendPaymentMethod =
        paymentMethod === "vnpay"
          ? "VNPAY"
          : paymentMethod === "momo"
            ? "MOMO"
            : "CASH";

      const shippingAddress = `${formData.fullName} - ${formData.phone} - ${formData.detailAddress}`;
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));

      // 2. Tạo đơn hàng thông qua Order Service (Microservices API Gateway)
      const order = await createOrder({
        shipping_address: shippingAddress,
        payment_method: backendPaymentMethod,
        items: orderItems,
      });

      // 3. Khởi tạo thanh toán thông qua Payment Service
      const paymentRecord = await createPayment({
        order_id: order.id,
        amount: Number(order.total_amount),
        method: backendPaymentMethod,
      });

      // 4. Chỉ xóa các món đã đặt hàng khỏi giỏ hàng
      setIsOrderCompleted(true);
      for (const item of items) {
        try {
          await removeItem(item.id);
        } catch (err) {
          console.error(`Không thể xóa item ${item.id} khỏi giỏ hàng:`, err);
        }
      }

      // 5. Điều hướng theo phương thức thanh toán
      if (backendPaymentMethod === "CASH") {
        navigate(
          `/payment-result?status=success&orderId=${order.id}&method=CASH`,
        );
      } else if (paymentRecord.payment_url) {
        // Chuyển hướng sang cổng VNPAY / MoMo Sandbox (hoặc Simulator)
        window.location.href = paymentRecord.payment_url;
      } else {
        navigate(
          `/payment-result?status=success&orderId=${order.id}&method=${backendPaymentMethod}`,
        );
      }
    } catch (error: any) {
      console.error("Lỗi khi thanh toán:", error);
      const msg =
        error.response?.data?.message ||
        "Có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại!";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  if (isOrderCompleted) {
    return (
      <main className="max-w-container-max mx-auto px-lg py-xl text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Đang chuyển hướng...</h2>
        <p className="text-gray-500 text-sm">
          Vui lòng chờ trong giây lát để kết nối an toàn tới cổng thanh toán.
        </p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-container-max mx-auto px-lg py-xl text-center">
        <h2 className="text-headline-md font-bold mb-md">
          Không có sản phẩm để thanh toán
        </h2>
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

      {errorMessage && (
        <div className="mb-lg p-md bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* LEFT COLUMN (65%) */}
        <div className="lg:col-span-8 space-y-lg">
          <ShippingForm onFormUpdate={handleFormUpdate} />
          <PaymentMethodSelector
            selected={paymentMethod}
            onChange={setPaymentMethod}
          />
        </div>

        {/* RIGHT COLUMN (35%) */}
        <div className="lg:col-span-4">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            discount={discount}
            isValid={isFormValid && !isSubmitting}
            onSubmit={handleSubmitOrder}
          />
        </div>
      </div>
    </main>
  );
}
