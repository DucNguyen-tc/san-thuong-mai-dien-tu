import { Heart } from 'lucide-react';
import type { CatalogProduct } from '@/types/catalog';
import { getPrimaryImageUrl, getDisplayPrice, getDiscountedPrice, getMaxDiscountTag } from '@/types/catalog';
import StarRating from '@/components/ui/StarRating';
import { formatPrice } from '@/utils/formatters';

interface ProductCardProps {
  product: CatalogProduct;
  onAddToCart?: (product: CatalogProduct) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="product-card bg-white rounded-xl overflow-hidden shadow-sm border border-outline-variant/50 relative group cursor-pointer flex flex-col">
      {/* Badge */}
      {getMaxDiscountTag(product) && (
        <div className="absolute top-3 left-3 z-10 bg-error text-white text-xs font-bold px-2 py-1 rounded">
          {getMaxDiscountTag(product)}
        </div>
      )}

      {/* Product Image */}
      <div className="h-48 w-full overflow-hidden bg-surface-container-low">
        <img
          src={getPrimaryImageUrl(product) || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-on-surface-variant">{product.category?.name}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mt-1 flex-1 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-primary font-bold text-lg block">
            {formatPrice(getDiscountedPrice(product))}
          </span>
          {getDiscountedPrice(product) < getDisplayPrice(product) && (
            <span className="text-on-surface-variant text-xs line-through mb-1">
              {formatPrice(getDisplayPrice(product))}
            </span>
          )}
        </div>

        <div className="mt-2">
          <StarRating rating={product.rating || 0} count={product.reviews_count || 0} />
        </div>

        <button
          onClick={() => onAddToCart?.(product)}
          className="w-full mt-4 py-2 bg-secondary text-white rounded-lg font-bold text-sm hover:bg-secondary-container transition-colors"
        >
          Mua Ngay
        </button>
      </div>
    </div>
  );
}
