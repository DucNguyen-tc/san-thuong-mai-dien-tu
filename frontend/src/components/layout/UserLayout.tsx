import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * UserLayout — Layout bọc toàn bộ trang dành cho khách hàng
 * Cấu trúc: Header → <main> (Outlet) → Footer
 * Được sử dụng trong UserRoutes.tsx
 */
export default function UserLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
