import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { getProducts } from '@/services/productService';
import type { CatalogProduct } from '@/types/catalog';
import AIProductCard from '@/components/product/AIProductCard';

export default function AIRecommendations() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In the future, this can be swapped with a real recommendation API if user is logged in
    getProducts({ sort: 'popular', limit: 8 })
      .then(res => setProducts(res.items))
      .finally(() => setIsLoading(false));
  }, []);

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
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[380px] h-[160px] bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex gap-4 animate-pulse">
                <div className="w-32 h-32 rounded-xl bg-gray-200 shrink-0"></div>
                <div className="flex-1 py-2 flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          : products.map((product) => (
              <Link to={`/products/${product.id}`} key={product.id}>
                <AIProductCard product={product} />
              </Link>
            ))}
      </div>
    </section>
  );
}
