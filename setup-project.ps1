# Brelinx Inventory Management System Setup Script
# This script creates the complete folder structure and essential files for an Electron-based inventory system

Write-Host "Setting up Brelinx Inventory Management System..." -ForegroundColor Green

# Create new directory structure
$folders = @(
    "src",
    "src/main",
    "src/renderer",
    "src/renderer/pages",
    "src/renderer/css",
    "src/renderer/js",
    "src/renderer/assets",
    "src/renderer/assets/images",
    "src/renderer/assets/icons",
    "src/shared",
    "src/database",
    "dist",
    "build"
)

Write-Host "Creating folder structure..." -ForegroundColor Yellow
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "Created: $folder" -ForegroundColor Cyan
    }
}

# Move existing files to new structure
Write-Host "Moving existing files..." -ForegroundColor Yellow

# Move CSS files if they exist
if (Test-Path "css") {
    Get-ChildItem "css" -File | ForEach-Object {
        Move-Item $_.FullName "src/renderer/css/" -Force
        Write-Host "Moved: css/$($_.Name) -> src/renderer/css/" -ForegroundColor Cyan
    }
    Remove-Item "css" -Force -ErrorAction SilentlyContinue
}

# Move JS files if they exist
if (Test-Path "js") {
    Get-ChildItem "js" -File | ForEach-Object {
        Move-Item $_.FullName "src/renderer/js/" -Force
        Write-Host "Moved: js/$($_.Name) -> src/renderer/js/" -ForegroundColor Cyan
    }
    Remove-Item "js" -Force -ErrorAction SilentlyContinue
}

# Move assets if they exist
if (Test-Path "assets") {
    Get-ChildItem "assets" -File | ForEach-Object {
        Move-Item $_.FullName "src/renderer/assets/" -Force
        Write-Host "Moved: assets/$($_.Name) -> src/renderer/assets/" -ForegroundColor Cyan
    }
    Remove-Item "assets" -Force -ErrorAction SilentlyContinue
}

Write-Host "Creating essential Electron files..." -ForegroundColor Yellow

# Create package.json
$packageJson = @"
{
  "name": "brelinx-inventory",
  "version": "1.0.0",
  "description": "Inventory Management System developed by Brelinx.com",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder",
    "build-win": "electron-builder --win",
    "build-mac": "electron-builder --mac",
    "build-linux": "electron-builder --linux",
    "pack": "electron-builder --dir",
    "dist": "npm run build"
  },
  "keywords": [
    "inventory",
    "management",
    "electron",
    "desktop",
    "brelinx"
  ],
  "author": "Brelinx.com",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  },
  "dependencies": {
    "sqlite3": "^5.1.6"
  },
  "build": {
    "appId": "com.brelinx.inventory",
    "productName": "Brelinx Inventory",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "src/renderer/assets/icons/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "src/renderer/assets/icons/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "src/renderer/assets/icons/icon.png"
    }
  }
}
"@

Set-Content -Path "package.json" -Value $packageJson -Encoding UTF8
Write-Host "Created: package.json" -ForegroundColor Cyan

Write-Host "Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Run 'npm install' to install dependencies" -ForegroundColor White
Write-Host "2. Run 'npm start' to launch the application" -ForegroundColor White
Write-Host "3. Run 'npm run build' to create distributable packages" -ForegroundColor White