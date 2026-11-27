import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Smartphone,
  Laptop,
  Shirt,
  Sparkles,
  Home as HomeIcon,
  Bike,
  Package,
  ChevronRight,
  ArrowRight,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { getCategoryTree } from '@/services/categoryService';
import type { Category } from '@/types/catalog';

interface CategoryMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function getIconForCategory(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes('điện thoại') || lower.includes('phone') || lower.includes('điện tử')) return Smartphone;
  if (lower.includes('laptop') || lower.includes('máy tính')) return Laptop;
  if (lower.includes('thời trang') || lower.includes('áo') || lower.includes('quần') || lower.includes('giày')) return Shirt;
  if (lower.includes('sức khỏe') || lower.includes('làm đẹp') || lower.includes('nước hoa') || lower.includes('mỹ phẩm')) return Sparkles;
  if (lower.includes('nhà') || lower.includes('đời sống') || lower.includes('bếp')) return HomeIcon;
  if (lower.includes('thể thao') || lower.includes('xe')) return Bike;
  return Package;
}

export default function CategoryMegaMenu({ isOpen, onClose }: CategoryMegaMenuProps) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getCategoryTree()
      .then((tree) => {
        if (!isMounted) return;
        // Lọc bỏ các danh mục rác/trùng lặp (chỉ lấy danh mục có danh mục con hoặc có slug chuẩn)
        const validRoots = tree.filter((cat) => {
          const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
          return hasChildren || cat.slug === 'khac';
        });

        // Sắp xếp ưu tiên các danh mục phổ biến lên đầu
        const priority = ['dien-tu', 'thoi-trang', 'suc-khoe-lam-dep', 'nha-cua-doi-song', 'the-thao-xe', 'khac'];
        validRoots.sort((a, b) => {
          const idxA = priority.indexOf(a.slug);
          const idxB = priority.indexOf(b.slug);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        setCategories(validRoots);
        if (validRoots.length > 0) {
          setActiveCategory(validRoots[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load category tree:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isOpen) return null;

  const handleNavigate = (categoryId: string) => {
    onClose();
    navigate(`/products?category_id=${categoryId}`);
  };

  const ActiveIcon = activeCategory ? getIconForCategory(activeCategory.name) : Package;

  return (
    <div
      className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] w-[700px] flex animate-in fade-in slide-in-from-top-2 duration-200 divide-x divide-gray-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* CỘT TRÁI: Danh sách danh mục cha */}
      <div className="w-[240px] bg-slate-50/70 p-3 space-y-1 shrink-0 overflow-y-auto max-h-[460px]">
        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Ngành hàng
        </div>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-xs">Đang tải danh mục...</span>
          </div>
        ) : (
          categories.map((cat) => {
            const Icon = getIconForCategory(cat.name);
            const isSelected = activeCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onMouseEnter={() => setActiveCategory(cat)}
                onClick={() => handleNavigate(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-white hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    size={17}
                    className={`shrink-0 transition-colors ${
                      isSelected ? 'text-white' : 'text-gray-400 group-hover:text-primary'
                    }`}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                <ChevronRight
                  size={14}
                  className={`shrink-0 transition-transform ${
                    isSelected ? 'text-white translate-x-0.5' : 'text-gray-300 group-hover:text-gray-500'
                  }`}
                />
              </button>
            );
          })
        )}
      </div>

      {/* CỘT PHẢI: Danh mục con của danh mục đang chọn */}
      <div className="flex-1 p-5 flex flex-col justify-between bg-white max-h-[460px] overflow-y-auto">
        {activeCategory ? (
          <div className="space-y-4">
            {/* Header danh mục cha */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ActiveIcon size={18} />
                </div>
                <h3 className="font-bold text-gray-900 text-base">{activeCategory.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate(activeCategory.id)}
                className="text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1 transition-colors cursor-pointer"
              >
                Xem tất cả
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Lưới danh mục con */}
            {activeCategory.children && activeCategory.children.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {activeCategory.children.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleNavigate(sub.id)}
                    className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-gray-100 text-left transition-all text-sm text-gray-700 hover:text-primary cursor-pointer group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary transition-colors shrink-0" />
                    <span className="truncate font-medium">{sub.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-sm">
                Danh mục này chưa có mục con. Bạn có thể bấm "Xem tất cả" để xem các sản phẩm.
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400 text-sm">
            Rê chuột vào một danh mục bên trái để xem các mục con
          </div>
        )}

        {/* Footer tiện ích */}
        <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Khám phá hơn 700+ sản phẩm chính hãng</span>
          <Link
            to="/products"
            onClick={onClose}
            className="text-primary hover:underline font-medium"
          >
            Tất cả sản phẩm &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

