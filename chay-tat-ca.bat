@echo off
chcp 65001 >nul
echo ========================================================
echo   KHỞI ĐỘNG HỆ THỐNG V-SHOP (DOCKER, BACKEND, FRONTEND)
echo ========================================================
echo.
echo [1/4] Đang khởi động các dịch vụ Backend qua Docker...
docker compose up -d

echo.
echo [2/4] Đồng bộ code AI Service mới nhất vào Docker...
docker cp backend/ai-service/dist san_thuong_mai_ai_service:/app/ >nul 2>&1
docker restart san_thuong_mai_ai_service >nul 2>&1

echo.
echo [3/4] Đang khởi động Frontend (Vite React)...
start "Frontend V-Shop (Port 5173)" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo [4/4] Đợi hệ thống sẵn sàng (khoảng 5 giây)...
timeout /t 5 /nobreak >nul

echo.
echo ========================================================
echo   HỆ THỐNG ĐÃ SẴN SÀNG!
echo   - Frontend:    http://localhost:5173
echo   - API Gateway: http://localhost:3000
echo   - RabbitMQ UI: http://localhost:15672 (guest / guest)
echo   - AI Service:  http://localhost:3010
echo ========================================================
echo.
echo Đang mở trình duyệt vào Frontend...
start http://localhost:5173
pause
