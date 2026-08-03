import { useEffect, useState } from 'react';
import { getProducts } from '@/services/productService';
import { getCategoryTree } from '@/services/categoryService';
import ProductCard from '@/components/product/ProductCard';
import { useCartStore } from '@/store/useCartStore';
import type { CatalogProduct, Category } from '@/types/catalog';
import { getPrimaryImageUrl, getDiscountedPrice } from '@/types/catalog';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function CategoryGroup({ category }: { category: Category }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;
    getProducts({ category_id: category.id, limit: 5 })
      .then(res => {
        if (!isCancelled) setProducts(res.items);
      })
      .catch(console.error)
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
      
    return () => {
      isCancelled = true;
    };
  }, [category.id]);

  const handleBuyNow = async (product: CatalogProduct) => {
    try {
      const variantId = product.variants && product.variants.length > 0 && product.variants[0].is_active
        ? product.variants[0].id
        : "";
        
      const localMeta = {
        name: product.name,
        price: getDiscountedPrice(product),
        attributes: {},
        image_url: getPrimaryImageUrl(product) || 'https://via.placeholder.com/300',
      };
      
      await addItem(product.id, variantId, 1, localMeta);
      
      const currentCartItems = useCartStore.getState().items;
      const addedItem = currentCartItems.find(
        (item) => item.product_id === product.id && (variantId === "" || item.variant_id === variantId)
      );

      if (addedItem) {
        navigate("/checkout", { state: { selectedIds: [addedItem.id] } });
      } else {
        navigate("/checkout");
      }
    } catch (error) {
      console.error("Lỗi khi mua ngay:", error);
    }
  };

  if (!isLoading && products.length === 0) {
    return null; // Không render nếu không có sản phẩm
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
          {category.name}
        </h2>
        <Link 
          to={`/products?category_id=${category.id}`} 
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium transition-colors"
        >
          Xem tất cả <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {isLoading 
          ? Array.from({ length: 5 }).map((_, i) => (
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
                    handleBuyNow(p);
                  }}
                />
              </Link>
            ))}
      </div>
    </section>
  );
}

export default function CategoryProductGroups() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    getCategoryTree()
      .then(res => {
        if (!isCancelled) {
          // Lấy tối đa 4 danh mục nổi bật (hoặc có sản phẩm)
          setCategories(res.slice(0, 4));
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
      
    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-12 mt-10">
        <div className="animate-pulse bg-gray-200 h-8 w-64 rounded mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
           {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-[320px] animate-pulse flex flex-col">
                <div className="h-48 w-full bg-gray-200"></div>
              </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {categories.map(category => (
        <CategoryGroup key={category.id} category={category} />
      ))}
    </div>
  );
}
