import type { OrderCardItem } from '@/types/aiChat';

interface ChatOrderCardListProps {
  orders: OrderCardItem[];
  onNavigate?: (url: string) => void;
}

const FALLBACK_IMAGE = 'https://placehold.co/400x400/f3f4f6/6b7280?text=V-Shop';

export default function ChatOrderCardList({ orders, onNavigate }: ChatOrderCardListProps) {
  if (!orders || orders.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2.5 w-full">
      {orders.map((ord) => {
        const isCancelled = ord.status === 'CANCELLED';
        const isCompleted = ord.status === 'COMPLETED';
        const isShipping = ord.status === 'SHIPPING';

        const badgeBg = isCancelled
          ? 'bg-red-50 text-red-600 border-red-200'
          : isCompleted
          ? 'bg-green-50 text-green-700 border-green-200'
          : isShipping
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-blue-50 text-blue-700 border-blue-200';

        return (
          <div
            key={ord.id}
            className="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-2.5 shadow-xs transition-all text-xs"
          >
            {/* Header: Mã đơn + Ngày + Status Badge */}
            <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-gray-100">
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-bold text-gray-900 truncate">#{ord.order_number}</span>
                {ord.created_at && (
                  <span className="text-[10px] text-gray-400 shrink-0">({ord.created_at})</span>
                )}
              </div>
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                {ord.status_text}
              </span>
            </div>

            {/* Danh sách sản phẩm: gọn gàng từng dòng */}
            <div className="flex flex-col gap-1.5">
              {ord.items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.product_id && onNavigate) {
                      onNavigate(`/product/${item.product_id}`);
                    }
                  }}
                  className={`flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors ${
                    item.product_id ? 'cursor-pointer group' : ''
                  }`}
                >
                  <div className="w-9 h-9 shrink-0 rounded-md overflow-hidden bg-gray-50 border border-gray-200">
                    <img
                      src={item.image_url || FALLBACK_IMAGE}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-[12px] truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      SL: <span className="font-semibold text-gray-600">x{item.quantity}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-semibold text-[11px] text-gray-900">
                      {Number(item.price).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: Tổng tiền + Nút Chi tiết */}
            <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
              <div className="text-[11px] text-gray-500">
                Tổng cộng:{' '}
                <span className="font-bold text-red-600 text-xs sm:text-[13px]">
                  {Number(ord.total_amount).toLocaleString('vi-VN')}đ
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('/profile?tab=orders')}
                className="text-[11px] font-semibold text-primary hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                Chi tiết →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
