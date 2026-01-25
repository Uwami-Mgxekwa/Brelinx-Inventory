// CSV Import functionality
class CSVImporter {
    constructor() {
        this.setupImportModal();
    }

    setupImportModal() {
        // Add import button to header
        this.addImportButton();
        
        // Create import modal
        this.createImportModal();
    }

    addImportButton() {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const importBtn = document.createElement('button');
            importBtn.id = 'importBtn';
            importBtn.className = 'btn btn-secondary';
            importBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
                Import CSV/TXT
            `;
            
            // Insert before the logout button
            const logoutBtn = document.getElementById('logoutBtn');
            headerActions.insertBefore(importBtn, logoutBtn);
            
            importBtn.addEventListener('click', () => this.showImportModal());
        }
    }

    createImportModal() {
        const modalHTML = `
            <div id="importModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Import Products from CSV/TXT File</h3>
                        <button class="modal-close" id="importModalClose">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="import-instructions">
                            <h4>File Format Requirements:</h4>
                            <p>Your CSV or TXT file should have these columns (in any order):</p>
                            <div class="csv-format">
                                <code>name, sku, category, price, cost, quantity, min_stock, max_stock, supplier, barcode, description</code>
                            </div>
                            <p><strong>Required fields:</strong> name, sku, category, price, quantity</p>
                            <p><strong>Optional fields:</strong> cost, min_stock, max_stock, supplier, barcode, description</p>
                            <div class="format-examples">
                                <p><strong>CSV format:</strong> Values separated by commas (,)</p>
                                <p><strong>TXT format:</strong> Values separated by tabs or commas</p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="csvFile">Select CSV or TXT File:</label>
                            <input type="file" id="csvFile" accept=".csv,.txt" class="file-input">
                            <small class="file-help">Supported formats: CSV (comma-separated) or TXT (tab-separated or comma-separated)</small>
                        </div>
                        
                        <div id="csvPreview" class="csv-preview" style="display: none;">
                            <h4>Preview (First 5 rows):</h4>
                            <div id="previewTable"></div>
                        </div>
                        
                        <div id="importProgress" class="import-progress" style="display: none;">
                            <div class="progress-bar">
                                <div id="progressFill" class="progress-fill"></div>
                            </div>
                            <p id="progressText">Importing...</p>
                        </div>
                        
                        <div id="importResults" class="import-results" style="display: none;">
                            <h4>Import Results:</h4>
                            <div id="resultsContent"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelImportBtn">Cancel</button>
                        <button type="button" class="btn btn-primary" id="startImportBtn" disabled>
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Import Products
                        </button>
                        <a href="#" id="downloadTemplateBtn" class="btn btn-outline">Download CSV Template</a>
                        <a href="#" id="downloadTxtTemplateBtn" class="btn btn-outline">Download TXT Template</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupImportEventListeners();
    }

    setupImportEventListeners() {
        // File input change
        document.getElementById('csvFile').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });
        
        // Modal close
        document.getElementById('importModalClose').addEventListener('click', () => {
            this.hideImportModal();
        });
        
        document.getElementById('cancelImportBtn').addEventListener('click', () => {
            this.hideImportModal();
        });
        
        // Start import
        document.getElementById('startImportBtn').addEventListener('click', () => {
            this.startImport();
        });
        
        // Download CSV template
        document.getElementById('downloadTemplateBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadTemplate('csv');
        });
        
        // Download TXT template
        document.getElementById('downloadTxtTemplateBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadTemplate('txt');
        });
        
        // Close modal when clicking outside
        document.getElementById('importModal').addEventListener('click', (e) => {
            if (e.target.id === 'importModal') {
                this.hideImportModal();
            }
        });
    }

    showImportModal() {
        document.getElementById('importModal').classList.add('active');
        this.resetModal();
    }

    hideImportModal() {
        document.getElementById('importModal').classList.remove('active');
        this.resetModal();
    }

    resetModal() {
        document.getElementById('csvFile').value = '';
        document.getElementById('csvPreview').style.display = 'none';
        document.getElementById('importProgress').style.display = 'none';
        document.getElementById('importResults').style.display = 'none';
        document.getElementById('startImportBtn').disabled = true;
        this.csvData = null;
    }

    async handleFileSelect(file) {
        if (!file) return;
        
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
            alert('Please select a CSV or TXT file.');
            return;
        }
        
        try {
            const text = await this.readFileAsText(file);
            this.parseFile(text, fileName);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    parseFile(fileText, fileName) {
        let results;
        
        if (fileName.endsWith('.txt')) {
            // Try tab-separated first, then comma-separated for TXT files
            results = this.parseTXT(fileText);
        } else {
            // CSV files
            results = this.parseCSV(fileText);
        }
        
        if (results.length === 0) {
            alert('File appears to be empty or has invalid format.');
            return;
        }
        
        this.csvData = results;
        this.showPreview(results.slice(0, 5)); // Show first 5 rows
        document.getElementById('startImportBtn').disabled = false;
    }

    parseCSV(csvText) {
        return this.parseDelimitedText(csvText, ',');
    }

    parseTXT(txtText) {
        // First try tab-separated
        let results = this.parseDelimitedText(txtText, '\t');
        
        // If tab-separated doesn't work well, try comma-separated
        if (results.length === 0 || (results.length > 0 && Object.keys(results[0]).length === 1)) {
            results = this.parseDelimitedText(txtText, ',');
        }
        
        return results;
    }

    // Enhanced parser that handles both CSV and TXT formats
    parseDelimitedText(text, delimiter) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        // Parse headers
        const headers = this.parseLine(lines[0], delimiter).map(h => h.trim().toLowerCase());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseLine(lines[i], delimiter);
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim() : '';
                });
                data.push(row);
            }
        }
        
        return data;
    }

    // Parse a single line handling quoted values
    parseLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result.map(value => value.replace(/^"|"$/g, '')); // Remove surrounding quotes
    }

    showPreview(previewData) {
        const previewDiv = document.getElementById('csvPreview');
        const tableDiv = document.getElementById('previewTable');
        
        if (previewData.length === 0) {
            tableDiv.innerHTML = '<p>No valid data found in CSV.</p>';
            previewDiv.style.display = 'block';
            return;
        }
        
        const headers = Object.keys(previewData[0]);
        let tableHTML = '<table class="preview-table"><thead><tr>';
        
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        previewData.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => {
                tableHTML += `<td>${row[header] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        tableDiv.innerHTML = tableHTML;
        previewDiv.style.display = 'block';
    }

    async startImport() {
        if (!this.csvData || this.csvData.length === 0) {
            alert('No data to import.');
            return;
        }
        
        const progressDiv = document.getElementById('importProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const resultsDiv = document.getElementById('importResults');
        const resultsContent = document.getElementById('resultsContent');
        
        progressDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        
        let successful = 0;
        let failed = 0;
        const errors = [];
        
        for (let i = 0; i < this.csvData.length; i++) {
            const row = this.csvData[i];
            const progress = ((i + 1) / this.csvData.length) * 100;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Importing ${i + 1} of ${this.csvData.length}...`;
            
            try {
                await this.importRow(row);
                successful++;
            } catch (error) {
                failed++;
                errors.push(`Row ${i + 1}: ${error.message}`);
                console.error(`Import error for row ${i + 1}:`, error);
            }
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Show results
        progressDiv.style.display = 'none';
        resultsContent.innerHTML = `
            <div class="import-summary">
                <p><strong>Import Complete!</strong></p>
                <p>✅ Successfully imported: ${successful} products</p>
                ${failed > 0 ? `<p>❌ Failed: ${failed} products</p>` : ''}
            </div>
            ${errors.length > 0 ? `
                <div class="import-errors">
                    <h5>Errors:</h5>
                    <ul>
                        ${errors.slice(0, 10).map(error => `<li>${error}</li>`).join('')}
                        ${errors.length > 10 ? `<li>... and ${errors.length - 10} more errors</li>` : ''}
                    </ul>
                </div>
            ` : ''}
        `;
        resultsDiv.style.display = 'block';
        
        // Refresh the inventory table if we're on the inventory view
        if (window.app && typeof window.app.loadInventoryData === 'function') {
            await window.app.loadInventoryData();
        }
    }

    async importRow(row) {
        // Validate required fields
        if (!row.name || !row.sku || !row.category || !row.price || !row.quantity) {
            throw new Error('Missing required fields (name, sku, category, price, quantity)');
        }
        
        // Prepare product data
        const product = {
            name: row.name,
            sku: row.sku,
            category: row.category,
            price: parseFloat(row.price) || 0,
            cost: parseFloat(row.cost) || 0,
            quantity: parseInt(row.quantity) || 0,
            min_stock: parseInt(row.min_stock) || 0,
            max_stock: parseInt(row.max_stock) || null,
            supplier: row.supplier || '',
            barcode: row.barcode || '',
            description: row.description || ''
        };
        
        // Validate data types
        if (isNaN(product.price) || product.price < 0) {
            throw new Error('Invalid price value');
        }
        
        if (isNaN(product.quantity) || product.quantity < 0) {
            throw new Error('Invalid quantity value');
        }
        
        // Import via Electron API
        if (window.electronAPI && window.electronAPI.addInventoryItem) {
            const result = await window.electronAPI.addInventoryItem(product);
            if (!result.success) {
                throw new Error(result.error || 'Failed to add product');
            }
        } else {
            throw new Error('Electron API not available');
        }
    }

    downloadTemplate(format = 'csv') {
        let template, filename, mimeType;
        
        if (format === 'txt') {
            // Tab-separated format for TXT
            template = `name\tsku\tcategory\tprice\tcost\tquantity\tmin_stock\tmax_stock\tsupplier\tbarcode\tdescription
Laptop Computer\tLAP001\tElectronics\t999.99\t750.00\t15\t5\t50\tTech Supplier\t123456789012\tHigh-performance laptop
Office Chair\tCHR001\tFurniture\t299.99\t200.00\t8\t2\t20\tOffice Supplies Inc\t234567890123\tErgonomic office chair
Wireless Mouse\tMOU001\tElectronics\t49.99\t25.00\t25\t10\t100\tTech Supplier\t345678901234\tBluetooth wireless mouse`;
            filename = 'inventory_template.txt';
            mimeType = 'text/plain';
        } else {
            // Comma-separated format for CSV
            template = `name,sku,category,price,cost,quantity,min_stock,max_stock,supplier,barcode,description
"Laptop Computer","LAP001","Electronics",999.99,750.00,15,5,50,"Tech Supplier","123456789012","High-performance laptop"
"Office Chair","CHR001","Furniture",299.99,200.00,8,2,20,"Office Supplies Inc","234567890123","Ergonomic office chair"
"Wireless Mouse","MOU001","Electronics",49.99,25.00,25,10,100,"Tech Supplier","345678901234","Bluetooth wireless mouse"`;
            filename = 'inventory_template.csv';
            mimeType = 'text/csv';
        }
        
        const blob = new Blob([template], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize CSV importer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other components are loaded
    setTimeout(() => {
        if (document.querySelector('.header-actions')) {
            new CSVImporter();
        }
    }, 1000);
});