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
            // Simulate authentication delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check credentials (in a real app, this would be server-side)
            const isValid = await this.validateCredentials(username, password);

            if (isValid) {
                // Store session
                this.createSession(username);
                
                // Redirect to main application
                this.redirectToApp();
            } else {
                this.showError('Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    async validateCredentials(username, password) {
        // In a real application, this would make an API call to your server
        // For now, we'll use hardcoded credentials (you can change these)
        const validCredentials = [
            { username: 'admin', password: 'admin123' },
            { username: 'manager', password: 'manager123' },
            { username: 'user', password: 'user123' }
        ];

        // Check if credentials match
        return validCredentials.some(cred => 
            cred.username === username && cred.password === password
        );
    }

    createSession(username) {
        // Store session information
        const sessionData = {
            username: username,
            loginTime: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };

        // Store in localStorage (in a real app, use secure session management)
        localStorage.setItem('inventorySession', JSON.stringify(sessionData));
    }

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
    static isLoggedIn() {
        const session = localStorage.getItem('inventorySession');
        if (!session) return false;

        try {
            const sessionData = JSON.parse(session);
            // Check if session is still valid (24 hours)
            const loginTime = new Date(sessionData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            return hoursDiff < 24;
        } catch (error) {
            return false;
        }
    }

    static getSession() {
        const session = localStorage.getItem('inventorySession');
        if (!session) return null;

        try {
            return JSON.parse(session);
        } catch (error) {
            return null;
        }
    }

    static logout() {
        localStorage.removeItem('inventorySession');
        window.location.href = 'login.html';
    }
}

// Initialize login manager
const loginManager = new LoginManager();

// Make SessionManager globally available
window.SessionManager = SessionManager;