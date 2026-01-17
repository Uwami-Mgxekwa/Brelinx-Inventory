# Brelinx Inventory Management - Installation Guide

## Prerequisites

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

## Installation Steps

### Option 1: Automatic Setup (Recommended)

1. Open PowerShell as Administrator in the project folder
2. Run the setup script:
   ```powershell
   .\setup-project.ps1
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```

### Option 2: Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   npm start
   ```

## Important Notes

⚠️ **Do NOT open the HTML files directly in a browser!**

This is an Electron desktop application that must be run using the `npm start` command. Opening HTML files directly in a browser will not work because:

- The Electron API (`window.electronAPI`) is not available in browsers
- The preload script only works in Electron
- Authentication and database features require the Electron main process

## Login Credentials

Once the app is running, use these credentials to log in:

- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`
- **User**: `user` / `user123`

## Troubleshooting

### "ElectronAPI is undefined" Error
- This means you're running in a browser instead of Electron
- Close the browser and run `npm start` instead

### "Cannot find module 'electron'" Error
- Run `npm install` to install dependencies
- Make sure Node.js is properly installed

### Application won't start
- Check that you're in the correct directory (where package.json is located)
- Verify Node.js and npm are installed correctly
- Try deleting `node_modules` folder and running `npm install` again

## Development Mode

To run in development mode with DevTools open:
```bash
npm run dev
```

## Building for Distribution

To create distributable packages:
```bash
npm run build
```

This will create installers in the `dist` folder for your operating system.