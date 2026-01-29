// Brelinx Inventory Mobile App
// Back4App Configuration for mobile web app
const BACK4APP_CONFIG = {
    APP_ID: 'OdqSvGLQpSWYhPw1DOjlWfPomCUe2wkdni1dUr2e',
    JAVASCRIPT_KEY: 'nUnEGrYHCSbsXQJhvGNzEFpV0SOBSwZryBag9EE5',
    SERVER_URL: 'https://parseapi.back4app.com/'
};

// Initialize Parse for web
Parse.initialize(BACK4APP_CONFIG.APP_ID, BACK4APP_CONFIG.JAVASCRIPT_KEY);
Parse.serverURL = BACK4APP_CONFIG.SERVER_URL;

class MobileInventoryApp {
    constructor() {
        this.currentView = 'dashboard';
        this.products = [];
        this.categories = [];
        this.lowStockThreshold = 5;
        this.pinProtected = true;
        this.defaultPin = '1234';
        this.isAuthenticated = false;
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        console.log('Loading...');
        this.setupEventListeners();
        this.registerServiceWorker();
        this.setupPWA();
        
        // Check if user is already logged in
        const currentUser = Parse.User.current();
        if (currentUser) {
            this.currentUser = currentUser;
            this.isAuthenticated = true;
            await this.loadData();
        } else {
            // For demo purposes, auto-login as admin
            await this.autoLogin();
        }
        
        this.updateDashboard();
        console.log('Loading complete');
    }

    async autoLogin() {
        try {
            const user = await Parse.User.logIn('admin', 'admin123');
            this.currentUser = user;
            this.isAuthenticated = true;
            await this.loadData();
            this.showToast('Logged in successfully', 'success');
        } catch (error) {
            console.error('Auto-login failed:', error);
            this.showToast('Authentication failed', 'error');
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleNav());
        document.getElementById('navClose').addEventListener('click', () => this.closeNav());
        document.getElementById('overlay').addEventListener('click', () => this.closeNav());

        // Handle window resize for responsive behavior
        window.addEventListener('resize', () => this.handleResize());

        // View navigation
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.getAttribute('data-view');
                this.showView(view);
            });
        });

        // Dashboard quick actions
        document.getElementById('addItemBtn').addEventListener('click', () => this.showAddItemModal());
        document.getElementById('viewInventoryBtn').addEventListener('click', () => this.showView('inventory'));
        document.getElementById('lowStockBtn').addEventListener('click', () => this.showView('low-stock'));
        document.getElementById('reportsBtn').addEventListener('click', () => this.showView('reports'));
        document.getElementById('fabBtn').addEventListener('click', () => this.showAddItemModal());

        // Refresh buttons
        document.getElementById('refreshInventoryBtn').addEventListener('click', () => this.refreshInventory());
        document.getElementById('refreshLowStockBtn').addEventListener('click', () => this.refreshLowStock());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchInventory(e.target.value));

        // Add item modal
        document.getElementById('closeAddModal').addEventListener('click', () => this.closeAddItemModal());
        document.getElementById('cancelAddBtn').addEventListener('click', () => this.closeAddItemModal());
        document.getElementById('addItemForm').addEventListener('submit', (e) => this.handleAddItem(e));

        // Categories
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.showAddCategoryModal());

        // Reports
        document.getElementById('exportReportsBtn').addEventListener('click', () => this.exportReports());

        // Close nav when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const nav = document.getElementById('mobileNav');
            const menuToggle = document.getElementById('menuToggle');
            
            if (window.innerWidth < 1024 && 
                nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                this.closeNav();
            }
        });
    }

    handleResize() {
        // Close nav on resize to prevent layout issues
        if (window.innerWidth >= 1024) {
            // Desktop view - ensure nav is visible and overlay is hidden
            const nav = document.getElementById('mobileNav');
            const overlay = document.getElementById('overlay');
            nav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    setupPWA() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button or prompt
            setTimeout(() => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                        }
                        deferredPrompt = null;
                    });
                }
            }, 3000);
        });
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadProducts(),
                this.loadCategories()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error loading data', 'error');
        }
    }

    async loadProducts() {
        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            query.ascending("name");
            
            const results = await query.find();
            
            this.products = results.map(product => ({
                id: product.id,
                name: product.get('name'),
                description: product.get('description') || '',
                sku: product.get('sku'),
                category: product.get('category'),
                price: product.get('price') || 0,
                cost: product.get('cost') || 0,
                quantity: product.get('quantity') || 0,
                min_stock: product.get('minStock') || 0,
                max_stock: product.get('maxStock') || null,
                supplier: product.get('supplier') || '',
                barcode: product.get('barcode') || '',
                created_at: product.get('createdAt'),
                updated_at: product.get('updatedAt')
            }));
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

    async loadCategories() {
        try {
            const Category = Parse.Object.extend("Category");
            const query = new Parse.Query(Category);
            query.ascending("name");
            
            const results = await query.find();
            
            this.categories = results.map(category => ({
                id: category.id,
                name: category.get('name'),
                description: category.get('description') || '',
                created_at: category.get('createdAt')
            }));
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    toggleNav() {
        const nav = document.getElementById('mobileNav');
        const overlay = document.getElementById('overlay');
        
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Prevent body scroll when nav is open
        if (nav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeNav() {
        const nav = document.getElementById('mobileNav');
        const overlay = document.getElementById('overlay');
        
        nav.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
            link.classList.remove('active');
        });

        document.querySelectorAll(`[data-view="${viewName}"]`).forEach(link => {
            link.classList.add('active');
        });

        this.currentView = viewName;
        
        // Always close nav on mobile when switching views
        this.closeNav();

        // Load view-specific data
        switch (viewName) {
            case 'inventory':
                this.renderInventory();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'low-stock':
                this.renderLowStock();
                break;
            case 'reports':
                this.renderReports();
                break;
            case 'settings':
                this.renderSettings();
                break;
            case 'dashboard':
                this.updateDashboard();
                break;
        }
    }

    updateDashboard() {
        const totalItems = this.products.length; // Count of unique products (matches desktop)
        const totalQuantity = this.products.reduce((sum, product) => sum + product.quantity, 0); // Total quantity in stock
        const lowStockItems = this.products.filter(product => product.quantity <= product.min_stock).length;
        const totalCategories = [...new Set(this.products.map(p => p.category))].length;
        const totalValue = this.products.reduce((sum, product) => sum + (product.quantity * product.price), 0);

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('totalCategories').textContent = totalCategories;
        
        // Apply PIN protection to value display
        if (this.pinProtected) {
            document.getElementById('totalValue').textContent = this.formatProtectedValue(totalValue);
        } else {
            document.getElementById('totalValue').textContent = `R${totalValue.toFixed(2)}`;
        }
    }

    formatProtectedValue(value) {
        const valueStr = value.toFixed(2);
        const parts = valueStr.split('.');
        const hiddenInteger = 'R' + '*'.repeat(parts[0].length);
        return `${hiddenInteger}.${parts[1]}`;
    }

    renderInventory() {
        const container = document.getElementById('inventoryList');
        
        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <p>No inventory items found</p>
                </div>
            `;
            return;
        }

        const html = this.products.map(product => {
            const stockStatus = product.quantity <= product.min_stock ? 'danger' : 
                               product.quantity <= (product.min_stock * 2) ? 'warning' : 'success';
            
            const displayPrice = this.pinProtected ? this.formatProtectedValue(product.price) : `R${product.price.toFixed(2)}`;
            
            return `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${product.name}</div>
                        <div class="list-item-subtitle">
                            SKU: ${product.sku} | Category: ${product.category} | Price: ${displayPrice}
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <span class="badge badge-${stockStatus}">Stock: ${product.quantity}</span>
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-small btn-secondary" onclick="app.editProduct('${product.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteProduct('${product.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    renderCategories() {
        const container = document.getElementById('categoriesList');
        
        // Get category statistics
        const categoryStats = {};
        this.products.forEach(product => {
            if (!categoryStats[product.category]) {
                categoryStats[product.category] = { count: 0, value: 0 };
            }
            categoryStats[product.category].count += product.quantity;
            categoryStats[product.category].value += product.quantity * product.price;
        });

        const uniqueCategories = [...new Set(this.products.map(p => p.category))];

        if (uniqueCategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <p>No categories found</p>
                </div>
            `;
            return;
        }

        const html = uniqueCategories.map(category => {
            const stats = categoryStats[category] || { count: 0, value: 0 };
            const displayValue = this.pinProtected ? this.formatProtectedValue(stats.value) : `R${stats.value.toFixed(2)}`;
            
            return `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${category}</div>
                        <div class="list-item-subtitle">
                            ${stats.count} items | Value: ${displayValue}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    renderLowStock() {
        const container = document.getElementById('lowStockList');
        const lowStockProducts = this.products.filter(product => product.quantity <= product.min_stock);

        if (lowStockProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p>All items are well stocked!</p>
                </div>
            `;
            return;
        }

        const html = lowStockProducts.map(product => {
            const displayPrice = this.pinProtected ? this.formatProtectedValue(product.price) : `R${product.price.toFixed(2)}`;
            
            return `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${product.name}</div>
                        <div class="list-item-subtitle">
                            SKU: ${product.sku} | Price: ${displayPrice}
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <span class="badge badge-danger">Stock: ${product.quantity} (Min: ${product.min_stock})</span>
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-small btn-primary" onclick="app.quickRestock('${product.id}')">Restock</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    renderReports() {
        const container = document.getElementById('reportsContent');
        
        const totalProducts = this.products.length; // Count of unique products
        const totalQuantity = this.products.reduce((sum, product) => sum + product.quantity, 0); // Total items in stock
        const lowStockItems = this.products.filter(product => product.quantity <= product.min_stock).length;
        const totalValue = this.products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
        const totalCost = this.products.reduce((sum, product) => sum + (product.quantity * product.cost), 0);
        
        const displayTotalValue = this.pinProtected ? this.formatProtectedValue(totalValue) : `R${totalValue.toFixed(2)}`;
        const displayTotalCost = this.pinProtected ? this.formatProtectedValue(totalCost) : `R${totalCost.toFixed(2)}`;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${totalProducts}</span>
                    <div class="stat-label">Products</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${totalQuantity}</span>
                    <div class="stat-label">Items in Stock</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${lowStockItems}</span>
                    <div class="stat-label">Low Stock</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${displayTotalValue}</span>
                    <div class="stat-label">Total Value</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Inventory Summary</h3>
                </div>
                <div class="card-body">
                    <p><strong>Total Products:</strong> ${totalProducts}</p>
                    <p><strong>Total Items in Stock:</strong> ${totalQuantity}</p>
                    <p><strong>Low Stock Alerts:</strong> ${lowStockItems}</p>
                    <p><strong>Total Inventory Value:</strong> ${displayTotalValue}</p>
                    <p><strong>Total Inventory Cost:</strong> ${displayTotalCost}</p>
                    <p><strong>Categories:</strong> ${[...new Set(this.products.map(p => p.category))].length}</p>
                </div>
            </div>
        `;
    }

    renderSettings() {
        const container = document.getElementById('settingsContent');
        
        container.innerHTML = `
            <div class="form-group">
                <label class="form-label">PIN Protection</label>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" ${this.pinProtected ? 'checked' : ''} onchange="app.togglePinProtection()">
                        Hide inventory values
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Low Stock Threshold</label>
                <input type="number" class="form-control" value="${this.lowStockThreshold}" 
                       onchange="app.updateLowStockThreshold(this.value)" min="1">
            </div>
            
            <div class="form-group">
                <label class="form-label">Account Information</label>
                <p><strong>Username:</strong> ${this.currentUser ? this.currentUser.get('username') : 'Not logged in'}</p>
                <p><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="form-group">
                <button class="btn btn-danger" onclick="app.logout()">Logout</button>
            </div>
        `;
    }

    searchInventory(searchTerm) {
        if (!searchTerm) {
            this.renderInventory();
            return;
        }

        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const container = document.getElementById('inventoryList');
        
        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>No items found matching "${searchTerm}"</p>
                </div>
            `;
            return;
        }

        const html = filteredProducts.map(product => {
            const stockStatus = product.quantity <= product.min_stock ? 'danger' : 
                               product.quantity <= (product.min_stock * 2) ? 'warning' : 'success';
            
            const displayPrice = this.pinProtected ? this.formatProtectedValue(product.price) : `R${product.price.toFixed(2)}`;
            
            return `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${product.name}</div>
                        <div class="list-item-subtitle">
                            SKU: ${product.sku} | Category: ${product.category} | Price: ${displayPrice}
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <span class="badge badge-${stockStatus}">Stock: ${product.quantity}</span>
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-small btn-secondary" onclick="app.editProduct('${product.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteProduct('${product.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    showAddItemModal() {
        document.getElementById('addItemModal').classList.add('active');
    }

    closeAddItemModal() {
        document.getElementById('addItemModal').classList.remove('active');
        document.getElementById('addItemForm').reset();
    }

    async handleAddItem(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const productData = {
            name: document.getElementById('itemName').value,
            sku: document.getElementById('itemSku').value,
            category: document.getElementById('itemCategory').value,
            quantity: parseInt(document.getElementById('itemQuantity').value),
            price: parseFloat(document.getElementById('itemPrice').value),
            description: document.getElementById('itemDescription').value,
            cost: 0,
            min_stock: 5,
            supplier: '',
            barcode: ''
        };

        try {
            const Product = Parse.Object.extend("Product");
            const product = new Product();
            
            product.set("name", productData.name);
            product.set("description", productData.description);
            product.set("sku", productData.sku);
            product.set("category", productData.category);
            product.set("price", productData.price);
            product.set("cost", productData.cost);
            product.set("quantity", productData.quantity);
            product.set("minStock", productData.min_stock);
            product.set("supplier", productData.supplier);
            product.set("barcode", productData.barcode);
            
            await product.save();
            
            this.showToast('Item added successfully', 'success');
            this.closeAddItemModal();
            await this.loadProducts();
            this.updateDashboard();
            
            if (this.currentView === 'inventory') {
                this.renderInventory();
            }
        } catch (error) {
            console.error('Error adding item:', error);
            this.showToast('Error adding item', 'error');
        }
    }

    async refreshInventory() {
        const btn = document.getElementById('refreshInventoryBtn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>';
        btn.disabled = true;
        
        try {
            await this.loadProducts();
            this.renderInventory();
            this.updateDashboard();
            this.showToast('Inventory refreshed', 'success');
        } catch (error) {
            this.showToast('Error refreshing inventory', 'error');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }

    async refreshLowStock() {
        const btn = document.getElementById('refreshLowStockBtn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>';
        btn.disabled = true;
        
        try {
            await this.loadProducts();
            this.renderLowStock();
            this.updateDashboard();
            this.showToast('Low stock refreshed', 'success');
        } catch (error) {
            this.showToast('Error refreshing low stock', 'error');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }

    async quickRestock(productId) {
        const quantity = prompt('Enter restock quantity:');
        if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
            return;
        }

        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            const product = await query.get(productId);
            
            const currentQuantity = product.get('quantity') || 0;
            product.set('quantity', currentQuantity + parseInt(quantity));
            
            await product.save();
            
            this.showToast(`Restocked ${quantity} items`, 'success');
            await this.loadProducts();
            this.renderLowStock();
            this.updateDashboard();
        } catch (error) {
            console.error('Error restocking:', error);
            this.showToast('Error restocking item', 'error');
        }
    }

    async editProduct(productId) {
        // For now, just show an alert - full edit modal would be implemented later
        this.showToast('Edit functionality coming soon', 'info');
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            const product = await query.get(productId);
            
            await product.destroy();
            
            this.showToast('Item deleted successfully', 'success');
            await this.loadProducts();
            this.renderInventory();
            this.updateDashboard();
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showToast('Error deleting item', 'error');
        }
    }

    togglePinProtection() {
        this.pinProtected = !this.pinProtected;
        this.updateDashboard();
        
        if (this.currentView === 'inventory') {
            this.renderInventory();
        } else if (this.currentView === 'categories') {
            this.renderCategories();
        } else if (this.currentView === 'low-stock') {
            this.renderLowStock();
        } else if (this.currentView === 'reports') {
            this.renderReports();
        }
        
        this.showToast(`PIN protection ${this.pinProtected ? 'enabled' : 'disabled'}`, 'success');
    }

    updateLowStockThreshold(value) {
        this.lowStockThreshold = parseInt(value);
        this.showToast('Low stock threshold updated', 'success');
    }

    async logout() {
        try {
            await Parse.User.logOut();
            this.currentUser = null;
            this.isAuthenticated = false;
            this.showToast('Logged out successfully', 'success');
            
            // Redirect or show login screen
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Error logging out', 'error');
        }
    }

    exportReports() {
        const reportData = {
            generated: new Date().toISOString(),
            summary: {
                totalProducts: this.products.length,
                totalQuantity: this.products.reduce((sum, product) => sum + product.quantity, 0),
                lowStockItems: this.products.filter(product => product.quantity <= product.min_stock).length,
                totalValue: this.products.reduce((sum, product) => sum + (product.quantity * product.price), 0)
            },
            products: this.products
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Report exported successfully', 'success');
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MobileInventoryApp();
});