import type { Product } from '@/types/product';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { formatPrice } from '@/utils/formatters';

interface AIProductCardProps {
  product: Product;
}

export default function AIProductCard({ product }: AIProductCardProps) {
  return (
    <div className="product-card min-w-[380px] bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex gap-4 cursor-pointer">
      {/* Product Image */}
      <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-surface-container-low">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col justify-between py-1 min-w-0">
        <div>
          {product.badge && product.badgeLabel && (
            <div className="mb-1">
              <Badge variant={product.badge} label={product.badgeLabel} />
            </div>
          )}
          <h3 className="font-semibold text-base line-clamp-2 mt-1">{product.name}</h3>
          <p className="text-primary font-bold text-base mt-2">{formatPrice(product.price)}</p>
        </div>

        <div className="flex items-center gap-4 text-on-surface-variant">
          <StarRating rating={product.rating} count={product.reviewCount} />
          {product.aiReason && (
            <span className="text-xs truncate">{product.aiReason}</span>
          )}
        </div>
      </div>
    </div>
  );
}
