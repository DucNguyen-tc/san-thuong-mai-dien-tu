import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Bot, CreditCard } from 'lucide-react';

interface TrustItem {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: string;
  color: string;
}

const trustItems: TrustItem[] = [
  {
    icon: Truck,
    title: 'Giao Hàng Siêu Tốc',
    subtitle: 'Nội thành 2H, Freeship đơn 500k',
    badge: 'Nhanh',
    color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600',
  },
  {
    icon: ShieldCheck,
    title: '100% Chính Hãng',
    subtitle: 'Cam kết hoàn tiền 200% nếu giả',
    badge: 'Uy tín',
    color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600',
  },
  {
    icon: RotateCcw,
    title: 'Đổi Trả Dễ Dàng',
    subtitle: 'Miễn phí đổi mới trong 7 ngày',
    color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600',
  },
  {
    icon: Bot,
    title: 'Trợ Lý AI 24/7',
    subtitle: 'So sánh, tư vấn & tra cứu tức thì',
    badge: 'AI Smart',
    color: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600',
  },
  {
    icon: CreditCard,
    title: 'Thanh Toán Linh Hoạt',
    subtitle: 'VNPay, MoMo, Thẻ Visa & COD',
    color: 'text-rose-600 bg-rose-50 group-hover:bg-rose-600',
  },
];

export default function TrustBadges() {
  return (
    <section className="mt-8 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {trustItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group flex items-center gap-3.5 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${item.color} group-hover:text-white shadow-xs`}
              >
                <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {item.title}
                  </h4>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

