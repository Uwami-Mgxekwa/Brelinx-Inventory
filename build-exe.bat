@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

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

echo Node.js found!
node --version

echo.
echo Performing aggressive cleanup...
echo Killing all Node.js and Electron processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM "brelinx-inventory.exe" >nul 2>&1
taskkill /F /IM app-builder.exe >nul 2>&1

echo Waiting for processes to fully terminate...
timeout /t 3 /nobreak >nul

echo Unlocking and removing dist folder...
powershell -Command "if (Test-Path 'dist') { Get-ChildItem -Path 'dist' -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue; Remove-Item 'dist' -Force -Recurse -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak >nul

echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo Check the error messages above for details.
    pause
    exit /b 1
)

echo.
echo Building executable...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Build failed!
    echo ========================================
    echo.
    echo If the error persists, try these steps:
    echo 1. Close ALL applications and file explorer windows
    echo 2. Open Task Manager and end any node.exe or electron.exe processes
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD COMPLETE!
echo ========================================
echo.

if exist "dist" (
    echo Your executable files are in the 'dist' folder:
    dir dist /b
    echo.
    echo You can now distribute these files to users.
    echo Double-click the .exe file to run the application.
) else (
    echo WARNING: 'dist' folder not found!
    echo The build may have placed files in a different location.
)

echo.
pause