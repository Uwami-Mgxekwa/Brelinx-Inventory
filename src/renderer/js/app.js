// Main Application JavaScript
class InventoryApp {
    constructor() {
        this.currentView = 'dashboard';
        this.inventoryItems = [];
        // Don't call init automatically
    }

    async init() {
        // Check authentication first
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            return;
        }

        this.setupEventListeners();
        this.setupBrelinxLink();
        this.loadInventoryData();
        this.updateDashboard();
        this.displayUserInfo();
    }

    async checkAuthentication() {
        try {
            console.log('Checking authentication...');
            console.log('SessionManager available:', typeof window.SessionManager);
            console.log('ElectronAPI available:', typeof window.electronAPI);
            console.log('Current location:', window.location.href);
            
            if (!window.SessionManager) {
                console.log('SessionManager not available, redirecting to login');
                if (!window.location.href.includes('login.html')) {
                    setTimeout(() => window.location.href = 'login.html', 100);
                }
                return false;
            }

            const isLoggedIn = await window.SessionManager.isLoggedIn();
            console.log('Is logged in:', isLoggedIn);
            
            if (!isLoggedIn) {
                console.log('Not authenticated, redirecting to login');
                if (!window.location.href.includes('login.html')) {
                    setTimeout(() => window.location.href = 'login.html', 100);
                }
                return false;
            }
            
            console.log('Authentication successful');
            return true;
        } catch (error) {
            console.error('Authentication check failed:', error);
            if (!window.location.href.includes('login.html')) {
                setTimeout(() => window.location.href = 'login.html', 100);
            }
            return false;
        }
    }

    async displayUserInfo() {
        const session = window.SessionManager ? await window.SessionManager.getSession() : null;
        if (session) {
            // You can display user info in the header if needed
            console.log('Logged in as:', session.username);
        }
    }

    setupBrelinxLink() {
        const brelinxLink = document.getElementById('brelinxFooterLink');
        if (brelinxLink) {
            brelinxLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openBrelinxWebsite();
            });
        }
    }

    openBrelinxWebsite() {
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal('https://brelinx.com');
        } else {
            window.open('https://brelinx.com', '_blank');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Add Item Button
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.showAddItemModal();
        });

        // Logout Button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Modal Events
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideAddItemModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddItemModal();
        });

        // Form Submission
        document.getElementById('addItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewItem();
        });

        // Search and Filter
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterInventory(e.target.value);
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Close modal when clicking outside
        document.getElementById('addItemModal').addEventListener('click', (e) => {
            if (e.target.id === 'addItemModal') {
                this.hideAddItemModal();
            }
        });

        // Menu events from Electron
        if (window.electronAPI) {
            window.electronAPI.onMenuNewItem(() => {
                this.showAddItemModal();
            });

            window.electronAPI.onMenuAbout(() => {
                this.showAbout();
            });
        }
    }

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        this.currentView = viewName;

        // Load view-specific data
        if (viewName === 'inventory') {
            this.renderInventoryTable();
        } else if (viewName === 'dashboard') {
            this.updateDashboard();
        } else if (viewName === 'low-stock') {
            this.loadLowStockView();
        } else if (viewName === 'categories') {
            this.loadCategoriesView();
        } else if (viewName === 'settings') {
            this.loadSettingsView();
        } else if (viewName === 'reports') {
            this.loadReportsView();
        }
    }

    async loadInventoryData() {
        try {
            if (window.electronAPI) {
                this.inventoryItems = await window.electronAPI.getInventoryItems();
            } else {
                // Fallback for development/testing
                this.inventoryItems = this.getSampleData();
            }
            this.renderInventoryTable();
            this.updateDashboard();
        } catch (error) {
            console.error('Error loading inventory data:', error);
            this.showError('Failed to load inventory data');
        }
    }

    // Manual refresh method that can be called from anywhere
    async refreshInventory() {
        console.log('Refreshing inventory data...');
        await this.loadInventoryData();
        console.log('Inventory data refreshed');
    }

    // Low Stock View
    async loadLowStockView() {
        try {
            let lowStockItems = [];
            if (window.electronAPI && window.electronAPI.getLowStockProducts) {
                lowStockItems = await window.electronAPI.getLowStockProducts();
            } else {
                // Fallback - filter from current inventory
                lowStockItems = this.inventoryItems.filter(item => 
                    item.quantity <= (item.min_stock || 0)
                );
            }
            this.renderLowStockTable(lowStockItems);
        } catch (error) {
            console.error('Error loading low stock data:', error);
            this.showError('Failed to load low stock data');
        }
    }

    renderLowStockTable(lowStockItems) {
        const container = document.getElementById('low-stock-content');
        
        if (lowStockItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                    </div>
                    <h3>All Good!</h3>
                    <p>No items are currently low in stock</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="low-stock-header">
                <h3>Items Running Low (${lowStockItems.length})</h3>
                <button id="refreshLowStockBtn" class="btn btn-secondary btn-small">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23,4 23,10 17,10"/>
                        <polyline points="1,20 1,14 7,14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Refresh
                </button>
            </div>
            <div class="table-container">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Current Stock</th>
                            <th>Min Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStockItems.map(item => `
                            <tr class="low-stock-row">
                                <td>
                                    <div class="product-info">
                                        <strong>${item.name}</strong>
                                        ${item.description ? `<small>${item.description}</small>` : ''}
                                    </div>
                                </td>
                                <td><code>${item.sku}</code></td>
                                <td>${item.category}</td>
                                <td>
                                    <span class="quantity-display ${this.getQuantityClass(item.quantity)}">
                                        ${item.quantity}
                                    </span>
                                </td>
                                <td>${item.min_stock || 0}</td>
                                <td>
                                    ${item.quantity === 0 
                                        ? '<span class="status-badge status-out-of-stock">Out of Stock</span>'
                                        : '<span class="status-badge status-low-stock">Low Stock</span>'
                                    }
                                </td>
                                <td>
                                    <button class="btn btn-small btn-primary" onclick="app.quickRestock('${item.id}', '${item.name}')">
                                        <svg class="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="12" y1="5" x2="12" y2="19"/>
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                        Restock
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = tableHTML;
        
        // Add refresh event listener
        document.getElementById('refreshLowStockBtn').addEventListener('click', () => {
            this.loadLowStockView();
        });
    }

    // Quick restock functionality
    async quickRestock(productId, productName) {
        const quantity = prompt(`How many units would you like to add to "${productName}"?`, '10');
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            try {
                if (window.electronAPI && window.electronAPI.addStockMovement) {
                    await window.electronAPI.addStockMovement(
                        productId, 
                        'IN', 
                        parseInt(quantity), 
                        'Quick restock from low stock alert', 
                        `RESTOCK-${Date.now()}`
                    );
                    this.showSuccess(`Added ${quantity} units to ${productName}`);
                    this.loadLowStockView(); // Refresh the view
                    this.loadInventoryData(); // Refresh main inventory
                } else {
                    throw new Error('Stock movement API not available');
                }
            } catch (error) {
                console.error('Error restocking:', error);
                this.showError('Failed to restock item');
            }
        }
    }

    // Categories View
    async loadCategoriesView() {
        try {
            let categories = [];
            if (window.electronAPI && window.electronAPI.getCategories) {
                categories = await window.electronAPI.getCategories();
            } else {
                // Fallback - extract from current inventory
                const categorySet = new Set(this.inventoryItems.map(item => item.category));
                categories = Array.from(categorySet).map(name => ({ name, id: name }));
            }
            
            // Get category statistics
            const categoryStats = this.getCategoryStatistics();
            this.renderCategoriesView(categories, categoryStats);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Failed to load categories');
        }
    }

    getCategoryStatistics() {
        const stats = {};
        this.inventoryItems.forEach(item => {
            if (!stats[item.category]) {
                stats[item.category] = {
                    count: 0,
                    totalValue: 0,
                    totalQuantity: 0,
                    lowStock: 0
                };
            }
            stats[item.category].count++;
            stats[item.category].totalValue += (item.quantity * item.price);
            stats[item.category].totalQuantity += item.quantity;
            if (item.quantity <= (item.min_stock || 0)) {
                stats[item.category].lowStock++;
            }
        });
        return stats;
    }

    renderCategoriesView(categories, stats) {
        const container = document.getElementById('categories-content');
        
        const categoriesHTML = `
            <div class="categories-header">
                <h3>Product Categories</h3>
                <button id="addCategoryBtn" class="btn btn-primary">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Category
                </button>
            </div>
            
            <div class="categories-grid">
                ${Object.keys(stats).map(categoryName => {
                    const stat = stats[categoryName];
                    return `
                        <div class="category-card">
                            <div class="category-header">
                                <h4>${categoryName}</h4>
                                <div class="category-actions">
                                    <button class="btn btn-small btn-secondary" onclick="app.viewCategoryProducts('${categoryName}')">
                                        View Products
                                    </button>
                                </div>
                            </div>
                            <div class="category-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Products:</span>
                                    <span class="stat-value">${stat.count}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Total Quantity:</span>
                                    <span class="stat-value">${stat.totalQuantity}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Total Value:</span>
                                    <span class="stat-value">R${stat.totalValue.toFixed(2)}</span>
                                </div>
                                ${stat.lowStock > 0 ? `
                                    <div class="stat-item warning">
                                        <span class="stat-label">Low Stock:</span>
                                        <span class="stat-value">${stat.lowStock} items</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        container.innerHTML = categoriesHTML;
        
        // Add event listener for add category button
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.showAddCategoryModal();
        });
    }

    viewCategoryProducts(categoryName) {
        // Switch to inventory view and filter by category
        this.switchView('inventory');
        
        // Set the category filter
        setTimeout(() => {
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = categoryName;
                this.filterByCategory(categoryName);
            }
        }, 100);
    }

    showAddCategoryModal() {
        const name = prompt('Enter category name:');
        if (name && name.trim()) {
            this.addCategory(name.trim());
        }
    }

    async addCategory(name) {
        try {
            if (window.electronAPI && window.electronAPI.addCategory) {
                const result = await window.electronAPI.addCategory(name, '');
                if (result.success) {
                    this.showSuccess(`Category "${name}" added successfully`);
                    this.loadCategoriesView(); // Refresh categories view
                } else {
                    throw new Error(result.error || 'Failed to add category');
                }
            } else {
                this.showSuccess(`Category "${name}" added (demo mode)`);
            }
        } catch (error) {
            console.error('Error adding category:', error);
            this.showError('Failed to add category');
        }
    }

    // Settings View
    async loadSettingsView() {
        const container = document.getElementById('settings-content');
        
        // Get current user session info
        const session = window.SessionManager ? await window.SessionManager.getSession() : null;
        
        const settingsHTML = `
            <div class="settings-container">
                <div class="settings-section">
                    <h3>Account Information</h3>
                    <div class="setting-item">
                        <label>Username:</label>
                        <span class="setting-value">${session ? session.username : 'Unknown'}</span>
                    </div>
                    <div class="setting-item">
                        <label>Login Time:</label>
                        <span class="setting-value">${session ? new Date(session.loginTime).toLocaleString() : 'Unknown'}</span>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Application Settings</h3>
                    <div class="setting-item">
                        <label for="lowStockThreshold">Default Low Stock Threshold:</label>
                        <input type="number" id="lowStockThreshold" value="5" min="0" max="100">
                        <small>Default minimum stock level for new products</small>
                    </div>
                    <div class="setting-item">
                        <label for="currency">Currency Symbol:</label>
                        <select id="currency">
                            <option value="R">R (South African Rand)</option>
                            <option value="$">$ (US Dollar)</option>
                            <option value="€">€ (Euro)</option>
                            <option value="£">£ (British Pound)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="autoRefresh">Auto-refresh data:</label>
                        <select id="autoRefresh">
                            <option value="never">Never</option>
                            <option value="30">Every 30 seconds</option>
                            <option value="60">Every minute</option>
                            <option value="300">Every 5 minutes</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Data Management</h3>
                    <div class="setting-item">
                        <button id="exportDataBtn" class="btn btn-secondary">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Export All Data (CSV)
                        </button>
                        <small>Download all inventory data as CSV file</small>
                    </div>
                    <div class="setting-item">
                        <button id="clearCacheBtn" class="btn btn-warning">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Clear Cache
                        </button>
                        <small>Clear local cache and refresh data</small>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>About</h3>
                    <div class="setting-item">
                        <label>Application:</label>
                        <span class="setting-value">Brelinx Inventory Management v1.0.0</span>
                    </div>
                    <div class="setting-item">
                        <label>Database:</label>
                        <span class="setting-value">Back4App Cloud Database</span>
                    </div>
                    <div class="setting-item">
                        <label>Developer:</label>
                        <span class="setting-value">
                            <a href="#" id="brelinxSettingsLink" class="brelinx-link">Brelinx.com</a>
                        </span>
                    </div>
                </div>

                <div class="settings-actions">
                    <button id="saveSettingsBtn" class="btn btn-primary">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                        Save Settings
                    </button>
                    <button id="resetSettingsBtn" class="btn btn-secondary">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23,4 23,10 17,10"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Reset to Defaults
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = settingsHTML;
        this.setupSettingsEventListeners();
        this.loadSettings();
    }

    setupSettingsEventListeners() {
        // Export data
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportInventoryData();
        });

        // Clear cache
        document.getElementById('clearCacheBtn').addEventListener('click', () => {
            this.clearCache();
        });

        // Save settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Reset settings
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            this.resetSettings();
        });

        // Brelinx link
        document.getElementById('brelinxSettingsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openBrelinxWebsite();
        });
    }

    loadSettings() {
        // Load settings from localStorage
        const settings = JSON.parse(localStorage.getItem('inventorySettings') || '{}');
        
        if (settings.lowStockThreshold) {
            document.getElementById('lowStockThreshold').value = settings.lowStockThreshold;
        }
        if (settings.currency) {
            document.getElementById('currency').value = settings.currency;
        }
        if (settings.autoRefresh) {
            document.getElementById('autoRefresh').value = settings.autoRefresh;
        }
    }

    saveSettings() {
        const settings = {
            lowStockThreshold: document.getElementById('lowStockThreshold').value,
            currency: document.getElementById('currency').value,
            autoRefresh: document.getElementById('autoRefresh').value,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('inventorySettings', JSON.stringify(settings));
        this.showSuccess('Settings saved successfully');
        
        // Apply auto-refresh if enabled
        this.setupAutoRefresh(settings.autoRefresh);
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            localStorage.removeItem('inventorySettings');
            document.getElementById('lowStockThreshold').value = '5';
            document.getElementById('currency').value = 'R';
            document.getElementById('autoRefresh').value = 'never';
            this.showSuccess('Settings reset to defaults');
        }
    }

    setupAutoRefresh(interval) {
        // Clear existing auto-refresh
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        if (interval !== 'never') {
            const seconds = parseInt(interval);
            this.autoRefreshInterval = setInterval(() => {
                console.log('Auto-refreshing data...');
                this.loadInventoryData();
            }, seconds * 1000);
        }
    }

    async exportInventoryData() {
        try {
            const csvContent = this.generateCSV(this.inventoryItems);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('Inventory data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export data');
        }
    }

    generateCSV(data) {
        const headers = ['name', 'sku', 'category', 'price', 'cost', 'quantity', 'min_stock', 'max_stock', 'supplier', 'barcode', 'description'];
        const csvRows = [headers.join(',')];
        
        data.forEach(item => {
            const row = headers.map(header => {
                const value = item[header] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    clearCache() {
        if (confirm('This will clear all cached data and refresh from the server. Continue?')) {
            // Clear localStorage cache
            const keysToKeep = ['inventorySession', 'inventorySettings'];
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            
            // Refresh data
            this.loadInventoryData();
            this.showSuccess('Cache cleared and data refreshed');
        }
    }

    getSampleData() {
        return [
            {
                id: 1,
                name: 'Laptop Computer',
                sku: 'LAP001',
                category: 'Electronics',
                quantity: 15,
                price: 999.99,
                description: 'High-performance laptop for business use'
            },
            {
                id: 2,
                name: 'Office Chair',
                sku: 'CHR001',
                category: 'Furniture',
                quantity: 8,
                price: 299.99,
                description: 'Ergonomic office chair with lumbar support'
            },
            {
                id: 3,
                name: 'Wireless Mouse',
                sku: 'MOU001',
                category: 'Electronics',
                quantity: 2,
                price: 49.99,
                description: 'Bluetooth wireless mouse'
            }
        ];
    }

    renderInventoryTable() {
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = '';

        if (this.inventoryItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            </svg>
                        </div>
                        <h3>No items found</h3>
                        <p>Start by adding your first inventory item</p>
                        <button class="btn btn-primary" onclick="app.showAddItemModal()">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add First Item
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        this.inventoryItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.sku}</td>
                <td>${item.category}</td>
                <td>
                    <span class="quantity-display ${this.getQuantityClass(item.quantity)}">
                        ${item.quantity}
                    </span>
                    ${this.getStockStatus(item.quantity)}
                </td>
                <td class="price-display">R${item.price.toFixed(2)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-edit" onclick="app.editItem(${item.id})" title="Edit Item">
                            <svg class="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn btn-small btn-delete" onclick="app.deleteItem(${item.id})" title="Delete Item">
                            <svg class="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateCategoryFilter();
    }

    getQuantityClass(quantity) {
        if (quantity === 0) return 'quantity-out';
        if (quantity <= 5) return 'quantity-low';
        return '';
    }

    getStockStatus(quantity) {
        if (quantity === 0) {
            return '<span class="status-badge status-out-of-stock">Out of Stock</span>';
        } else if (quantity <= 5) {
            return '<span class="status-badge status-low-stock">Low Stock</span>';
        } else {
            return '<span class="status-badge status-in-stock">In Stock</span>';
        }
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = [...new Set(this.inventoryItems.map(item => item.category))];
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    updateDashboard() {
        const totalItems = this.inventoryItems.length;
        const lowStockItems = this.inventoryItems.filter(item => item.quantity <= 5).length;
        const categories = new Set(this.inventoryItems.map(item => item.category)).size;
        const totalValue = this.inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('totalCategories').textContent = categories;
        document.getElementById('totalValue').textContent = `R${totalValue.toFixed(2)}`;
    }

    showAddItemModal() {
        document.getElementById('addItemModal').classList.add('active');
        document.getElementById('itemName').focus();
    }

    hideAddItemModal() {
        document.getElementById('addItemModal').classList.remove('active');
        document.getElementById('addItemForm').reset();
    }

    async addNewItem() {
        const formData = new FormData(document.getElementById('addItemForm'));
        const newItem = {
            name: document.getElementById('itemName').value,
            sku: document.getElementById('itemSku').value,
            category: document.getElementById('itemCategory').value,
            quantity: parseInt(document.getElementById('itemQuantity').value),
            price: parseFloat(document.getElementById('itemPrice').value),
            description: document.getElementById('itemDescription').value
        };

        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.addInventoryItem(newItem);
                if (result.success) {
                    newItem.id = result.id;
                    this.inventoryItems.push(newItem);
                }
            } else {
                // Fallback for development
                newItem.id = Date.now();
                this.inventoryItems.push(newItem);
            }

            this.hideAddItemModal();
            this.renderInventoryTable();
            this.updateDashboard();
            this.showSuccess('Item added successfully!');
        } catch (error) {
            console.error('Error adding item:', error);
            this.showError('Failed to add item');
        }
    }

    async editItem(id) {
        // TODO: Implement edit functionality
        console.log('Edit item:', id);
    }

    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.deleteInventoryItem(id);
                if (result.success) {
                    this.inventoryItems = this.inventoryItems.filter(item => item.id !== id);
                }
            } else {
                // Fallback for development
                this.inventoryItems = this.inventoryItems.filter(item => item.id !== id);
            }

            this.renderInventoryTable();
            this.updateDashboard();
            this.showSuccess('Item deleted successfully!');
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showError('Failed to delete item');
        }
    }

    filterInventory(searchTerm) {
        const rows = document.querySelectorAll('#inventoryTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    filterByCategory(category) {
        const rows = document.querySelectorAll('#inventoryTableBody tr');
        rows.forEach(row => {
            if (!category) {
                row.style.display = '';
                return;
            }
            const categoryCell = row.cells[2];
            if (categoryCell) {
                const matches = categoryCell.textContent === category;
                row.style.display = matches ? '' : 'none';
            }
        });
    }

    showSuccess(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"/>
            </svg>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        // Remove after animation
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        // Remove after animation
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    showAbout() {
        alert('Brelinx Inventory Management System v1.0.0\nDeveloped by Brelinx.com');
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            if (window.SessionManager) {
                window.SessionManager.logout();
            } else {
                window.location.href = 'login.html';
            }
        }
    }
}

// Don't initialize automatically - wait for proper loading
// const app = new InventoryApp();
// window.app = app;