import { useEffect, useState } from 'react';
import { getProducts } from '@/services/productService';
import ProductCard from '@/components/product/ProductCard';
import { useCartStore } from '@/store/useCartStore';
import type { CatalogProduct } from '@/types/catalog';
import { getPrimaryImageUrl, getDiscountedPrice } from '@/types/catalog';
import { Link } from 'react-router-dom';

export default function BestSellers() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    getProducts({ sort: 'sales', limit: 10 })
      .then(res => setProducts(res.items))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddToCart = (product: CatalogProduct) => {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: getDiscountedPrice(product),
      quantity: 1,
      attributes: {},
      image_url: getPrimaryImageUrl(product) || 'https://via.placeholder.com/300',
    });
  };

  return (
    <section className="mt-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-on-surface">Sản phẩm bán chạy nhất</h2>
        <div className="flex gap-2">
          {/* Tabs temporarily hidden as backend does not support filtering sales by time yet */}
        </div>
      </div>

      {/* Product Grid — 2 cols mobile, 5 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {isLoading 
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-[320px] animate-pulse flex flex-col">
                <div className="h-48 w-full bg-gray-200"></div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                  <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                </div>
              </div>
            ))
          : products.map((product) => (
              <Link to={`/products/${product.id}`} key={product.id}>
                <ProductCard
                  product={product}
                  onAddToCart={(p) => {
                    // Stop link propagation
                    handleAddToCart(p);
                  }}
                />
              </Link>
            ))}
      </div>
    </section>
  );
}
