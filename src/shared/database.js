const sqlite3 = require('sqlite3').verbose();
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
        return new Promise((resolve, reject) => {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                    return;
                }
                
                console.log('Connected to SQLite database');
                this.createTables()
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    // Create tables if they don't exist
    async createTables() {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(this.schemaPath)) {
                const schema = fs.readFileSync(this.schemaPath, 'utf8');
                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error creating tables:', err);
                        reject(err);
                    } else {
                        console.log('Database tables created successfully');
                        resolve();
                    }
                });
            } else {
                // Fallback schema if file doesn't exist
                const fallbackSchema = `
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
                
                this.db.exec(fallbackSchema, (err) => {
                    if (err) {
                        console.error('Error creating fallback tables:', err);
                        reject(err);
                    } else {
                        console.log('Fallback database tables created successfully');
                        resolve();
                    }
                });
            }
        });
    }

    // Product operations
    async addProduct(product) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO products (name, description, sku, category, price, cost, quantity, min_stock, max_stock, supplier, barcode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
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
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...product });
                }
            });
        });
    }

    async getProducts(filters = {}) {
        return new Promise((resolve, reject) => {
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

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getProductById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products WHERE id = ?';
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateProduct(id, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(id);

            const sql = `UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async deleteProduct(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM products WHERE id = ?';
            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Stock movement operations
    async addStockMovement(productId, movementType, quantity, reason = '', reference = '') {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');

                // Add stock movement record
                const movementSql = `
                    INSERT INTO stock_movements (product_id, movement_type, quantity, reason, reference)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                this.db.run(movementSql, [productId, movementType, quantity, reason, reference], function(err) {
                    if (err) {
                        this.db.run('ROLLBACK');
                        reject(err);
                        return;
                    }

                    // Update product quantity
                    let quantityChange = quantity;
                    if (movementType === 'OUT') {
                        quantityChange = -quantity;
                    }

                    const updateSql = 'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                    
                    this.db.run(updateSql, [quantityChange, productId], function(err) {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            this.db.run('COMMIT');
                            resolve({ movementId: this.lastID, quantityChange });
                        }
                    });
                });
            });
        });
    }

    async getStockMovements(productId = null, limit = 100) {
        return new Promise((resolve, reject) => {
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

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Category operations
    async addCategory(name, description = '') {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO categories (name, description) VALUES (?, ?)';
            this.db.run(sql, [name, description], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, name, description });
                }
            });
        });
    }

    async getCategories() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM categories ORDER BY name';
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Supplier operations
    async addSupplier(supplier) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO suppliers (name, contact_person, email, phone, address)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                supplier.name,
                supplier.contact_person,
                supplier.email,
                supplier.phone,
                supplier.address
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...supplier });
                }
            });
        });
    }

    async getSuppliers() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM suppliers ORDER BY name';
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Analytics and reports
    async getLowStockProducts() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products WHERE quantity <= min_stock ORDER BY quantity ASC';
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getInventoryValue() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    SUM(quantity * cost) as total_cost_value,
                    SUM(quantity * price) as total_retail_value,
                    COUNT(*) as total_products,
                    SUM(quantity) as total_quantity
                FROM products
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Close database connection
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;