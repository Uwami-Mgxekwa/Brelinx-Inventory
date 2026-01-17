// Login functionality
class LoginManager {
    constructor() {
        this.init();
    }

    init() {
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
            // Use Electron API for authentication
            const result = await window.electronAPI.login({ username, password });

            if (result.success) {
                console.log('Login successful:', result.session);
                // Redirect to main application
                this.redirectToApp();
            } else {
                this.showError(result.error || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Remove the old validateCredentials and createSession methods since we're using Electron API now

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    redirectToApp() {
        // Redirect to main application
        window.location.href = 'index.html';
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

// Session management utilities
class SessionManager {
    static async isLoggedIn() {
        try {
            if (!window.electronAPI) {
                console.log('ElectronAPI not available');
                return false;
            }

            const result = await window.electronAPI.checkSession();
            console.log('Session check result:', result);
            return result.valid;
        } catch (error) {
            console.error('Session check error:', error);
            return false;
        }
    }

    static async getSession() {
        try {
            if (!window.electronAPI) return null;
            
            const result = await window.electronAPI.checkSession();
            return result.valid ? result.session : null;
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    }

    static async logout() {
        try {
            if (window.electronAPI) {
                await window.electronAPI.logout();
            }
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        }
    }
}

// Initialize login manager
const loginManager = new LoginManager();

// Make SessionManager globally available
window.SessionManager = SessionManager;