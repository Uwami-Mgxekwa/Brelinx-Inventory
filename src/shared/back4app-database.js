const { Parse } = require('./back4app-config');

class Back4AppDatabaseManager {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        try {
            // Test connection
            const TestObject = Parse.Object.extend("TestObject");
            const testObject = new TestObject();
            testObject.set("test", "connection");
            await testObject.save();
            await testObject.destroy();
            
            console.log('Back4App connection successful');
            this.initialized = true;
            return Promise.resolve();
        } catch (err) {
            console.error('Back4App connection failed:', err);
            return Promise.reject(err);
        }
    }

    // Product operations
    async addProduct(product) {
        try {
            const Product = Parse.Object.extend("Product");
            const productObj = new Product();
            
            productObj.set("name", product.name);
            productObj.set("description", product.description || "");
            productObj.set("sku", product.sku);
            productObj.set("category", product.category);
            productObj.set("price", parseFloat(product.price));
            productObj.set("cost", parseFloat(product.cost) || 0);
            productObj.set("quantity", parseInt(product.quantity) || 0);
            productObj.set("minStock", parseInt(product.min_stock) || 0);
            productObj.set("maxStock", parseInt(product.max_stock) || null);
            productObj.set("supplier", product.supplier || "");
            productObj.set("barcode", product.barcode || "");
            
            const result = await productObj.save();
            
            return {
                id: result.id,
                name: result.get('name'),
                description: result.get('description'),
                sku: result.get('sku'),
                category: result.get('category'),
                price: result.get('price'),
                cost: result.get('cost'),
                quantity: result.get('quantity'),
                min_stock: result.get('minStock'),
                max_stock: result.get('maxStock'),
                supplier: result.get('supplier'),
                barcode: result.get('barcode'),
                created_at: result.get('createdAt'),
                updated_at: result.get('updatedAt')
            };
        } catch (err) {
            throw err;
        }
    }

    async getProducts(filters = {}) {
        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            
            // Apply filters
            if (filters.category) {
                query.equalTo("category", filters.category);
            }
            
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const nameQuery = new Parse.Query(Product);
                nameQuery.matches("name", new RegExp(searchTerm, 'i'));
                
                const skuQuery = new Parse.Query(Product);
                skuQuery.matches("sku", new RegExp(searchTerm, 'i'));
                
                const descQuery = new Parse.Query(Product);
                descQuery.matches("description", new RegExp(searchTerm, 'i'));
                
                query._orQuery([nameQuery, skuQuery, descQuery]);
            }
            
            if (filters.lowStock) {
                query.lessThanOrEqualTo("quantity", query.get("minStock"));
            }
            
            // Order by name
            query.ascending("name");
            
            const results = await query.find();
            
            return results.map(product => ({
                id: product.id,
                name: product.get('name'),
                description: product.get('description'),
                sku: product.get('sku'),
                category: product.get('category'),
                price: product.get('price'),
                cost: product.get('cost'),
                quantity: product.get('quantity'),
                min_stock: product.get('minStock'),
                max_stock: product.get('maxStock'),
                supplier: product.get('supplier'),
                barcode: product.get('barcode'),
                created_at: product.get('createdAt'),
                updated_at: product.get('updatedAt')
            }));
        } catch (err) {
            throw err;
        }
    }

    async getProductById(id) {
        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            const product = await query.get(id);
            
            if (!product) return null;
            
            return {
                id: product.id,
                name: product.get('name'),
                description: product.get('description'),
                sku: product.get('sku'),
                category: product.get('category'),
                price: product.get('price'),
                cost: product.get('cost'),
                quantity: product.get('quantity'),
                min_stock: product.get('minStock'),
                max_stock: product.get('maxStock'),
                supplier: product.get('supplier'),
                barcode: product.get('barcode'),
                created_at: product.get('createdAt'),
                updated_at: product.get('updatedAt')
            };
        } catch (err) {
            throw err;
        }
    }

    async updateProduct(id, updates) {
        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            const product = await query.get(id);
            
            // Update fields
            Object.keys(updates).forEach(key => {
                let parseKey = key;
                let value = updates[key];
                
                // Map field names
                if (key === 'min_stock') parseKey = 'minStock';
                if (key === 'max_stock') parseKey = 'maxStock';
                
                // Convert types
                if (['price', 'cost'].includes(key)) value = parseFloat(value);
                if (['quantity', 'min_stock', 'max_stock'].includes(key)) value = parseInt(value);
                
                product.set(parseKey, value);
            });
            
            await product.save();
            return { changes: 1 };
        } catch (err) {
            throw err;
        }
    }

    async deleteProduct(id) {
        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            const product = await query.get(id);
            await product.destroy();
            return { changes: 1 };
        } catch (err) {
            throw err;
        }
    }

    // Stock movement operations
    async addStockMovement(productId, movementType, quantity, reason = '', reference = '') {
        try {
            // Create stock movement record
            const StockMovement = Parse.Object.extend("StockMovement");
            const movement = new StockMovement();
            
            movement.set("productId", productId);
            movement.set("movementType", movementType);
            movement.set("quantity", parseInt(quantity));
            movement.set("reason", reason);
            movement.set("reference", reference);
            
            const movementResult = await movement.save();
            
            // Update product quantity
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            const product = await query.get(productId);
            
            let quantityChange = parseInt(quantity);
            if (movementType === 'OUT') {
                quantityChange = -quantityChange;
            }
            
            const currentQuantity = product.get('quantity') || 0;
            product.set('quantity', currentQuantity + quantityChange);
            await product.save();
            
            return {
                movementId: movementResult.id,
                quantityChange: quantityChange
            };
        } catch (err) {
            throw err;
        }
    }

    async getStockMovements(productId = null, limit = 100) {
        try {
            const StockMovement = Parse.Object.extend("StockMovement");
            const query = new Parse.Query(StockMovement);
            
            if (productId) {
                query.equalTo("productId", productId);
            }
            
            query.descending("createdAt");
            query.limit(limit);
            
            const movements = await query.find();
            
            // Get product names for each movement
            const results = [];
            for (const movement of movements) {
                const productId = movement.get('productId');
                let productName = 'Unknown Product';
                let productSku = 'N/A';
                
                try {
                    const Product = Parse.Object.extend("Product");
                    const productQuery = new Parse.Query(Product);
                    const product = await productQuery.get(productId);
                    productName = product.get('name');
                    productSku = product.get('sku');
                } catch (err) {
                    console.warn('Could not fetch product details for movement:', err);
                }
                
                results.push({
                    id: movement.id,
                    product_id: productId,
                    movement_type: movement.get('movementType'),
                    quantity: movement.get('quantity'),
                    reason: movement.get('reason'),
                    reference: movement.get('reference'),
                    created_at: movement.get('createdAt'),
                    product_name: productName,
                    sku: productSku
                });
            }
            
            return results;
        } catch (err) {
            throw err;
        }
    }

    // Category operations
    async addCategory(name, description = '') {
        try {
            const Category = Parse.Object.extend("Category");
            const category = new Category();
            
            category.set("name", name);
            category.set("description", description);
            
            const result = await category.save();
            
            return {
                id: result.id,
                name: result.get('name'),
                description: result.get('description'),
                created_at: result.get('createdAt')
            };
        } catch (err) {
            throw err;
        }
    }

    async getCategories() {
        try {
            const Category = Parse.Object.extend("Category");
            const query = new Parse.Query(Category);
            query.ascending("name");
            
            const results = await query.find();
            
            return results.map(category => ({
                id: category.id,
                name: category.get('name'),
                description: category.get('description'),
                created_at: category.get('createdAt')
            }));
        } catch (err) {
            throw err;
        }
    }

    // Supplier operations
    async addSupplier(supplier) {
        try {
            const Supplier = Parse.Object.extend("Supplier");
            const supplierObj = new Supplier();
            
            supplierObj.set("name", supplier.name);
            supplierObj.set("contactPerson", supplier.contact_person || "");
            supplierObj.set("email", supplier.email || "");
            supplierObj.set("phone", supplier.phone || "");
            supplierObj.set("address", supplier.address || "");
            
            const result = await supplierObj.save();
            
            return {
                id: result.id,
                name: result.get('name'),
                contact_person: result.get('contactPerson'),
                email: result.get('email'),
                phone: result.get('phone'),
                address: result.get('address'),
                created_at: result.get('createdAt')
            };
        } catch (err) {
            throw err;
        }
    }

    async getSuppliers() {
        try {
            const Supplier = Parse.Object.extend("Supplier");
            const query = new Parse.Query(Supplier);
            query.ascending("name");
            
            const results = await query.find();
            
            return results.map(supplier => ({
                id: supplier.id,
                name: supplier.get('name'),
                contact_person: supplier.get('contactPerson'),
                email: supplier.get('email'),
                phone: supplier.get('phone'),
                address: supplier.get('address'),
                created_at: supplier.get('createdAt')
            }));
        } catch (err) {
            throw err;
        }
    }

    // Analytics and reports
    async getLowStockProducts() {
        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            
            // This is a simplified version - Parse doesn't support comparing fields directly
            // We'll fetch all products and filter client-side for now
            const allProducts = await query.find();
            
            const lowStockProducts = allProducts.filter(product => {
                const quantity = product.get('quantity') || 0;
                const minStock = product.get('minStock') || 0;
                return quantity <= minStock;
            });
            
            return lowStockProducts.map(product => ({
                id: product.id,
                name: product.get('name'),
                description: product.get('description'),
                sku: product.get('sku'),
                category: product.get('category'),
                price: product.get('price'),
                cost: product.get('cost'),
                quantity: product.get('quantity'),
                min_stock: product.get('minStock'),
                max_stock: product.get('maxStock'),
                supplier: product.get('supplier'),
                barcode: product.get('barcode'),
                created_at: product.get('createdAt'),
                updated_at: product.get('updatedAt')
            })).sort((a, b) => a.quantity - b.quantity);
        } catch (err) {
            throw err;
        }
    }

    async getInventoryValue() {
        try {
            const Product = Parse.Object.extend("Product");
            const query = new Parse.Query(Product);
            
            const products = await query.find();
            
            let totalCostValue = 0;
            let totalRetailValue = 0;
            let totalProducts = products.length;
            let totalQuantity = 0;
            
            products.forEach(product => {
                const quantity = product.get('quantity') || 0;
                const cost = product.get('cost') || 0;
                const price = product.get('price') || 0;
                
                totalCostValue += quantity * cost;
                totalRetailValue += quantity * price;
                totalQuantity += quantity;
            });
            
            return {
                total_cost_value: totalCostValue,
                total_retail_value: totalRetailValue,
                total_products: totalProducts,
                total_quantity: totalQuantity
            };
        } catch (err) {
            throw err;
        }
    }

    // Authentication methods
    async authenticateUser(username, password) {
        try {
            console.log('Back4App: Attempting to authenticate user:', username);
            const user = await Parse.User.logIn(username, password);
            console.log('Back4App: Authentication successful for:', username);
            
            return {
                success: true,
                session: {
                    username: user.get('username'),
                    sessionToken: user.getSessionToken(),
                    loginTime: new Date().toISOString(),
                    userId: user.id
                }
            };
        } catch (err) {
            console.error('Back4App: Authentication failed for:', username, err.message);
            return {
                success: false,
                error: err.message || 'Invalid credentials'
            };
        }
    }

    async checkSession(sessionToken) {
        try {
            if (!sessionToken) return { valid: false };
            
            // For now, let's use a simpler session validation
            // Parse.Session queries require master key which we shouldn't use in client
            const currentUser = Parse.User.current();
            if (currentUser && currentUser.getSessionToken() === sessionToken) {
                return {
                    valid: true,
                    session: {
                        username: currentUser.get('username'),
                        sessionToken: sessionToken,
                        userId: currentUser.id
                    }
                };
            }
            
            return { valid: false };
        } catch (err) {
            console.error('Session check error:', err);
            return { valid: false };
        }
    }

    async logout() {
        try {
            await Parse.User.logOut();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Close connection (not needed for Parse, but keeping interface consistent)
    async close() {
        console.log('Back4App connection closed');
        return Promise.resolve();
    }
}

// Export singleton instance
const back4AppManager = new Back4AppDatabaseManager();
module.exports = back4AppManager;