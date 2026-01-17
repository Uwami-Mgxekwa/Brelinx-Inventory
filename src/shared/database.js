const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '../database/inventory.db');
        this.schemaPath = path.join(__dirname, '../database/schema.sql');
    }

    // Initialize database connection
    async initialize() {
        try {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection
            this.db = new Database(this.dbPath);
            console.log('Connected to SQLite database');
            
            await this.createTables();
            return Promise.resolve();
        } catch (err) {
            console.error('Error opening database:', err);
            return Promise.reject(err);
        }
    }

    // Create tables if they don't exist
    async createTables() {
        try {
            let schema;
            if (fs.existsSync(this.schemaPath)) {
                schema = fs.readFileSync(this.schemaPath, 'utf8');
            } else {
                // Fallback schema if file doesn't exist
                schema = `
                    CREATE TABLE IF NOT EXISTS products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        sku TEXT UNIQUE NOT NULL,
                        category TEXT,
                        price DECIMAL(10,2) NOT NULL,
                        cost DECIMAL(10,2),
                        quantity INTEGER NOT NULL DEFAULT 0,
                        min_stock INTEGER DEFAULT 0,
                        max_stock INTEGER,
                        supplier TEXT,
                        barcode TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        description TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS suppliers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        contact_person TEXT,
                        email TEXT,
                        phone TEXT,
                        address TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS stock_movements (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        product_id INTEGER NOT NULL,
                        movement_type TEXT NOT NULL CHECK(movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
                        quantity INTEGER NOT NULL,
                        reason TEXT,
                        reference TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (product_id) REFERENCES products (id)
                    );
                `;
            }
            
            this.db.exec(schema);
            console.log('Database tables created successfully');
            return Promise.resolve();
        } catch (err) {
            console.error('Error creating tables:', err);
            return Promise.reject(err);
        }
    }

    // Product operations
    async addProduct(product) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO products (name, description, sku, category, price, cost, quantity, min_stock, max_stock, supplier, barcode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(
                product.name,
                product.description,
                product.sku,
                product.category,
                product.price,
                product.cost,
                product.quantity || 0,
                product.min_stock || 0,
                product.max_stock,
                product.supplier,
                product.barcode
            );
            
            return { id: result.lastInsertRowid, ...product };
        } catch (err) {
            throw err;
        }
    }

    async getProducts(filters = {}) {
        try {
            let sql = 'SELECT * FROM products WHERE 1=1';
            const params = [];

            if (filters.category) {
                sql += ' AND category = ?';
                params.push(filters.category);
            }

            if (filters.search) {
                sql += ' AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (filters.lowStock) {
                sql += ' AND quantity <= min_stock';
            }

            sql += ' ORDER BY name';

            const stmt = this.db.prepare(sql);
            return stmt.all(...params);
        } catch (err) {
            throw err;
        }
    }

    async getProductById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
            return stmt.get(id);
        } catch (err) {
            throw err;
        }
    }

    async updateProduct(id, updates) {
        try {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(id);

            const sql = `UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...values);
            
            return { changes: result.changes };
        } catch (err) {
            throw err;
        }
    }

    async deleteProduct(id) {
        try {
            const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
            const result = stmt.run(id);
            return { changes: result.changes };
        } catch (err) {
            throw err;
        }
    }

    // Stock movement operations
    async addStockMovement(productId, movementType, quantity, reason = '', reference = '') {
        const transaction = this.db.transaction(() => {
            // Add stock movement record
            const movementStmt = this.db.prepare(`
                INSERT INTO stock_movements (product_id, movement_type, quantity, reason, reference)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            const movementResult = movementStmt.run(productId, movementType, quantity, reason, reference);

            // Update product quantity
            let quantityChange = quantity;
            if (movementType === 'OUT') {
                quantityChange = -quantity;
            }

            const updateStmt = this.db.prepare('UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            updateStmt.run(quantityChange, productId);

            return { movementId: movementResult.lastInsertRowid, quantityChange };
        });

        try {
            return transaction();
        } catch (err) {
            throw err;
        }
    }

    async getStockMovements(productId = null, limit = 100) {
        try {
            let sql = `
                SELECT sm.*, p.name as product_name, p.sku
                FROM stock_movements sm
                JOIN products p ON sm.product_id = p.id
            `;
            const params = [];

            if (productId) {
                sql += ' WHERE sm.product_id = ?';
                params.push(productId);
            }

            sql += ' ORDER BY sm.created_at DESC LIMIT ?';
            params.push(limit);

            const stmt = this.db.prepare(sql);
            return stmt.all(...params);
        } catch (err) {
            throw err;
        }
    }

    // Category operations
    async addCategory(name, description = '') {
        try {
            const stmt = this.db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
            const result = stmt.run(name, description);
            return { id: result.lastInsertRowid, name, description };
        } catch (err) {
            throw err;
        }
    }

    async getCategories() {
        try {
            const stmt = this.db.prepare('SELECT * FROM categories ORDER BY name');
            return stmt.all();
        } catch (err) {
            throw err;
        }
    }

    // Supplier operations
    async addSupplier(supplier) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO suppliers (name, contact_person, email, phone, address)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(
                supplier.name,
                supplier.contact_person,
                supplier.email,
                supplier.phone,
                supplier.address
            );
            
            return { id: result.lastInsertRowid, ...supplier };
        } catch (err) {
            throw err;
        }
    }

    async getSuppliers() {
        try {
            const stmt = this.db.prepare('SELECT * FROM suppliers ORDER BY name');
            return stmt.all();
        } catch (err) {
            throw err;
        }
    }

    // Analytics and reports
    async getLowStockProducts() {
        try {
            const stmt = this.db.prepare('SELECT * FROM products WHERE quantity <= min_stock ORDER BY quantity ASC');
            return stmt.all();
        } catch (err) {
            throw err;
        }
    }

    async getInventoryValue() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    SUM(quantity * cost) as total_cost_value,
                    SUM(quantity * price) as total_retail_value,
                    COUNT(*) as total_products,
                    SUM(quantity) as total_quantity
                FROM products
            `);
            
            return stmt.get();
        } catch (err) {
            throw err;
        }
    }

    // Close database connection
    async close() {
        try {
            if (this.db) {
                this.db.close();
                console.log('Database connection closed');
            }
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

// Export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;