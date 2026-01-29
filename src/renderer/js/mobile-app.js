// Mobile Inventory App JavaScript
class MobileInventoryApp {
    constructor() {
        this.currentView = 'dashboard';
        this.inventoryItems = [];
        this.categories = [];
        this.apiEndpoint = this.getApiEndpoint();
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    getApiEndpoint() {
        // Get API endpoint from localStorage or URL params
        const stored = localStorage.getItem('mobileApiEndpoint');
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('api') || stored || 'https://your-api-endpoint.com/api';
    }

    init() {
        this.setupEventListeners();
        this.setupNetworkListeners();
        this.loadData();
        this.updateDashboard();
        this.checkInstallPrompt();
    }

    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.toggleMenu();
        });

        document.getElementById('navClose').addEventListener('click', () => {
            this.closeMenu();
        });

        document.getElementById('overlay').addEventListener('click', () => {
            this.closeMenu();
        });

        // Quick actions
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.showAddItemModal();
        });

        document.getElementById('viewInventoryBtn').addEventListener('click', () => {
            this.switchView('inventory');
        });

        document.getElementById('lowStockBtn').addEventListener('click', () => {
            this.switchView('low-stock');
        });

        document.getElementById('reportsBtn').addEventListener('click', () => {
            this.switchView('reports');
        });

        // FAB button
        document.getElementById('fabBtn').addEventListener('click', () => {
            this.showAddItemModal();
        });

        // Modal events
        document.getElementById('closeAddModal').addEventListener('click', () => {
            this.hideAddItemModal();
        });

        document.getElementById('cancelAddBtn').addEventListener('click', () => {
            this.hideAddItemModal();
        });

        // Form submission
        document.getElementById('addItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewItem();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterInventory(e.target.value);
        });

        // Refresh buttons
        document.getElementById('refreshInventoryBtn').addEventListener('click', () => {
            this.refreshInventory();
        });

        document.getElementById('refreshLowStockBtn').addEventListener('click', () => {
            this.loadLowStockView();
        });

        // Category management
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.addCategory();
        });

        // Reports
        document.getElementById('exportReportsBtn').addEventListener('click', () => {
            this.exportReports();
        });
    }

    setupNavigation() {
        // Side navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.closest('.nav-link').dataset.view;
                this.switchView(view);
                this.closeMenu();
            });
        });

        // Bottom navigation
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.closest('.bottom-nav-item').dataset.view;
                this.switchView(view);
            });
        });
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('Connection restored', 'success');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('Working offline', 'warning');
        });
    }

    toggleMenu() {
        const nav = document.getElementById('mobileNav');
        const overlay = document.getElementById('overlay');
        
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    closeMenu() {
        const nav = document.getElementById('mobileNav');
        const overlay = document.getElementById('overlay');
        
        nav.classList.remove('active');
        overlay.classList.remove('active');
    }

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Update navigation states
        document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
            link.classList.remove('active');
        });

        document.querySelectorAll(`[data-view="${viewName}"]`).forEach(link => {
            link.classList.add('active');
        });

        this.currentView = viewName;

        // Load view-specific data
        switch (viewName) {
            case 'inventory':
                this.loadInventoryView();
                break;
            case 'categories':
                this.loadCategoriesView();
                break;
            case 'low-stock':
                this.loadLowStockView();
                break;
            case 'reports':
                this.loadReportsView();
                break;
            case 'settings':
                this.loadSettingsView();
                break;
        }
    }

    async loadData() {
        try {
            this.showLoading();
            
            if (this.isOnline) {
                // Try to load from API
                await this.loadFromAPI();
            } else {
                // Load from localStorage
                this.loadFromStorage();
            }
            
            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadFromStorage(); // Fallback to local storage
            this.hideLoading();
        }
    }

    async loadFromAPI() {
        try {
            // This would connect to your actual API
            // For now, we'll use sample data
            this.inventoryItems = this.getSampleData();
            this.categories = this.extractCategories();
            
            // Save to localStorage for offline use
            this.saveToStorage();
        } catch (error) {
            throw error;
        }
    }

    loadFromStorage() {
        const stored = localStorage.getItem('mobileInventoryData');
        if (stored) {
            const data = JSON.parse(stored);
            this.inventoryItems = data.items || [];
            this.categories = data.categories || [];
        } else {
            // Use sample data if nothing in storage
            this.inventoryItems = this.getSampleData();
            this.categories = this.extractCategories();
        }
    }

    saveToStorage() {
        const data = {
            items: this.inventoryItems,
            categories: this.categories,
            lastSync: new Date().toISOString()
        };
        localStorage.setItem('mobileInventoryData', JSON.stringify(data));
    }

    getSampleData() {
        return [
            {
                id: 1,
                name: 'Laptop Computer',
                sku: 'LAP001',
                category: 'Electronics',
                quantity: 15,
                min_stock: 5,
                price: 999.99,
                description: 'High-performance laptop for business use'
            },
            {
                id: 2,
                name: 'Office Chair',
                sku: 'CHR001',
                category: 'Furniture',
                quantity: 8,
                min_stock: 3,
                price: 299.99,
                description: 'Ergonomic office chair with lumbar support'
            },
            {
                id: 3,
                name: 'Wireless Mouse',
                sku: 'MOU001',
                category: 'Electronics',
                quantity: 2,
                min_stock: 10,
                price: 49.99,
                description: 'Bluetooth wireless mouse'
            },
            {
                id: 4,
                name: 'Standing Desk',
                sku: 'DSK001',
                category: 'Furniture',
                quantity: 0,
                min_stock: 2,
                price: 599.99,
                description: 'Adjustable height standing desk'
            },
            {
                id: 5,
                name: 'Smartphone',
                sku: 'PHN001',
                category: 'Electronics',
                quantity: 25,
                min_stock: 8,
                price: 799.99,
                description: 'Latest model smartphone'
            }
        ];
    }

    extractCategories() {
        const categorySet = new Set(this.inventoryItems.map(item => item.category));
        return Array.from(categorySet).map(name => ({ name, id: name }));
    }

    updateDashboard() {
        const totalItems = this.inventoryItems.length;
        const lowStockItems = this.inventoryItems.filter(item => 
            item.quantity <= (item.min_stock || 0)
        ).length;
        const totalCategories = this.categories.length;
        const totalValue = this.inventoryItems.reduce((sum, item) => 
            sum + (item.quantity * item.price), 0
        );

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('totalCategories').textContent = totalCategories;
        document.getElementById('totalValue').textContent = `R${totalValue.toFixed(2)}`;

        this.updateRecentActivity();
    }

    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        
        // Sample recent activity
        const activities = [
            { action: 'Added', item: 'Smartphone', time: '2 hours ago' },
            { action: 'Updated', item: 'Laptop Computer', time: '4 hours ago' },
            { action: 'Low Stock Alert', item: 'Wireless Mouse', time: '1 day ago' }
        ];

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${activity.action}: ${activity.item}</div>
                    <div class="list-item-subtitle">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    loadInventoryView() {
        this.renderInventoryList();
    }

    renderInventoryList(items = this.inventoryItems) {
        const container = document.getElementById('inventoryList');
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <p>No inventory items found</p>
                    <button class="btn btn-primary" onclick="mobileApp.showAddItemModal()">Add First Item</button>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${item.name}</div>
                    <div class="list-item-subtitle">
                        SKU: ${item.sku} | Category: ${item.category} | 
                        Qty: ${item.quantity} | Price: R${item.price.toFixed(2)}
                        ${item.quantity <= (item.min_stock || 0) ? 
                            `<span class="badge badge-warning">Low Stock</span>` : 
                            item.quantity === 0 ? 
                            `<span class="badge badge-danger">Out of Stock</span>` : 
                            `<span class="badge badge-success">In Stock</span>`
                        }
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-small btn-secondary" onclick="mobileApp.editItem(${item.id})">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterInventory(searchTerm) {
        const filtered = this.inventoryItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderInventoryList(filtered);
    }

    loadCategoriesView() {
        const container = document.getElementById('categoriesList');
        
        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <p>No categories found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.categories.map(category => {
            const categoryItems = this.inventoryItems.filter(item => item.category === category.name);
            const totalValue = categoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const lowStockCount = categoryItems.filter(item => item.quantity <= (item.min_stock || 0)).length;

            return `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${category.name}</div>
                        <div class="list-item-subtitle">
                            ${categoryItems.length} items | Total Value: R${totalValue.toFixed(2)}
                            ${lowStockCount > 0 ? `| ${lowStockCount} low stock` : ''}
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-small btn-secondary" onclick="mobileApp.viewCategoryItems('${category.name}')">
                            View Items
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadLowStockView() {
        const container = document.getElementById('lowStockList');
        const lowStockItems = this.inventoryItems.filter(item => 
            item.quantity <= (item.min_stock || 0)
        );

        if (lowStockItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p>All items are adequately stocked!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = lowStockItems.map(item => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${item.name}</div>
                    <div class="list-item-subtitle">
                        Current: ${item.quantity} | Min: ${item.min_stock || 0} | 
                        ${item.quantity === 0 ? 
                            `<span class="badge badge-danger">Out of Stock</span>` : 
                            `<span class="badge badge-warning">Low Stock</span>`
                        }
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-small btn-primary" onclick="mobileApp.quickRestock(${item.id})">
                        Restock
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadReportsView() {
        const container = document.getElementById('reportsContent');
        
        const totalItems = this.inventoryItems.length;
        const totalValue = this.inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const lowStockItems = this.inventoryItems.filter(item => item.quantity <= (item.min_stock || 0)).length;
        const outOfStockItems = this.inventoryItems.filter(item => item.quantity === 0).length;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${totalItems}</span>
                    <div class="stat-label">Total Products</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">R${totalValue.toFixed(2)}</span>
                    <div class="stat-label">Total Value</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${lowStockItems}</span>
                    <div class="stat-label">Low Stock</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${outOfStockItems}</span>
                    <div class="stat-label">Out of Stock</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Category Breakdown</h3>
                </div>
                <div class="card-body">
                    ${this.categories.map(category => {
                        const categoryItems = this.inventoryItems.filter(item => item.category === category.name);
                        const categoryValue = categoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                        return `
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">${category.name}</div>
                                    <div class="list-item-subtitle">${categoryItems.length} items</div>
                                </div>
                                <div style="text-align: right;">
                                    <strong>R${categoryValue.toFixed(2)}</strong>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    loadSettingsView() {
        const container = document.getElementById('settingsContent');
        
        container.innerHTML = `
            <div class="form-group">
                <label class="form-label">API Endpoint</label>
                <input type="url" class="form-control" id="apiEndpointInput" value="${this.apiEndpoint}" placeholder="https://your-api.com/api">
                <small style="color: var(--gray-color); margin-top: 0.5rem; display: block;">
                    Enter your inventory API endpoint for data synchronization
                </small>
            </div>
            
            <div class="form-group">
                <button class="btn btn-primary" onclick="mobileApp.saveSettings()">Save Settings</button>
            </div>

            <div class="form-group">
                <label class="form-label">Data Management</label>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="mobileApp.syncData()">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23,4 23,10 17,10"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Sync Data
                    </button>
                    <button class="btn btn-secondary" onclick="mobileApp.exportData()">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export Data
                    </button>
                    <button class="btn btn-danger" onclick="mobileApp.clearData()">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Clear Local Data
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">App Information</label>
                <div style="color: var(--gray-color); font-size: 0.875rem;">
                    <p>Version: 1.0.0</p>
                    <p>Last Sync: ${this.getLastSyncTime()}</p>
                    <p>Status: ${this.isOnline ? 'Online' : 'Offline'}</p>
                </div>
            </div>
        `;
    }

    getLastSyncTime() {
        const stored = localStorage.getItem('mobileInventoryData');
        if (stored) {
            const data = JSON.parse(stored);
            return data.lastSync ? new Date(data.lastSync).toLocaleString() : 'Never';
        }
        return 'Never';
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
        const formData = {
            name: document.getElementById('itemName').value,
            sku: document.getElementById('itemSku').value,
            category: document.getElementById('itemCategory').value,
            quantity: parseInt(document.getElementById('itemQuantity').value),
            price: parseFloat(document.getElementById('itemPrice').value),
            description: document.getElementById('itemDescription').value,
            min_stock: 5 // Default minimum stock
        };

        // Add to local array
        const newItem = {
            id: Date.now(),
            ...formData
        };

        this.inventoryItems.push(newItem);
        
        // Update categories if new
        if (!this.categories.find(cat => cat.name === formData.category)) {
            this.categories.push({ name: formData.category, id: formData.category });
        }

        // Save to storage
        this.saveToStorage();

        // Update UI
        this.updateDashboard();
        if (this.currentView === 'inventory') {
            this.renderInventoryList();
        }

        this.hideAddItemModal();
        this.showToast('Item added successfully!', 'success');

        // Sync with API if online
        if (this.isOnline) {
            this.syncData();
        }
    }

    editItem(id) {
        const item = this.inventoryItems.find(item => item.id === id);
        if (!item) return;

        // For now, just show an alert. In a full implementation, 
        // you'd show an edit modal similar to the add modal
        const newQuantity = prompt(`Update quantity for ${item.name} (current: ${item.quantity}):`, item.quantity);
        if (newQuantity !== null && !isNaN(newQuantity)) {
            item.quantity = parseInt(newQuantity);
            this.saveToStorage();
            this.updateDashboard();
            if (this.currentView === 'inventory') {
                this.renderInventoryList();
            }
            this.showToast('Item updated successfully!', 'success');
        }
    }

    quickRestock(id) {
        const item = this.inventoryItems.find(item => item.id === id);
        if (!item) return;

        const quantity = prompt(`How many units to add to ${item.name}?`, '10');
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            item.quantity += parseInt(quantity);
            this.saveToStorage();
            this.updateDashboard();
            this.loadLowStockView();
            this.showToast(`Added ${quantity} units to ${item.name}`, 'success');
        }
    }

    viewCategoryItems(categoryName) {
        this.switchView('inventory');
        setTimeout(() => {
            const searchInput = document.getElementById('searchInput');
            searchInput.value = categoryName;
            this.filterInventory(categoryName);
        }, 100);
    }

    addCategory() {
        const name = prompt('Enter category name:');
        if (name && name.trim()) {
            const categoryName = name.trim();
            if (!this.categories.find(cat => cat.name === categoryName)) {
                this.categories.push({ name: categoryName, id: categoryName });
                this.saveToStorage();
                this.loadCategoriesView();
                this.showToast(`Category "${categoryName}" added successfully!`, 'success');
            } else {
                this.showToast('Category already exists', 'error');
            }
        }
    }

    async refreshInventory() {
        this.showToast('Refreshing...', 'info');
        await this.loadData();
        this.updateDashboard();
        if (this.currentView === 'inventory') {
            this.renderInventoryList();
        }
        this.showToast('Inventory refreshed', 'success');
    }

    saveSettings() {
        const apiEndpoint = document.getElementById('apiEndpointInput').value;
        if (apiEndpoint) {
            this.apiEndpoint = apiEndpoint;
            localStorage.setItem('mobileApiEndpoint', apiEndpoint);
            this.showToast('Settings saved successfully!', 'success');
        }
    }

    async syncData() {
        if (!this.isOnline) {
            this.showToast('Cannot sync while offline', 'error');
            return;
        }

        this.showToast('Syncing data...', 'info');
        
        try {
            // In a real implementation, this would sync with your API
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            
            const data = {
                items: this.inventoryItems,
                categories: this.categories,
                lastSync: new Date().toISOString()
            };
            localStorage.setItem('mobileInventoryData', JSON.stringify(data));
            
            this.showToast('Data synced successfully!', 'success');
        } catch (error) {
            this.showToast('Sync failed', 'error');
        }
    }

    exportData() {
        const data = {
            items: this.inventoryItems,
            categories: this.categories,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Data exported successfully!', 'success');
    }

    exportReports() {
        const reportData = this.generateReportData();
        const csv = this.generateCSV(reportData);
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Report exported successfully!', 'success');
    }

    generateReportData() {
        return this.inventoryItems.map(item => ({
            Name: item.name,
            SKU: item.sku,
            Category: item.category,
            Quantity: item.quantity,
            'Min Stock': item.min_stock || 0,
            Price: item.price,
            'Total Value': item.quantity * item.price,
            Status: item.quantity === 0 ? 'Out of Stock' : 
                   item.quantity <= (item.min_stock || 0) ? 'Low Stock' : 'In Stock'
        }));
    }

    generateCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => `"${row[header]}"`).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }

    clearData() {
        if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
            localStorage.removeItem('mobileInventoryData');
            this.inventoryItems = [];
            this.categories = [];
            this.updateDashboard();
            this.showToast('Local data cleared', 'success');
        }
    }

    showLoading() {
        // You could show a loading spinner here
        console.log('Loading...');
    }

    hideLoading() {
        // Hide loading spinner
        console.log('Loading complete');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} show`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    checkInstallPrompt() {
        // PWA install prompt logic would go here
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.style.display = 'block';
                
                document.getElementById('installBtn').addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                        }
                        deferredPrompt = null;
                        installPrompt.style.display = 'none';
                    });
                });
                
                document.getElementById('installClose').addEventListener('click', () => {
                    installPrompt.style.display = 'none';
                });
            }
        });
    }
}

// Initialize the mobile app
let mobileApp;
document.addEventListener('DOMContentLoaded', () => {
    mobileApp = new MobileInventoryApp();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}