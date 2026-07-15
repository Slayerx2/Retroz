// General utility functions
const Utils = {
  // Format currency
  formatCurrency(amount) {
    return `${CONFIG.CURRENCY} ${amount.toLocaleString()}`;
  },

  // Format date/time
  formatDateTime(isoString) {
    return new Date(isoString).toLocaleString();
  },

  // Generate unique ID
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Get today's date in ISO format (YYYY-MM-DD)
  getTodayDate() {
    return new Date().toISOString().slice(0, 10);
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Safe HTML escape
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Calculate total from items
  calculateTotal(items) {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  }
};