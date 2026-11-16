import { Link } from 'react-router-dom';
import type { CatalogProduct } from '@/types/catalog';
import { getDisplayPrice, getPrimaryImageUrl, getTotalAvailableStock } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';

interface CatalogProductCardProps {
  product: CatalogProduct;
}

/**
 * CatalogProductCard — Card sản phẩm dùng dữ liệu THẬT từ Catalog Service
 * (khác với ProductCard.tsx cũ đang dùng mock data cho trang chủ AI-mockup).
 */
export default function CatalogProductCard({ product }: CatalogProductCardProps) {
  const price = getDisplayPrice(product);
  const stock = getTotalAvailableStock(product);
  const outOfStock = stock <= 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-outline-variant/50 group flex flex-col hover:shadow-md transition-shadow"
    >
      <div className="h-48 w-full overflow-hidden bg-surface-container-low relative">
        <img
          src={getPrimaryImageUrl(product)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {outOfStock && (
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-semibold">
            Hết hàng
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-on-surface-variant">{product.category?.name}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mt-1 flex-1 min-h-[2.5rem] text-on-surface">
          {product.name}
        </h3>
        <span className="text-primary font-bold text-lg mt-3 block">
          {price > 0 ? formatPrice(price) : 'Liên hệ'}
        </span>
      </div>
    </Link>
  );
}
