import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Decode JWT token to get user info, or fetch from /auth/me
      // For now, we will decode basic payload
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const user = {
          id: payload.userId,
          email: '', // Requires full fetch from backend in real app
          full_name: 'Người dùng Google',
          role: payload.role,
        };
        
        // Ensure user is typed as any or appropriately if we fetch the real profile
        login(user as any, accessToken, refreshToken);
        navigate('/');
      } catch (e) {
        navigate('/login?error=auth_failed');
      }
    } else {
      navigate('/login?error=auth_failed');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-500">Đang xử lý đăng nhập...</p>
    </div>
  );
};

export default AuthCallback;
