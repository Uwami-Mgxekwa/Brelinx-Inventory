// Main Application JavaScript
class InventoryApp {
    constructor() {
        this.currentView = 'dashboard';
        this.inventoryItems = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInventoryData();
        this.updateDashboard();
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
        // TODO: Implement toast notifications
        console.log('Success:', message);
    }

    showError(message) {
        // TODO: Implement toast notifications
        console.error('Error:', message);
    }

    showAbout() {
        alert('Brelinx Inventory Management System v1.0.0\nDeveloped by Brelinx.com');
    }
}

// Initialize the application
const app = new InventoryApp();

// Make app globally available for onclick handlers
window.app = app;