import { useEffect, useState } from 'react';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getProductById } from '@/services/productService';
import type { CatalogProduct } from '@/types/catalog';
import { getDisplayPrice, getPrimaryImageUrl } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';

interface SimilarProductsProps {
  productId: string;
}

export default function SimilarProducts({ productId }: SimilarProductsProps) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const fetchSimilar = async () => {
      try {
        // Gọi Recommendation Service (Giả sử chạy port 3004 hoặc qua API Gateway)
        // Lưu ý: Cần chỉnh lại URL base nếu có API Gateway
        const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000/api';
        const res = await axios.get(`${API_URL}/recommendations/${productId}?limit=4`);
        const similarIds: string[] = res.data?.data || [];

        if (similarIds.length === 0) {
          if (!isCancelled) {
            setProducts([]);
            setIsLoading(false);
          }
          return;
        }

        // Gọi sang Catalog để lấy thông tin chi tiết từng sản phẩm
        const promises = similarIds.map(id => getProductById(id).catch(() => null));
        const results = await Promise.all(promises);
        
        // Lọc bỏ null
        const validProducts = results.filter(p => p !== null) as CatalogProduct[];

        if (!isCancelled) {
          setProducts(validProducts);
        }
      } catch (error) {
        console.error('Failed to fetch similar products', error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchSimilar();

    return () => { isCancelled = true; };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="mt-12 mb-8 flex justify-center py-10">
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Sản phẩm tương tự 
          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2 relative -top-1">AI GỢI Ý</span>
        </h2>
        <div className="flex gap-2">
           <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"><ChevronLeft size={20} /></button>
           <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-5">
         {products.map(product => {
           const primaryImage = getPrimaryImageUrl(product) || 'https://via.placeholder.com/200';
           const price = getDisplayPrice(product);

           return (
             <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 relative group hover:shadow-lg transition-shadow">
               <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 z-10"><Heart size={18} /></button>
               <Link to={`/products/${product.id}`} className="block">
                 <div className="aspect-square bg-gray-50 rounded-lg mb-4 overflow-hidden">
                    <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                 </div>
                 <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 h-10">{product.name}</h4>
                 <div className="text-blue-600 font-bold mb-3">{formatPrice(price)}</div>
               </Link>
               <button className="w-full py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium flex justify-center items-center gap-2">
                 <ShoppingCart size={16} /> Chọn mua
               </button>
             </div>
           );
         })}
      </div>
    </div>
  );
}
