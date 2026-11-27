import HeroBanner from '@/components/home/HeroBanner';
import TrustBadges from '@/components/home/TrustBadges';
import FlashSaleSection from '@/components/home/FlashSaleSection';
import AIRecommendations from '@/components/home/AIRecommendations';
import AIFeaturesBanner from '@/components/home/AIFeaturesBanner';
import OfficialBrandShowcase from '@/components/home/OfficialBrandShowcase';
import CategoryProductGroups from '@/components/home/CategoryProductGroups';

/**
 * Trang Chủ — dành cho khách hàng
 * Route: /
 * Layout: UserLayout (Header + Footer được cung cấp bởi UserRoutes)
 */
export default function Home() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 pb-16 space-y-6">
      {/* 1. Hero Banner chính */}
      <HeroBanner />

      {/* 2. Dải cam kết dịch vụ & uy tín */}
      <TrustBadges />

      {/* 3. Khối Flash Sale đếm ngược thời gian thực */}
      <FlashSaleSection />

      {/* 4. Gợi ý cá nhân hóa thông minh (AI Recommendations) */}
      <AIRecommendations />

      {/* 5. Banner giới thiệu bộ đôi tính năng AI (Trợ lý AI & Visual Search) */}
      <AIFeaturesBanner />

      {/* 6. Gian hàng thương hiệu chính hãng (Official Brand Mall) */}
      <OfficialBrandShowcase />

      {/* 7. Nhóm sản phẩm theo từng danh mục */}
      <CategoryProductGroups />
    </div>
  );
}
