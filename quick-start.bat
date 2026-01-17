@echo off
echo ========================================
echo  Brelinx Inventory Management
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo After installing Node.js, run this file again.
    pause
    exit /b 1
)

echo Node.js found! Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo Starting Brelinx Inventory Management...
echo.
echo Login Credentials:
echo - Admin: admin / admin123
echo - Manager: manager / manager123
echo - User: user / user123
echo.
echo The application window will open shortly...
call npm start