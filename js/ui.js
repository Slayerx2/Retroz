// Shared UI utilities
const UI = {
  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#EF3E36' : type === 'success' ? '#00A878' : '#222'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Show confirmation dialog
  confirm(message) {
    return window.confirm(message);
  },

  // Show alert dialog
  alert(message) {
    window.alert(message);
  },

  // Create order card element
  createOrderCard(order, menu, actions = []) {
    const card = document.createElement('div');
    card.className = `order-card status-${order.status}`;
    
    const itemsHtml = order.items.map(item => {
      const menuItem = menu.find(m => m.id === item.id);
      let imgHtml = '';
      if (menuItem && menuItem.img) {
        if (menuItem.img.endsWith('.png') || menuItem.img.endsWith('.jpg')) {
          imgHtml = `<img src='${menuItem.img}' alt='' style='width:20px;height:20px;vertical-align:middle;margin-right:4px;'>`;
        } else {
          imgHtml = `<span style='font-size:1.1em;margin-right:4px;'>${menuItem.img}</span>`;
        }
      }
      return imgHtml + item.name;
    }).join(', ');

    card.innerHTML = `
      <div><strong>Table ${order.table}</strong> | ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
      <div>Items: ${itemsHtml}</div>
      <div class="status">${order.status}</div>
      ${order.note ? `<div><em>Note: ${order.note}</em></div>` : ''}
    `;

    // Add action buttons
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.onclick = () => action.handler(order);
      card.appendChild(btn);
    });

    return card;
  },

  // Toggle loading state
  setLoading(element, isLoading) {
    if (isLoading) {
      element.disabled = true;
      element.dataset.originalText = element.textContent;
      element.textContent = 'Loading...';
    } else {
      element.disabled = false;
      element.textContent = element.dataset.originalText || element.textContent;
    }
  }
};

// Add CSS animations for toasts
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);