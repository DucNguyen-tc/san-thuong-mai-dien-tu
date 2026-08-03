import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import AIRecommendations from '@/components/home/AIRecommendations';
import CategoryProductGroups from '@/components/home/CategoryProductGroups';

/**
 * Trang Chủ — dành cho khách hàng
 * Route: /
 * Layout: UserLayout (Header + Footer được cung cấp bởi UserRoutes)
 */
export default function Home() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 pb-10">
      <HeroBanner />
      <CategoryGrid />
      <AIRecommendations />
      <CategoryProductGroups />
    </div>
  );
}
