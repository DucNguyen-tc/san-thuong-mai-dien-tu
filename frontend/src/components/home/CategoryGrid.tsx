import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Laptop,
  Shirt,
  Watch,
  Headphones,
  Home,
  Sparkles,
  Gamepad2,
  Box,
  type LucideIcon,
} from 'lucide-react';
import { getCategoryTree } from '@/services/categoryService';
import type { Category } from '@/types/catalog';

// Map icon string → Lucide component
const iconMap: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  Shirt,
  Watch,
  Headphones,
  Home,
  Sparkles,
  Gamepad2,
};

function getIconForCategory(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes('điện thoại') || lower.includes('phone')) return Smartphone;
  if (lower.includes('laptop') || lower.includes('máy tính')) return Laptop;
  if (lower.includes('áo') || lower.includes('quần') || lower.includes('thời trang')) return Shirt;
  if (lower.includes('đồng hồ') || lower.includes('watch')) return Watch;
  if (lower.includes('tai nghe') || lower.includes('âm thanh')) return Headphones;
  if (lower.includes('nhà') || lower.includes('gia dụng')) return Home;
  if (lower.includes('mỹ phẩm') || lower.includes('làm đẹp')) return Sparkles;
  if (lower.includes('game') || lower.includes('đồ chơi')) return Gamepad2;
  return Box;
}

function CategoryItem({ category }: { category: Category }) {
  const Icon = getIconForCategory(category.name);

  return (
    <Link to={`/products?category_id=${category.id}`} className="flex flex-col items-center group">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-outline-variant group-hover:border-primary group-hover:bg-primary-fixed transition-all duration-300">
        <Icon size={28} className="text-primary" />
      </div>
      <span className="mt-2 text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors text-center line-clamp-1">
        {category.name}
      </span>
    </Link>
  );
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCategoryTree()
      .then(res => setCategories(res.slice(0, 8))) // Limit to 8 top level categories for UI
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-on-surface mb-6">Danh mục nổi bật</h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                <div className="w-12 h-3 bg-gray-200 rounded mt-2"></div>
              </div>
            ))
          : categories.map((category) => (
              <CategoryItem key={category.id} category={category} />
            ))}
      </div>
    </section>
  );
}
