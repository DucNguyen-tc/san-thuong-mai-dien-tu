import { useNavigate } from 'react-router-dom';
import { Eye, ShoppingCart } from 'lucide-react';
import type { ProductCardItem } from '@/types/aiChat';
import { formatPrice } from '@/utils/formatters';

interface ChatProductCardListProps {
  products: ProductCardItem[];
  onAddToCart: (product: ProductCardItem) => void;
}

export default function ChatProductCardList({
  products,
  onAddToCart,
}: ChatProductCardListProps) {
  const navigate = useNavigate();

  if (!products || products.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-col gap-2.5">
      {products.map((product) => {
        const hasDiscount =
          typeof product.original_price === 'number' &&
          product.original_price > product.price;
        const inStock = product.in_stock !== false;

        return (
          <div
            key={product.id || product.slug}
            className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-xs hover:shadow-md transition-shadow flex gap-3 items-center"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
              <img
                src={
                  product.image_url ||
                  'https://placehold.co/200x200?text=Product'
                }
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {hasDiscount && product.discount_percent ? (
                <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[10px] font-bold px-1 py-0.2 rounded">
                  -{product.discount_percent}%
                </span>
              ) : null}
            </div>

            {/* Info & Actions */}
            <div className="flex-1 min-w-0">
              {product.category && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mb-0.5">
                  {product.category}
                </span>
              )}
              <h4
                className="text-xs font-semibold text-gray-900 truncate"
                title={product.name}
              >
                {product.name}
              </h4>

              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && product.original_price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/product/${product.slug || product.id}`)
                  }
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  Chi tiết
                </button>
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => onAddToCart(product)}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-3 h-3" />
                  {inStock ? 'Thêm giỏ' : 'Hết hàng'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
