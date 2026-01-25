const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Inventory operations
  getInventoryItems: () => ipcRenderer.invoke('get-inventory-items'),
  getProductBySku: (sku) => ipcRenderer.invoke('get-product-by-sku', sku),
  addInventoryItem: (item) => ipcRenderer.invoke('add-inventory-item', item),
  updateInventoryItem: (id, item) => ipcRenderer.invoke('update-inventory-item', id, item),
  deleteInventoryItem: (id) => ipcRenderer.invoke('delete-inventory-item', id),

  // Stock movement operations
  addStockMovement: (productId, movementType, quantity, reason, reference) => 
    ipcRenderer.invoke('add-stock-movement', productId, movementType, quantity, reason, reference),
  getStockMovements: (productId, limit) => ipcRenderer.invoke('get-stock-movements', productId, limit),

  // Category operations
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (name, description) => ipcRenderer.invoke('add-category', name, description),

  // Supplier operations
  getSuppliers: () => ipcRenderer.invoke('get-suppliers'),
  addSupplier: (supplier) => ipcRenderer.invoke('add-supplier', supplier),

  // Analytics operations
  getLowStockProducts: () => ipcRenderer.invoke('get-low-stock-products'),
  getInventoryValue: () => ipcRenderer.invoke('get-inventory-value'),

  // Authentication
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  checkSession: () => ipcRenderer.invoke('check-session'),
  logout: () => ipcRenderer.invoke('logout'),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Menu events
  onMenuNewItem: (callback) => ipcRenderer.on('menu-new-item', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});