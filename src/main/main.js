const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');

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

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

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

// IPC handlers for database operations
ipcMain.handle('get-inventory-items', async () => {
  // TODO: Implement database query
  return [];
});

ipcMain.handle('add-inventory-item', async (event, item) => {
  // TODO: Implement database insert
  return { success: true, id: Date.now() };
});

ipcMain.handle('update-inventory-item', async (event, id, item) => {
  // TODO: Implement database update
  return { success: true };
});

ipcMain.handle('delete-inventory-item', async (event, id) => {
  // TODO: Implement database delete
  return { success: true };
});

// Handle external links
ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

// Authentication handlers
let currentSession = null;

ipcMain.handle('login', async (event, credentials) => {
  // Validate credentials (in a real app, this would be server-side)
  const validCredentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'manager', password: 'manager123' },
    { username: 'user', password: 'user123' }
  ];

  const isValid = validCredentials.some(cred => 
    cred.username === credentials.username && cred.password === credentials.password
  );

  if (isValid) {
    currentSession = {
      username: credentials.username,
      loginTime: new Date().toISOString(),
      sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
    return { success: true, session: currentSession };
  } else {
    return { success: false, error: 'Invalid credentials' };
  }
});

ipcMain.handle('check-session', async (event) => {
  if (!currentSession) return { valid: false };

  // Check if session is still valid (24 hours)
  const loginTime = new Date(currentSession.loginTime);
  const now = new Date();
  const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

  if (hoursDiff < 24) {
    return { valid: true, session: currentSession };
  } else {
    currentSession = null;
    return { valid: false };
  }
});

ipcMain.handle('logout', async (event) => {
  currentSession = null;
  return { success: true };
});