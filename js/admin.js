// Admin dashboard logic
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  Auth.requireAuth();

  const allOrdersList = document.getElementById('allOrdersList');
  const menuManagement = document.getElementById('menuManagement');
  const tipsTracking = document.getElementById('tipsTracking');

  // Analytics panel
  let analyticsPanel = document.getElementById('analyticsPanel');
  if (!analyticsPanel) {
    analyticsPanel = document.createElement('section');
    analyticsPanel.id = 'analyticsPanel';
    document.querySelector('main').insertBefore(analyticsPanel, allOrdersList.parentElement);
  }

  function renderAnalytics() {
    const todaysOrders = Orders.getTodaysOrders();
    const totalSales = todaysOrders.reduce((sum, o) => sum + Utils.calculateTotal(o.items), 0);
    const totalTips = todaysOrders.reduce((sum, o) => sum + (o.tip || 0), 0);
    
    analyticsPanel.innerHTML = `
      <h3>Today's Analytics</h3>
      <div><strong>Total Sales:</strong> ${Utils.formatCurrency(totalSales)} <span style='font-size:0.9em;'>(VAT included)</span></div>
      <div><strong>Orders:</strong> ${todaysOrders.length}</div>
      <div><strong>Total Tips:</strong> ${Utils.formatCurrency(totalTips)}</div>
    `;
  }

  function renderAllOrders() {
    const orders = Orders.get();
    const menu = Menu.get();
    
    allOrdersList.innerHTML = '';
    if (orders.length === 0) {
      allOrdersList.innerHTML = '<em>No orders yet.</em>';
      return;
    }
    
    orders.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-status status-' + order.status;
      
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
      
      div.innerHTML = `
        <div><strong>Table ${order.table}</strong> | ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
        <div>Items: ${itemsHtml}</div>
        <div>Status: ${order.status}</div>
        <div>Waiter: ${order.waiter} | Tip: ${Utils.formatCurrency(order.tip || 0)}</div>
        <div>Created: ${Utils.formatDateTime(order.createdAt)}</div>
        ${order.readyAt ? `<div>Ready: ${Utils.formatDateTime(order.readyAt)}</div>` : ''}
        ${order.completedAt ? `<div>Completed: ${Utils.formatDateTime(order.completedAt)}</div>` : ''}
        <div style='font-size:0.9em;color:#888;'>VAT included</div>
        ${order.note ? `<div><em>Note: ${order.note}</em></div>` : ''}
      `;
      
      allOrdersList.appendChild(div);
    });
  }

  function renderMenuManagement() {
    const menu = Menu.get();
    menuManagement.innerHTML = '';
    
    menu.forEach(item => {
      const div = document.createElement('div');
      div.innerHTML = `
        <span>${item.name} (${Utils.formatCurrency(item.price)})</span>
        <button data-id="${item.id}" class="toggle-availability">
          ${item.available ? 'Set Unavailable' : 'Set Available'}
        </button>
      `;
      menuManagement.appendChild(div);
    });
    
    menuManagement.querySelectorAll('.toggle-availability').forEach(btn => {
      btn.onclick = function() {
        const id = parseInt(this.getAttribute('data-id'));
        const menu = Menu.get();
        const idx = menu.findIndex(i => i.id === id);
        if (idx !== -1) {
          Menu.updateAvailability(id, !menu[idx].available);
        }
      };
    });
  }

  function renderTipsTracking() {
    const orders = Orders.get();
    const totalTips = orders.reduce((sum, o) => sum + (o.tip || 0), 0);
    tipsTracking.innerHTML = `<strong>Total Tips:</strong> ${Utils.formatCurrency(totalTips)}`;
  }

  // Menu management button scroll
  const menuMgmtBtn = document.getElementById('menuMgmtBtn');
  if (menuMgmtBtn) {
    menuMgmtBtn.onclick = function() {
      const section = menuManagement.parentElement;
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      section.style.boxShadow = '0 0 0 4px #FF6B35, 0 2px 12px rgba(0,0,0,0.10)';
      setTimeout(function() {
        section.style.boxShadow = '';
      }, 1800);
    };
  }

  // Event listeners
  window.addEventListener('orders_updated', () => {
    renderAllOrders();
    renderTipsTracking();
    renderAnalytics();
  });
  window.addEventListener('menu_updated', renderMenuManagement);
  document.getElementById('logoutBtn').addEventListener('click', Auth.logout);

  // Initial render
  renderAllOrders();
  renderMenuManagement();
  renderTipsTracking();
  renderAnalytics();
});