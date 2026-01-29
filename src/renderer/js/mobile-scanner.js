// Mobile Scanner JavaScript
class MobileScanner {
    constructor() {
        this.codeReader = null;
        this.scanning = false;
        this.recentScans = JSON.parse(localStorage.getItem('recentScans') || '[]');
        this.apiEndpoint = this.getApiEndpoint();
        
        this.init();
    }

    getApiEndpoint() {
        // Get the API endpoint from URL parameters or use default
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('api') || 'http://localhost:3000'; // Default for development
    }

    init() {
        this.setupEventListeners();
        this.loadRecentScans();
        this.checkCameraPermissions();
    }

    setupEventListeners() {
        // Start/Stop scanning button
        document.getElementById('startScanBtn').addEventListener('click', () => {
            this.toggleScanning();
        });

        // Clear recent scans
        document.getElementById('clearScansBtn').addEventListener('click', () => {
            this.clearRecentScans();
        });

        // Manual barcode input
        document.getElementById('manualBarcodeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processManualBarcode();
        });

        // Back to main app
        document.getElementById('backToMainBtn').addEventListener('click', () => {
            this.goBackToMain();
        });

        // Settings toggle
        document.getElementById('settingsToggle').addEventListener('click', () => {
            this.toggleSettings();
        });

        // API endpoint form
        document.getElementById('apiEndpointForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateApiEndpoint();
        });

        // Flash toggle
        document.getElementById('flashToggle').addEventListener('click', () => {
            this.toggleFlash();
        });

        // Camera switch
        document.getElementById('cameraSwitchBtn').addEventListener('click', () => {
            this.switchCamera();
        });
    }

    async checkCameraPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            this.showStatus('Camera access granted', 'success');
        } catch (error) {
            console.error('Camera permission denied:', error);
            this.showStatus('Camera access denied. Please enable camera permissions.', 'error');
            document.getElementById('startScanBtn').disabled = true;
        }
    }

    async toggleScanning() {
        if (this.scanning) {
            this.stopScanning();
        } else {
            await this.startScanning();
        }
    }

    async startScanning() {
        try {
            // Import ZXing library dynamically if not already loaded
            if (!window.ZXing) {
                await this.loadZXingLibrary();
            }

            this.codeReader = new ZXing.BrowserMultiFormatReader();
            
            // Get available video devices
            const videoInputDevices = await this.codeReader.listVideoInputDevices();
            
            if (videoInputDevices.length === 0) {
                throw new Error('No camera devices found');
            }

            // Use the first available camera (usually back camera on mobile)
            const selectedDeviceId = videoInputDevices[0].deviceId;

            this.scanning = true;
            this.updateScanButton();
            this.showStatus('Starting camera...', 'info');

            // Start scanning
            this.codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
                if (result) {
                    this.handleScanResult(result.text);
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Scan error:', err);
                }
            });

            this.showStatus('Scanning... Point camera at barcode', 'success');

        } catch (error) {
            console.error('Failed to start scanning:', error);
            this.showStatus(`Failed to start camera: ${error.message}`, 'error');
            this.scanning = false;
            this.updateScanButton();
        }
    }

    stopScanning() {
        if (this.codeReader) {
            this.codeReader.reset();
            this.codeReader = null;
        }
        
        this.scanning = false;
        this.updateScanButton();
        this.showStatus('Scanning stopped', 'info');
    }

    updateScanButton() {
        const btn = document.getElementById('startScanBtn');
        const icon = btn.querySelector('.btn-icon');
        const text = btn.querySelector('.btn-text');
        
        if (this.scanning) {
            btn.className = 'btn btn-danger';
            icon.innerHTML = `
                <rect x="6" y="6" width="12" height="12"/>
            `;
            text.textContent = 'Stop Scanning';
        } else {
            btn.className = 'btn btn-primary';
            icon.innerHTML = `
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
            `;
            text.textContent = 'Start Scanning';
        }
    }

    async loadZXingLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zxing/library@latest/umd/index.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    handleScanResult(barcode) {
        // Add to recent scans
        const scanData = {
            barcode: barcode,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        this.recentScans.unshift(scanData);
        
        // Keep only last 50 scans
        if (this.recentScans.length > 50) {
            this.recentScans = this.recentScans.slice(0, 50);
        }

        this.saveRecentScans();
        this.loadRecentScans();

        // Show scan result
        this.showScanResult(barcode);

        // Look up product information
        this.lookupProduct(barcode);

        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Play scan sound
        this.playScanSound();
    }

    showScanResult(barcode) {
        const resultDiv = document.getElementById('scanResult');
        resultDiv.innerHTML = `
            <div class="scan-result-item">
                <div class="scan-result-header">
                    <h3>Scanned Successfully!</h3>
                    <span class="scan-timestamp">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="scan-result-barcode">
                    <strong>Barcode:</strong> ${barcode}
                </div>
                <div class="scan-result-actions">
                    <button class="btn btn-small btn-primary" onclick="scanner.copyToClipboard('${barcode}')">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="scanner.shareBarcode('${barcode}')">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16,6 12,2 8,6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                        Share
                    </button>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
    }

    async lookupProduct(barcode) {
        const productInfo = document.getElementById('productInfo');
        productInfo.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Looking up product...</p>
            </div>
        `;
        productInfo.style.display = 'block';

        try {
            // Try to lookup in local inventory first
            const localProduct = await this.lookupLocalProduct(barcode);
            
            if (localProduct) {
                this.displayProductInfo(localProduct, 'local');
            } else {
                // Try external API lookup
                const externalProduct = await this.lookupExternalProduct(barcode);
                if (externalProduct) {
                    this.displayProductInfo(externalProduct, 'external');
                } else {
                    this.showNoProductFound(barcode);
                }
            }
        } catch (error) {
            console.error('Product lookup error:', error);
            this.showProductLookupError(error.message);
        }
    }

    async lookupLocalProduct(barcode) {
        try {
            // If we have access to the main app's API
            if (window.electronAPI) {
                const products = await window.electronAPI.getInventoryItems();
                return products.find(product => product.barcode === barcode);
            }
            
            // Fallback: try to communicate with main window
            if (window.opener && window.opener.app) {
                const products = window.opener.app.inventoryItems;
                return products.find(product => product.barcode === barcode);
            }
            
            return null;
        } catch (error) {
            console.error('Local product lookup failed:', error);
            return null;
        }
    }

    async lookupExternalProduct(barcode) {
        try {
            // Try multiple barcode APIs
            const apis = [
                `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
                `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
            ];

            for (const apiUrl of apis) {
                try {
                    const response = await fetch(apiUrl);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Parse UPC Item DB response
                        if (data.items && data.items.length > 0) {
                            const item = data.items[0];
                            return {
                                name: item.title,
                                brand: item.brand,
                                description: item.description,
                                category: item.category,
                                barcode: barcode,
                                source: 'UPC Item DB'
                            };
                        }
                        
                        // Parse Open Food Facts response
                        if (data.product) {
                            const product = data.product;
                            return {
                                name: product.product_name || product.product_name_en,
                                brand: product.brands,
                                description: product.generic_name || product.generic_name_en,
                                category: product.categories,
                                barcode: barcode,
                                source: 'Open Food Facts'
                            };
                        }
                    }
                } catch (apiError) {
                    console.warn(`API ${apiUrl} failed:`, apiError);
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            console.error('External product lookup failed:', error);
            return null;
        }
    }

    displayProductInfo(product, source) {
        const productInfo = document.getElementById('productInfo');
        const isLocal = source === 'local';
        
        productInfo.innerHTML = `
            <div class="product-info-card">
                <div class="product-info-header">
                    <h3>${product.name || 'Unknown Product'}</h3>
                    <span class="product-source ${isLocal ? 'local' : 'external'}">${isLocal ? 'In Inventory' : product.source || 'External'}</span>
                </div>
                
                ${product.brand ? `<p><strong>Brand:</strong> ${product.brand}</p>` : ''}
                ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
                ${product.category ? `<p><strong>Category:</strong> ${product.category}</p>` : ''}
                ${product.sku ? `<p><strong>SKU:</strong> ${product.sku}</p>` : ''}
                
                ${isLocal ? `
                    <div class="inventory-details">
                        <div class="inventory-stat">
                            <span class="stat-label">Quantity:</span>
                            <span class="stat-value ${product.quantity <= (product.min_stock || 0) ? 'low-stock' : ''}">${product.quantity || 0}</span>
                        </div>
                        ${product.price ? `
                            <div class="inventory-stat">
                                <span class="stat-label">Price:</span>
                                <span class="stat-value">R${product.price.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        ${product.min_stock ? `
                            <div class="inventory-stat">
                                <span class="stat-label">Min Stock:</span>
                                <span class="stat-value">${product.min_stock}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="scanner.quickRestock('${product.id}', '${product.name}')">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Quick Restock
                        </button>
                        <button class="btn btn-secondary" onclick="scanner.editProduct('${product.id}')">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit Product
                        </button>
                    </div>
                ` : `
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="scanner.addToInventory('${product.barcode}', '${product.name}', '${product.brand || ''}', '${product.category || ''}')">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add to Inventory
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    showNoProductFound(barcode) {
        const productInfo = document.getElementById('productInfo');
        productInfo.innerHTML = `
            <div class="no-product-found">
                <div class="no-product-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9 9h6v6H9z"/>
                        <path d="M9 1v6h6V1"/>
                    </svg>
                </div>
                <h3>Product Not Found</h3>
                <p>No product information found for barcode: <strong>${barcode}</strong></p>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="scanner.addNewProduct('${barcode}')">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add New Product
                    </button>
                </div>
            </div>
        `;
    }

    showProductLookupError(errorMessage) {
        const productInfo = document.getElementById('productInfo');
        productInfo.innerHTML = `
            <div class="lookup-error">
                <div class="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>
                <h3>Lookup Error</h3>
                <p>Failed to lookup product information: ${errorMessage}</p>
                <button class="btn btn-secondary" onclick="scanner.retryLookup()">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23,4 23,10 17,10"/>
                        <polyline points="1,20 1,14 7,14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Retry
                </button>
            </div>
        `;
    }

    processManualBarcode() {
        const barcodeInput = document.getElementById('manualBarcode');
        const barcode = barcodeInput.value.trim();
        
        if (barcode) {
            this.handleScanResult(barcode);
            barcodeInput.value = '';
        }
    }

    loadRecentScans() {
        const container = document.getElementById('recentScans');
        
        if (this.recentScans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No recent scans</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.recentScans.map(scan => `
            <div class="recent-scan-item" onclick="scanner.selectRecentScan('${scan.barcode}')">
                <div class="scan-barcode">${scan.barcode}</div>
                <div class="scan-time">${new Date(scan.timestamp).toLocaleString()}</div>
                <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); scanner.deleteRecentScan(${scan.id})">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    selectRecentScan(barcode) {
        this.showScanResult(barcode);
        this.lookupProduct(barcode);
    }

    deleteRecentScan(scanId) {
        this.recentScans = this.recentScans.filter(scan => scan.id !== scanId);
        this.saveRecentScans();
        this.loadRecentScans();
    }

    clearRecentScans() {
        if (confirm('Clear all recent scans?')) {
            this.recentScans = [];
            this.saveRecentScans();
            this.loadRecentScans();
            this.showStatus('Recent scans cleared', 'success');
        }
    }

    saveRecentScans() {
        localStorage.setItem('recentScans', JSON.stringify(this.recentScans));
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showStatus('Copied to clipboard', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showStatus('Copied to clipboard', 'success');
        }
    }

    shareBarcode(barcode) {
        if (navigator.share) {
            navigator.share({
                title: 'Scanned Barcode',
                text: `Barcode: ${barcode}`,
                url: window.location.href
            });
        } else {
            this.copyToClipboard(barcode);
        }
    }

    toggleSettings() {
        const settings = document.getElementById('settingsPanel');
        const isVisible = settings.style.display === 'block';
        settings.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('apiEndpointInput').value = this.apiEndpoint;
        }
    }

    updateApiEndpoint() {
        const newEndpoint = document.getElementById('apiEndpointInput').value.trim();
        if (newEndpoint) {
            this.apiEndpoint = newEndpoint;
            localStorage.setItem('scannerApiEndpoint', newEndpoint);
            this.showStatus('API endpoint updated', 'success');
        }
    }

    toggleFlash() {
        // Flash toggle functionality would depend on the camera API
        // This is a placeholder for future implementation
        this.showStatus('Flash toggle not yet implemented', 'info');
    }

    switchCamera() {
        // Camera switching functionality would depend on the camera API
        // This is a placeholder for future implementation
        this.showStatus('Camera switching not yet implemented', 'info');
    }

    goBackToMain() {
        if (window.opener) {
            window.close();
        } else {
            window.location.href = 'index.html';
        }
    }

    playScanSound() {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        statusDiv.className = `status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        // Auto-hide after 3 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    // Product management methods
    async quickRestock(productId, productName) {
        const quantity = prompt(`How many units would you like to add to "${productName}"?`, '10');
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            try {
                if (window.electronAPI) {
                    await window.electronAPI.addStockMovement(
                        productId, 
                        'IN', 
                        parseInt(quantity), 
                        'Quick restock from mobile scanner', 
                        `MOBILE-${Date.now()}`
                    );
                    this.showStatus(`Added ${quantity} units to ${productName}`, 'success');
                } else if (window.opener && window.opener.app) {
                    // Communicate with main window
                    await window.opener.app.quickRestock(productId, productName);
                    this.showStatus(`Added ${quantity} units to ${productName}`, 'success');
                } else {
                    throw new Error('Cannot connect to inventory system');
                }
            } catch (error) {
                console.error('Error restocking:', error);
                this.showStatus('Failed to restock item', 'error');
            }
        }
    }

    editProduct(productId) {
        if (window.opener && window.opener.app) {
            window.opener.focus();
            window.opener.app.editItem(productId);
            this.showStatus('Switched to main app for editing', 'info');
        } else {
            this.showStatus('Cannot edit product - main app not available', 'error');
        }
    }

    addToInventory(barcode, name, brand, category) {
        if (window.opener && window.opener.app) {
            window.opener.focus();
            window.opener.app.showAddItemModal();
            // Pre-fill the form if possible
            setTimeout(() => {
                const nameField = window.opener.document.getElementById('itemName');
                const barcodeField = window.opener.document.getElementById('itemBarcode');
                const categoryField = window.opener.document.getElementById('itemCategory');
                
                if (nameField) nameField.value = name || '';
                if (barcodeField) barcodeField.value = barcode || '';
                if (categoryField) categoryField.value = category || '';
            }, 100);
            this.showStatus('Switched to main app to add product', 'info');
        } else {
            this.showStatus('Cannot add product - main app not available', 'error');
        }
    }

    addNewProduct(barcode) {
        this.addToInventory(barcode, '', '', '');
    }

    retryLookup() {
        const lastScan = this.recentScans[0];
        if (lastScan) {
            this.lookupProduct(lastScan.barcode);
        }
    }
}

// Initialize the scanner when the page loads
let scanner;
document.addEventListener('DOMContentLoaded', () => {
    scanner = new MobileScanner();
});