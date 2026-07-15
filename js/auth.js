// Authentication handling
const Auth = {
  // Check if user is logged in
  isLoggedIn() {
    const user = Storage.get(CONFIG.STORAGE_KEYS.USER);
    return user !== null;
  },

  // Get current user
  getCurrentUser() {
    return Storage.get(CONFIG.STORAGE_KEYS.USER, {});
  },

  // Login user
  login(username, role) {
    const user = { username, role };
    Storage.set(CONFIG.STORAGE_KEYS.USER, user);
    return user;
  },

  // Logout user
  logout() {
    Storage.remove(CONFIG.STORAGE_KEYS.USER);
    Storage.remove('token');
    window.location.href = 'pages/login.html';
  },

  // Redirect based on role
  redirectToRolePage(role) {
    const rolePages = {
      'waiter': 'pages/waiter.html',
      'cook': 'pages/kitchen.html',
      'admin': 'pages/admin.html'
    };
    window.location.href = rolePages[role] || 'pages/login.html';
  },

  // Check authentication and redirect if not logged in
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'pages/login.html';
    }
  }
};