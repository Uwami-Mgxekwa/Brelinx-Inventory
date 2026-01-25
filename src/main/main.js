const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const back4AppManager = require('../shared/back4app-database');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../shared/preload.js')
    },
    icon: path.join(__dirname, '../renderer/assets/logo.png'),
    show: false
  });

  // Debug: Log preload path
  console.log('Preload script path:', path.join(__dirname, '../shared/preload.js'));

  // Start with login page
  mainWindow.loadFile(path.join(__dirname, '../renderer/pages/login.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize Back4App when app is ready
async function initializeApp() {
  try {
    await back4AppManager.initialize();
    console.log('Back4App initialized successfully');
    createWindow();
  } catch (error) {
    console.error('Failed to initialize Back4App:', error);
    // Still create window but with fallback functionality
    createWindow();
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(initializeApp);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Item',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('menu-new-item');
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: () => {
          mainWindow.webContents.send('menu-about');
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// IPC handlers for database operations using Back4App
ipcMain.handle('get-inventory-items', async () => {
  try {
    return await back4AppManager.getProducts();
  } catch (error) {
    console.error('Error getting inventory items:', error);
    return [];
  }
});

ipcMain.handle('add-inventory-item', async (event, item) => {
  try {
    const result = await back4AppManager.addProduct(item);
    return { success: true, id: result.id, item: result };
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-inventory-item', async (event, id, item) => {
  try {
    await back4AppManager.updateProduct(id, item);
    return { success: true };
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-inventory-item', async (event, id) => {
  try {
    await back4AppManager.deleteProduct(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return { success: false, error: error.message };
  }
});

// Stock movement operations
ipcMain.handle('add-stock-movement', async (event, productId, movementType, quantity, reason, reference) => {
  try {
    const result = await back4AppManager.addStockMovement(productId, movementType, quantity, reason, reference);
    return { success: true, result };
  } catch (error) {
    console.error('Error adding stock movement:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-stock-movements', async (event, productId, limit) => {
  try {
    return await back4AppManager.getStockMovements(productId, limit);
  } catch (error) {
    console.error('Error getting stock movements:', error);
    return [];
  }
});

// Category operations
ipcMain.handle('get-categories', async () => {
  try {
    return await back4AppManager.getCategories();
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
});

ipcMain.handle('add-category', async (event, name, description) => {
  try {
    const result = await back4AppManager.addCategory(name, description);
    return { success: true, category: result };
  } catch (error) {
    console.error('Error adding category:', error);
    return { success: false, error: error.message };
  }
});

// Supplier operations
ipcMain.handle('get-suppliers', async () => {
  try {
    return await back4AppManager.getSuppliers();
  } catch (error) {
    console.error('Error getting suppliers:', error);
    return [];
  }
});

ipcMain.handle('add-supplier', async (event, supplier) => {
  try {
    const result = await back4AppManager.addSupplier(supplier);
    return { success: true, supplier: result };
  } catch (error) {
    console.error('Error adding supplier:', error);
    return { success: false, error: error.message };
  }
});

// Analytics operations
ipcMain.handle('get-low-stock-products', async () => {
  try {
    return await back4AppManager.getLowStockProducts();
  } catch (error) {
    console.error('Error getting low stock products:', error);
    return [];
  }
});

ipcMain.handle('get-inventory-value', async () => {
  try {
    return await back4AppManager.getInventoryValue();
  } catch (error) {
    console.error('Error getting inventory value:', error);
    return {
      total_cost_value: 0,
      total_retail_value: 0,
      total_products: 0,
      total_quantity: 0
    };
  }
});

// Handle external links
ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

// Authentication handlers using Back4App
let currentSession = null;

ipcMain.handle('login', async (event, credentials) => {
  try {
    console.log('Attempting login for:', credentials.username);
    const result = await back4AppManager.authenticateUser(credentials.username, credentials.password);
    console.log('Login result:', result.success ? 'Success' : 'Failed');
    
    if (result.success) {
      currentSession = result.session;
      console.log('Session stored:', currentSession.username);
    }
    return result;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-session', async (event) => {
  try {
    console.log('Checking session, current session exists:', !!currentSession);
    
    if (!currentSession) {
      console.log('No current session found');
      return { valid: false };
    }
    
    // For now, let's trust the session if it exists and is recent
    const loginTime = new Date(currentSession.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    console.log('Session age (hours):', hoursDiff);
    
    if (hoursDiff < 24) {
      console.log('Session is valid');
      return { valid: true, session: currentSession };
    } else {
      console.log('Session expired');
      currentSession = null;
      return { valid: false };
    }
  } catch (error) {
    console.error('Session check error:', error);
    currentSession = null;
    return { valid: false };
  }
});

ipcMain.handle('logout', async (event) => {
  try {
    console.log('Logging out user');
    await back4AppManager.logout();
    currentSession = null;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    currentSession = null;
    return { success: true }; // Always succeed logout
  }
});