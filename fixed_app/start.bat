@echo off
chcp 65001 >nul
echo ========================================
echo   待辦事項管理器 - Windows 啟動工具
echo ========================================
echo.

echo 正在檢查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python！
    echo 請先安裝 Python 3.7 或更高版本
    echo 下載網址: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python 已安裝
echo.

echo 正在檢查 Flask...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [警告] Flask 未安裝
    echo 正在安裝 Flask...
    pip install flask
    if errorlevel 1 (
        echo [錯誤] Flask 安裝失敗
        pause
        exit /b 1
    )
    echo [OK] Flask 安裝成功
) else (
    echo [OK] Flask 已安裝
)
echo.

echo 正在檢查檔案...
if not exist "app.py" (
    echo [錯誤] 找不到 app.py
    pause
    exit /b 1
)
if not exist "templates\index.html" (
    echo [錯誤] 找不到 templates\index.html
    pause
    exit /b 1
)
if not exist "static\app.js" (
    echo [錯誤] 找不到 static\app.js
    pause
    exit /b 1
)
echo [OK] 所有檔案完整
echo.

echo ========================================
echo   正在啟動伺服器...
echo ========================================
echo.
echo   網址: http://127.0.0.1:5000
echo   按 Ctrl+C 停止伺服器
echo.
echo ========================================
echo.

python app.py

pause
