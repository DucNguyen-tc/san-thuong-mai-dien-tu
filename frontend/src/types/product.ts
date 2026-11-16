// Types cho toàn bộ trang chủ V-Shop
// Nguồn thiết kế: Stitch "AI E-commerce Marketplace UI"

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  badge?: ProductBadge;
  badgeLabel?: string;
  aiReason?: string; // Lý do AI gợi ý (dùng cho AIProductCard)
}

export type ProductBadge = 'discount' | 'new' | 'bestseller' | 'gift' | 'hot';

export interface Category {
  id: string;
  name: string;
  icon: string; // Tên icon Lucide React
  href: string;
}

export interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  imageUrl: string;
}
