import type { CatalogProduct } from '@/types/catalog';
import { getPrimaryImageUrl, getDisplayPrice, getDiscountedPrice, getMaxDiscountTag } from '@/types/catalog';
import StarRating from '@/components/ui/StarRating';
import { formatPrice } from '@/utils/formatters';

interface AIProductCardProps {
  product: CatalogProduct;
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

export default function AIProductCard({ product }: AIProductCardProps) {
  const mock = getDeterministicMockRating(product.id || product.name);
  const displayRating = product.rating || mock.rating;
  const displayReviewsCount = product.reviews_count || mock.reviewsCount;

  return (
    <div className="product-card min-w-[380px] bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex gap-4 cursor-pointer">
      {/* Product Image */}
      <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-surface-container-low">
        <img
          src={getPrimaryImageUrl(product) || 'https://via.placeholder.com/150'}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col justify-between py-1 min-w-0">
        <div>
          {getMaxDiscountTag(product) && (
            <div className="mb-1">
              <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {getMaxDiscountTag(product)}
              </span>
            </div>
          )}
          <h3 className="font-semibold text-base line-clamp-2 mt-1">{product.name}</h3>
          
          <div className="mt-2 flex items-end gap-2">
            <span className="text-primary font-bold text-base block">
              {formatPrice(getDiscountedPrice(product))}
            </span>
            {getDiscountedPrice(product) < getDisplayPrice(product) && (
              <span className="text-on-surface-variant text-xs line-through mb-0.5">
                {formatPrice(getDisplayPrice(product))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-on-surface-variant">
          <StarRating rating={displayRating} count={displayReviewsCount} />
          {/* TODO: Add AI reason if available from recommendation API */}
          {/* {product.aiReason && (
            <span className="text-xs truncate">{product.aiReason}</span>
          )} */}
        </div>
      </div>
    </div>
  );
}
