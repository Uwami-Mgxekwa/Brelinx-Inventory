const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Inventory operations
  getInventoryItems: () => ipcRenderer.invoke('get-inventory-items'),
  addInventoryItem: (item) => ipcRenderer.invoke('add-inventory-item', item),
  updateInventoryItem: (id, item) => ipcRenderer.invoke('update-inventory-item', id, item),
  deleteInventoryItem: (id) => ipcRenderer.invoke('delete-inventory-item', id),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Menu events
  onMenuNewItem: (callback) => ipcRenderer.on('menu-new-item', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});