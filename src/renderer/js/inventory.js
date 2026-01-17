// Inventory-specific functionality
class InventoryManager {
    constructor() {
        this.items = [];
        this.categories = new Set();
        this.lowStockThreshold = 5;
    }

    // Add item to inventory
    addItem(item) {
        const newItem = {
            id: this.generateId(),
            name: item.name,
            sku: item.sku,
            category: item.category,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            description: item.description || '',
            dateAdded: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        this.items.push(newItem);
        this.categories.add(item.category);
        return newItem;
    }

    // Update existing item
    updateItem(id, updates) {
        const itemIndex = this.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            throw new Error('Item not found');
        }

        const item = this.items[itemIndex];
        Object.assign(item, updates, {
            lastUpdated: new Date().toISOString()
        });

        if (updates.category) {
            this.categories.add(updates.category);
        }

        return item;
    }

    // Remove item from inventory
    removeItem(id) {
        const itemIndex = this.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            throw new Error('Item not found');
        }

        const removedItem = this.items.splice(itemIndex, 1)[0];
        this.updateCategories();
        return removedItem;
    }

    // Get item by ID
    getItem(id) {
        return this.items.find(item => item.id === id);
    }

    // Get all items
    getAllItems() {
        return [...this.items];
    }

    // Search items
    searchItems(query) {
        const searchTerm = query.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }

    // Filter by category
    getItemsByCategory(category) {
        return this.items.filter(item => item.category === category);
    }

    // Get low stock items
    getLowStockItems() {
        return this.items.filter(item => item.quantity <= this.lowStockThreshold);
    }

    // Get out of stock items
    getOutOfStockItems() {
        return this.items.filter(item => item.quantity === 0);
    }

    // Get all categories
    getCategories() {
        return Array.from(this.categories).sort();
    }

    // Update stock quantity
    updateStock(id, quantity, operation = 'set') {
        const item = this.getItem(id);
        if (!item) {
            throw new Error('Item not found');
        }

        switch (operation) {
            case 'add':
                item.quantity += quantity;
                break;
            case 'subtract':
                item.quantity = Math.max(0, item.quantity - quantity);
                break;
            case 'set':
            default:
                item.quantity = Math.max(0, quantity);
                break;
        }

        item.lastUpdated = new Date().toISOString();
        return item;
    }

    // Calculate total inventory value
    getTotalValue() {
        return this.items.reduce((total, item) => {
            return total + (item.quantity * item.price);
        }, 0);
    }

    // Get inventory statistics
    getStatistics() {
        const totalItems = this.items.length;
        const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = this.getTotalValue();
        const lowStockCount = this.getLowStockItems().length;
        const outOfStockCount = this.getOutOfStockItems().length;
        const categoryCount = this.categories.size;

        return {
            totalItems,
            totalQuantity,
            totalValue,
            lowStockCount,
            outOfStockCount,
            categoryCount,
            averageItemValue: totalItems > 0 ? totalValue / totalItems : 0
        };
    }

    // Export inventory data
    exportData() {
        return {
            items: this.items,
            categories: Array.from(this.categories),
            exportDate: new Date().toISOString(),
            statistics: this.getStatistics()
        };
    }

    // Import inventory data
    importData(data) {
        if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Invalid import data format');
        }

        this.items = data.items;
        this.updateCategories();
        return this.items.length;
    }

    // Validate item data
    validateItem(item) {
        const errors = [];

        if (!item.name || item.name.trim().length === 0) {
            errors.push('Item name is required');
        }

        if (!item.sku || item.sku.trim().length === 0) {
            errors.push('SKU is required');
        }

        if (this.items.some(existingItem => existingItem.sku === item.sku && existingItem.id !== item.id)) {
            errors.push('SKU must be unique');
        }

        if (!item.category || item.category.trim().length === 0) {
            errors.push('Category is required');
        }

        if (item.quantity < 0) {
            errors.push('Quantity cannot be negative');
        }

        if (item.price < 0) {
            errors.push('Price cannot be negative');
        }

        return errors;
    }

    // Generate unique ID
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Update categories set
    updateCategories() {
        this.categories.clear();
        this.items.forEach(item => {
            this.categories.add(item.category);
        });
    }

    // Sort items
    sortItems(field, direction = 'asc') {
        this.items.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];

            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (direction === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return this.items;
    }

    // Generate SKU
    generateSKU(name, category) {
        const namePrefix = name.substring(0, 3).toUpperCase();
        const categoryPrefix = category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        return `${categoryPrefix}${namePrefix}${timestamp}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryManager;
} else {
    window.InventoryManager = InventoryManager;
}