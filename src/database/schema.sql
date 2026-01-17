-- Brelinx Inventory Management System Database Schema
-- SQLite database structure for inventory management

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system',
    updated_by TEXT DEFAULT 'system'
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_transactions table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'add', 'remove', 'adjust', 'sale', 'purchase'
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reason TEXT,
    reference_number TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system',
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create item_suppliers junction table
CREATE TABLE IF NOT EXISTS item_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    supplier_sku TEXT,
    cost_price DECIMAL(10,2),
    lead_time_days INTEGER,
    minimum_order_quantity INTEGER DEFAULT 1,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    UNIQUE(item_id, supplier_id)
);

-- Create locations table for warehouse management
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    location_type TEXT DEFAULT 'warehouse', -- 'warehouse', 'shelf', 'bin', 'room'
    parent_location_id INTEGER,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_location_id) REFERENCES locations(id)
);

-- Create item_locations junction table
CREATE TABLE IF NOT EXISTS item_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    date_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE(item_id, location_id)
);

-- Create settings table for application configuration
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    date_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_item_suppliers_item_id ON item_suppliers(item_id);
CREATE INDEX IF NOT EXISTS idx_item_locations_item_id ON item_locations(item_id);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description) VALUES 
('Electronics', 'Electronic devices and components'),
('Furniture', 'Office and home furniture'),
('Supplies', 'General office and business supplies'),
('Equipment', 'Tools and equipment'),
('Software', 'Software licenses and digital products');

-- Insert default settings
INSERT OR IGNORE INTO settings (setting_key, setting_value, setting_type, description) VALUES 
('low_stock_threshold', '5', 'number', 'Minimum quantity before item is considered low stock'),
('currency_symbol', '$', 'string', 'Currency symbol for price display'),
('company_name', 'Brelinx', 'string', 'Company name for reports and documents'),
('backup_frequency', '24', 'number', 'Hours between automatic backups'),
('enable_notifications', 'true', 'boolean', 'Enable low stock notifications');

-- Insert default location
INSERT OR IGNORE INTO locations (name, description, location_type) VALUES 
('Main Warehouse', 'Primary storage location', 'warehouse');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_inventory_items_timestamp 
    AFTER UPDATE ON inventory_items
    FOR EACH ROW
BEGIN
    UPDATE inventory_items SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_item_locations_timestamp 
    AFTER UPDATE ON item_locations
    FOR EACH ROW
BEGIN
    UPDATE item_locations SET date_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create trigger to log inventory changes
CREATE TRIGGER IF NOT EXISTS log_inventory_changes 
    AFTER UPDATE OF quantity ON inventory_items
    FOR EACH ROW
    WHEN OLD.quantity != NEW.quantity
BEGIN
    INSERT INTO inventory_transactions (
        item_id, 
        transaction_type, 
        quantity_change, 
        quantity_before, 
        quantity_after, 
        reason
    ) VALUES (
        NEW.id,
        'adjust',
        NEW.quantity - OLD.quantity,
        OLD.quantity,
        NEW.quantity,
        'Manual adjustment'
    );
END;