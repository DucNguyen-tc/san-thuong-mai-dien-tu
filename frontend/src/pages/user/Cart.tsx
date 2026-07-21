import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { mockCartItems } from '@/utils/mockData';
import { ShoppingCart, ArrowLeft, ListX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { items, updateQuantity, removeItem, addItem } = useCartStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Auto select all items when cart changes (naive implementation)
  useEffect(() => {
    setSelectedIds(items.map((item) => item.id));
  }, [items]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]); // deselect all
    } else {
      setSelectedIds(items.map((item) => item.id)); // select all
    }
  };

  const loadMockData = () => {
    mockCartItems.forEach((item) => addItem(item));
  };

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const subtotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const selectedCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const shippingFee = subtotal > 0 ? 0 : 0; // Free shipping for mock

  return (
    <main className="max-w-container-max mx-auto px-lg py-xl">
      <h1 className="font-headline-md text-headline-md mb-lg">
        Giỏ hàng của bạn ({items.length} sản phẩm)
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant">
          <ShoppingCart size={64} className="text-surface-dim mb-md" />
          <p className="text-body-md text-on-surface-variant mb-lg">
            Giỏ hàng của bạn đang trống
          </p>
          <div className="flex gap-md">
            <Link
              to="/"
              className="px-lg py-md bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Về trang chủ
            </Link>
            <button
              onClick={loadMockData}
              className="px-lg py-md border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-all"
            >
              Load dữ liệu giả lập
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg items-start">
          {/* Left Column: Cart Items (75%) */}
          <div className="lg:col-span-3 space-y-md">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-[auto_1fr_120px_140px_140px_auto] gap-md items-center px-lg py-md border-b border-outline-variant bg-surface-container-lowest font-bold text-on-surface-variant">
                <div className="w-10 flex justify-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length && items.length > 0}
                    onChange={handleToggleSelectAll}
                    className="w-5 h-5 text-primary border-outline-variant focus:ring-primary cursor-pointer rounded"
                  />
                </div>
                <div>Sản phẩm</div>
                <div className="text-center">Đơn giá</div>
                <div className="text-center">Số lượng</div>
                <div className="text-center">Số tiền</div>
                <div className="w-10"></div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-outline-variant">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.includes(item.id)}
                    onToggleSelect={handleToggleSelect}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </div>

            {/* Left Column Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-md py-md">
              <Link
                to="/"
                className="px-lg py-md border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-all flex items-center gap-sm"
              >
                <ArrowLeft size={18} />
                Tiếp tục mua sắm
              </Link>
              <button
                onClick={() => {
                  selectedIds.forEach((id) => removeItem(id));
                  setSelectedIds([]);
                }}
                disabled={selectedIds.length === 0}
                className="text-on-surface-variant hover:text-error font-label-md transition-colors flex items-center gap-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ListX size={18} />
                Xóa các mục đã chọn
              </button>
            </div>
          </div>

          {/* Right Column: Sidebar (25%) */}
          <div className="lg:col-span-1">
            <CartSummary
              selectedCount={selectedCount}
              subtotal={subtotal}
              shippingFee={shippingFee}
            />
          </div>
        </div>
      )}
    </main>
  );
}
