import { Heart } from 'lucide-react';
import type { Product } from '@/types/product';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { formatPrice } from '@/utils/formatters';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="product-card bg-white rounded-xl overflow-hidden shadow-sm border border-outline-variant/50 relative group cursor-pointer flex flex-col">
      {/* Badge */}
      {product.badge && product.badgeLabel && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant={product.badge} label={product.badgeLabel} />
        </div>
      )}

      {/* Wishlist button */}
      <button
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-error hover:scale-110 transition-transform"
        aria-label="Thêm vào yêu thích"
      >
        <Heart size={16} />
      </button>

      {/* Product Image */}
      <div className="h-48 w-full overflow-hidden bg-surface-container-low">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-on-surface-variant">{product.brand}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mt-1 flex-1 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="mt-3">
          <span className="text-primary font-bold text-lg block">
            {formatPrice(product.price)}
          </span>
        </div>

        <div className="mt-2">
          <StarRating rating={product.rating} count={product.reviewCount} />
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
