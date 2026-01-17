@echo off

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo ========================================
echo  Brelinx Inventory Management Builder
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found! Installing dependencies...
call npm install

if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Building executable...
call npm run build

if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD COMPLETE!
echo ========================================
echo.
echo Your executable files are in the 'dist' folder:
dir dist /b
echo.
echo You can now distribute these files to users.
echo Double-click the .exe file to run the application.
echo.
pause