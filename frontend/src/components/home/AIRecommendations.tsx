import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { aiRecommendations } from '@/utils/mockData';
import AIProductCard from '@/components/product/AIProductCard';

export default function AIRecommendations() {
  return (
    <section className="mt-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-on-surface">Dành riêng cho bạn</h2>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={10} className="fill-primary" />
            AI Suggested
          </span>
        </div>
        <Link
          to="/products"
          className="text-primary font-semibold hover:underline flex items-center gap-1 text-sm"
        >
          Xem tất cả <ArrowRight size={14} />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
        {aiRecommendations.map((product) => (
          <AIProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
