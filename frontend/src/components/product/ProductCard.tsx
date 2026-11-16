import { Heart } from "lucide-react";
import type { CatalogProduct } from "@/types/catalog";
import {
  getPrimaryImageUrl,
  getDisplayPrice,
  getDiscountedPrice,
  getMaxDiscountTag,
} from "@/types/catalog";
import StarRating from "@/components/ui/StarRating";
import { formatPrice } from "@/utils/formatters";

interface ProductCardProps {
  product: CatalogProduct;
  onAddToCart?: (product: CatalogProduct) => void;
}

function getDeterministicMockRating(productId: string) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const rating = 4.0 + (absHash % 11) / 10;
  const reviewsCount = 10 + (absHash % 111);
  return { rating, reviewsCount };
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const mock = getDeterministicMockRating(product.id || product.name);
  const displayRating = product.rating || mock.rating;
  const displayReviewsCount = product.reviews_count || mock.reviewsCount;

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
          src={getPrimaryImageUrl(product) || "https://via.placeholder.com/300"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-on-surface-variant">
          {product.category?.name}
        </p>
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
          <StarRating
            rating={displayRating}
            count={displayReviewsCount}
          />
        </div>
      </div>
    </div>
  );
}
