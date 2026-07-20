// Authentication Service - Abstracts auth operations from localStorage
// This service will be replaced with Supabase auth in the future

const AuthService = {
    // Login user
    login: async function(username, password) {
        try {
            // Get users from storage
            let users = [];
            if (typeof StorageService !== 'undefined' && StorageService.getUsers) {
                users = StorageService.getUsers();
            }
            
            // Fall back to hardcoded users if storage service not available or empty
            if (users.length === 0) {
                users = [
                    { username: 'admin', password: 'admin123', role: 'admin' },
                    { username: 'waiter1', password: 'waiter123', role: 'waiter' },
                    { username: 'waiter2', password: 'waiter123', role: 'waiter' },
                    { username: 'cook1', password: 'cook123', role: 'cook' },
                    { username: 'cook2', password: 'cook123', role: 'cook' }
                ];
            }

            // Find user
            const user = users.find(u => u.username === username && u.password === password);

            if (!user) {
                return { success: false, error: 'Invalid username or password' };
            }

            // Create session
            const session = {
                username: user.username,
                role: user.role,
                loginTime: new Date().toISOString()
            };

            // Store session
            if (typeof StorageService !== 'undefined' && StorageService.setSession) {
                StorageService.setSession(session);
            } else {
                localStorage.setItem('cafe_session', JSON.stringify(session));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: username,
                    action: 'login',
                    entityType: 'session',
                    entityId: username,
                    description: 'User logged in successfully'
                });
            }

            return { success: true, user: session };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    },

    // Logout user
    logout: async function() {
        try {
            const session = this.getSession();
            
            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: session?.username || 'system',
                    action: 'logout',
                    entityType: 'session',
                    entityId: session?.username || 'system',
                    description: 'User logged out'
                });
            }

            // Clear session
            if (typeof StorageService !== 'undefined' && StorageService.clearSession) {
                StorageService.clearSession();
            } else {
                localStorage.removeItem('cafe_session');
            }

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Logout failed' };
        }
    },

    // Get current session
    getSession: function() {
        try {
            if (typeof StorageService !== 'undefined' && StorageService.getSession) {
                return StorageService.getSession();
            }
            return JSON.parse(localStorage.getItem('cafe_session') || '{}');
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        const session = this.getSession();
        return session && session.username && session.role;
    },

    // Check if user has required role
    hasRole: function(requiredRoles) {
        const session = this.getSession();
        if (!session || !session.role) {
            return false;
        }
        return requiredRoles.includes(session.role);
    },

    // Get current user
    getCurrentUser: function() {
        return this.getSession();
    },

    // Remember username
    rememberUsername: function(username) {
        localStorage.setItem('cafe_remembered_username', username);
    },

    // Get remembered username
    getRememberedUsername: function() {
        return localStorage.getItem('cafe_remembered_username');
    },

    // Clear remembered username
    clearRememberedUsername: function() {
        localStorage.removeItem('cafe_remembered_username');
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthService };
}
