import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight, Package } from 'lucide-react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const method = searchParams.get('method') || 'Online Payment';
  const message = searchParams.get('message');

  const isSuccess = status === 'success';

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-surface-container-lowest to-surface-container-low">
      <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-8 shadow-xl text-center backdrop-blur-md">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
            
            <h1 className="text-2xl font-extrabold text-on-surface mb-2">
              Đặt hàng & Thanh toán thành công!
            </h1>
            <p className="text-on-surface-variant text-sm mb-6">
              Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận và xử lý.
            </p>

            <div className="bg-surface-container-low/60 rounded-xl p-4 mb-6 border border-outline-variant/40 space-y-3 text-left">
              {orderId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-primary">{orderId}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Phương thức:</span>
                <span className="font-semibold uppercase text-on-surface">{method}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Trạng thái:</span>
                <span className="px-2.5 py-0.5 bg-green-500/10 text-green-600 font-bold text-xs rounded-full border border-green-500/20">
                  ĐÃ XÁC NHẬN
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/profile"
                className="flex-1 py-3 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-outline-variant"
              >
                <Package size={18} />
                Quản lý đơn hàng
              </Link>
              <Link
                to="/"
                className="flex-1 py-3 px-4 bg-primary hover:opacity-90 text-on-primary font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-primary/20"
              >
                <ShoppingBag size={18} />
                Tiếp tục mua sắm
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} strokeWidth={2.5} />
            </div>

            <h1 className="text-2xl font-extrabold text-on-surface mb-2">
              Thanh toán không thành công
            </h1>
            <p className="text-on-surface-variant text-sm mb-6">
              {message || 'Giao dịch bị hủy hoặc xảy ra lỗi trong quá trình xử lý.'}
            </p>

            {orderId && (
              <div className="bg-surface-container-low/60 rounded-xl p-4 mb-6 border border-outline-variant/40 text-left text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-error">{orderId}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/checkout"
                className="flex-1 py-3 px-4 bg-primary hover:opacity-90 text-on-primary font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                Thử lại thanh toán
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/"
                className="flex-1 py-3 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold rounded-xl text-sm transition border border-outline-variant"
              >
                Về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
