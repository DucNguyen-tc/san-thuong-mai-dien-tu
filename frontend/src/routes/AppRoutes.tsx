import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import AuthCallback from '@/pages/auth/AuthCallback';
import PageNotFound from '@/pages/PageNotFound';
import { UserRoutes } from '@/routes/UserRoutes';
import { AdminRoutes } from '@/routes/AdminRoutes';

/**
 * AppRoutes — File route CHÍNH DUY NHẤT được đăng ký vào App.tsx
 *
 * Cấu trúc routing:
 * ├── /login          → Login (không layout)
 * ├── /               → UserRoutes → UserLayout (Header + Footer)
 * │   └── pages/user/*
 * ├── /admin/*        → AdminRoutes → ProtectedRoute(ADMIN) → AdminLayout (Sidebar)
 * │   └── pages/admin/*
 * └── *               → PageNotFound
 *
 * Để thêm route mới:
 * - Route user → Chỉnh sửa UserRoutes.tsx
 * - Route admin → Chỉnh sửa AdminRoutes.tsx
 * - KHÔNG thêm route trực tiếp vào file này
 */
const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — không có Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* User routes — bọc bởi UserLayout */}
        {UserRoutes}

        {/* Admin routes — bọc bởi ProtectedRoute(ADMIN) + AdminLayout */}
        {AdminRoutes}

        {/* 404 */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};


export default AppRoutes;

