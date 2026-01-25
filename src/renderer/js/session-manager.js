// Session management utilities
class SessionManager {
    static async isLoggedIn() {
        try {
            console.log('SessionManager: Checking if logged in...');
            // Try Electron API first
            if (window.electronAPI && window.electronAPI.checkSession) {
                console.log('SessionManager: Using Electron API for session check');
                const result = await window.electronAPI.checkSession();
                console.log('SessionManager: Session check result:', result);
                return result.valid;
            } else {
                // Fallback to localStorage
                console.log('SessionManager: Using localStorage fallback for session check');
                return this.isLoggedInFallback();
            }
        } catch (error) {
            console.error('SessionManager: Session check error:', error);
            // Try fallback
            return this.isLoggedInFallback();
        }
    }

    static isLoggedInFallback() {
        const session = localStorage.getItem('inventorySession');
        console.log('Checking fallback session:', session);
        
        if (!session) {
            console.log('No fallback session found');
            return false;
        }

        try {
            const sessionData = JSON.parse(session);
            console.log('Fallback session data:', sessionData);
            
            // Check if session is still valid (24 hours)
            const loginTime = new Date(sessionData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            console.log('Hours since login:', hoursDiff);
            const isValid = hoursDiff < 24;
            console.log('Fallback session valid:', isValid);
            
            return isValid;
        } catch (error) {
            console.error('Fallback session parsing error:', error);
            return false;
        }
    }

    static async getSession() {
        try {
            // Try Electron API first
            if (window.electronAPI && window.electronAPI.checkSession) {
                const result = await window.electronAPI.checkSession();
                return result.valid ? result.session : null;
            } else {
                // Fallback to localStorage
                return this.getSessionFallback();
            }
        } catch (error) {
            console.error('Get session error:', error);
            return this.getSessionFallback();
        }
    }

    static getSessionFallback() {
        const session = localStorage.getItem('inventorySession');
        if (!session) return null;

        try {
            return JSON.parse(session);
        } catch (error) {
            return null;
        }
    }

    static async logout() {
        try {
            // Try Electron API first
            if (window.electronAPI && window.electronAPI.logout) {
                await window.electronAPI.logout();
            }
            // Also clear localStorage fallback
            localStorage.removeItem('inventorySession');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback
            localStorage.removeItem('inventorySession');
            window.location.href = 'login.html';
        }
    }
}

// Make SessionManager globally available
window.SessionManager = SessionManager;
