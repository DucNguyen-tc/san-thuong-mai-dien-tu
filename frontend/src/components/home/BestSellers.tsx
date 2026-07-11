import { useState } from 'react';
import { bestSellers } from '@/utils/mockData';
import ProductCard from '@/components/product/ProductCard';
import { useCartStore } from '@/store/useCartStore';
import type { Product } from '@/types/product';

type TabType = 'week' | 'month';

export default function BestSellers() {
  const [activeTab, setActiveTab] = useState<TabType>('month');
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      attributes: {},
      image_url: product.imageUrl,
    });
  };

  return (
    <section className="mt-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-on-surface">Sản phẩm bán chạy nhất</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'week'
                ? 'bg-primary text-white'
                : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'month'
                ? 'bg-primary text-white'
                : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            Tháng này
          </button>
        </div>
      </div>

      {/* Product Grid — 2 cols mobile, 5 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {bestSellers.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </section>
  );
}
