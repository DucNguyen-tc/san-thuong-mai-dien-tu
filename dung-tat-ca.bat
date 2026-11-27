@echo off
chcp 65001 >nul
echo ========================================================
echo   DỪNG TOÀN BỘ HỆ THỐNG V-SHOP (DOCKER & FRONTEND)
echo ========================================================
echo.
echo [1/2] Đang dừng các container Docker...
docker compose down

echo.
echo [2/2] Đang tắt tiến trình Frontend nếu có...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo.
echo ========================================================
echo   Hệ thống đã được dừng an toàn.
echo ========================================================
pause
