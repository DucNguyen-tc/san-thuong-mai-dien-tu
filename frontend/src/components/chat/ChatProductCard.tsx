import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, Loader2, ShoppingCart } from 'lucide-react';
import type { ProductCardItem } from '@/types/aiChat';
import { formatPrice } from '@/utils/formatters';

interface ChatProductCardListProps {
  products: ProductCardItem[];
  onAddToCart: (product: ProductCardItem) => Promise<void> | void;
  onViewDetail?: (product: ProductCardItem) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';

export default function ChatProductCardList({
  products,
  onAddToCart,
  onViewDetail,
}: ChatProductCardListProps) {
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!products || products.length === 0) return null;

  const handleViewDetailClick = (product: ProductCardItem) => {
    const targetSlugOrId = product.slug || product.id;
    onViewDetail?.(product);
    navigate(`/product/${targetSlugOrId}`);
  };

  const handleAddClick = async (product: ProductCardItem) => {
    const cardKey = product.id || product.slug;
    if (addingId === cardKey) return;

    try {
      setAddingId(cardKey);
      await onAddToCart(product);
      setAddedIds((prev) => ({ ...prev, [cardKey]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [cardKey]: false }));
      }, 2000);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="mt-2.5 flex flex-col gap-2.5">
      {products.map((product) => {
        const cardKey = product.id || product.slug;
        const hasDiscount =
          typeof product.original_price === 'number' &&
          product.original_price > product.price;
        const calculatedDiscount =
          product.discount_percent ||
          (hasDiscount && product.original_price
            ? Math.round(
                ((product.original_price - product.price) /
                  product.original_price) *
                  100
              )
            : 0);
        const inStock = product.in_stock !== false;
        const isAdding = addingId === cardKey;
        const isAdded = Boolean(addedIds[cardKey]);

        return (
          <div
            key={cardKey}
            className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex gap-3 items-start"
          >
            {/* Thumbnail */}
            <div
              onClick={() => handleViewDetailClick(product)}
              className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 cursor-pointer group"
            >
              <img
                src={product.image_url || FALLBACK_IMAGE}
                alt={product.name}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== FALLBACK_IMAGE) {
                    target.src = FALLBACK_IMAGE;
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              {hasDiscount && calculatedDiscount > 0 ? (
                <span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  -{calculatedDiscount}%
                </span>
              ) : null}
            </div>

            {/* Info & Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                {product.category ? (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                    {product.category}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    inStock
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-red-600 bg-red-50'
                  }`}
                >
                  {inStock ? 'Còn hàng' : 'Hết hàng'}
                </span>
              </div>

              <h4
                onClick={() => handleViewDetailClick(product)}
                className="text-xs font-semibold text-gray-900 line-clamp-2 hover:text-primary cursor-pointer transition-colors leading-snug"
                title={product.name}
              >
                {product.name}
              </h4>

              <div className="flex items-baseline flex-wrap gap-1.5 mt-1">
                <span className="text-xs font-bold text-red-600">
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
                  onClick={() => handleViewDetailClick(product)}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3 shrink-0" />
                  <span>Xem chi tiết</span>
                </button>
                <button
                  type="button"
                  disabled={!inStock || isAdding}
                  onClick={() => handleAddClick(product)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-white px-2 py-1.5 rounded-lg transition-colors cursor-pointer disabled:bg-gray-300 ${
                    isAdded
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      <span>Đang thêm</span>
                    </>
                  ) : isAdded ? (
                    <>
                      <Check className="w-3 h-3 shrink-0" />
                      <span>Đã thêm</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3 h-3 shrink-0" />
                      <span>{inStock ? 'Thêm giỏ' : 'Hết hàng'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
