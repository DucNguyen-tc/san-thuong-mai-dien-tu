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
  type LucideIcon,
} from 'lucide-react';
import { categories } from '@/utils/mockData';
import type { Category } from '@/types/product';

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

function CategoryItem({ category }: { category: Category }) {
  const Icon = iconMap[category.icon] ?? Smartphone;

  return (
    <Link to={category.href} className="flex flex-col items-center group">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-outline-variant group-hover:border-primary group-hover:bg-primary-fixed transition-all duration-300">
        <Icon size={28} className="text-primary" />
      </div>
      <span className="mt-2 text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors text-center">
        {category.name}
      </span>
    </Link>
  );
}

export default function CategoryGrid() {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-on-surface mb-6">Danh mục nổi bật</h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        {categories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
