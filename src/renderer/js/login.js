// Login functionality
class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('LoginManager initializing...');
        console.log('ElectronAPI available:', typeof window.electronAPI);
        console.log('ElectronAPI object:', window.electronAPI);

        this.setupEventListeners();
        this.setupBrelinxLink();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Password toggle
        document.getElementById('passwordToggle').addEventListener('click', () => {
            this.togglePassword();
        });

        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const form = document.getElementById('loginForm');
                if (document.activeElement && form.contains(document.activeElement)) {
                    e.preventDefault();
                    this.handleLogin();
                }
            }
        });

        // Input validation
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearError();
            });
        });
    }

    setupBrelinxLink() {
        document.getElementById('brelinxLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openBrelinxWebsite();
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');

        // Basic validation
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        this.clearError();

        try {
            // Check if electronAPI is available
            if (!window.electronAPI || !window.electronAPI.login) {
                console.log('ElectronAPI not available, using fallback authentication');
                // Fallback to client-side validation for development
                const isValid = this.validateCredentialsFallback(username, password);

                if (isValid) {
                    // Store session in localStorage as fallback
                    this.createSessionFallback(username);
                    this.redirectToApp();
                } else {
                    this.showError('Invalid username or password');
                }
                return;
            }

            // Use Electron API for authentication
            console.log('Using Electron API for login');
            const result = await window.electronAPI.login({ username, password });
            console.log('Login API result:', result);

            if (result.success) {
                console.log('Login successful, session:', result.session);
                // Redirect to main application
                this.redirectToApp();
            } else {
                console.log('Login failed:', result.error);
                this.showError(result.error || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Fallback methods for when electronAPI is not available
    validateCredentialsFallback(username, password) {
        const validCredentials = [
            { username: 'admin', password: 'admin123' },
            { username: 'manager', password: 'manager123' },
            { username: 'user', password: 'user123' }
        ];

        return validCredentials.some(cred =>
            cred.username === username && cred.password === password
        );
    }

    createSessionFallback(username) {
        const sessionData = {
            username: username,
            loginTime: new Date().toISOString(),
            sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2)
        };

        console.log('Creating fallback session:', sessionData);
        localStorage.setItem('inventorySession', JSON.stringify(sessionData));
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    redirectToApp() {
        console.log('Redirecting to main application...');
        // Add a delay to ensure session is properly set
        setTimeout(() => {
            console.log('Performing redirect to index.html');
            window.location.href = 'index.html';
        }, 300); // Increased delay
    }

    togglePassword() {
        const passwordInput = document.getElementById('password');
        const eyeIcon = document.querySelector('.eye-icon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            `;
        } else {
            passwordInput.type = 'password';
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    }

    setLoadingState(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('span') || loginBtn.lastChild;

        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            if (btnText && btnText.nodeType === Node.TEXT_NODE) {
                btnText.textContent = 'Signing In...';
            }
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            if (btnText && btnText.nodeType === Node.TEXT_NODE) {
                btnText.textContent = 'Sign In';
            }
        }
    }

    showError(message) {
        const errorElement = document.getElementById('loginError');
        const errorMessage = document.getElementById('errorMessage');

        errorMessage.textContent = message;
        errorElement.style.display = 'flex';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }

    clearError() {
        const errorElement = document.getElementById('loginError');
        errorElement.style.display = 'none';
    }

    openBrelinxWebsite() {
        // Open Brelinx website in external browser
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal('https://brelinx.com');
        } else {
            // Fallback for development
            window.open('https://brelinx.com', '_blank');
        }
    }
}

// Initialize login manager
const loginManager = new LoginManager();
