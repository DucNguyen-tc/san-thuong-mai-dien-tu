import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Đính kèm email & id từ user_data để support-service / ai-service nhận đủ context
    try {
      const rawUser = localStorage.getItem('user_data');
      if (rawUser && config.headers) {
        const parsedUser = JSON.parse(rawUser);
        if (parsedUser?.email && typeof parsedUser.email === 'string') {
          config.headers['x-user-email'] = parsedUser.email;
        }
      }
    } catch {
      // Ignore parse errors
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle Token Expiration (401) and try refreshing via /auth/refresh-token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const newAccessToken =
            response.data?.data?.accessToken || response.data?.access_token;
          if (newAccessToken) {
            localStorage.setItem('access_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
