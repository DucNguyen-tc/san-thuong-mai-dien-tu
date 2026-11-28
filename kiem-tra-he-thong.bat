@echo off
chcp 65001 >nul
echo ========================================================
echo   KIỂM TRA TRẠNG THÁI CÁC DỊCH VỤ V-SHOP
echo ========================================================
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
pause
