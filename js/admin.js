// Admin dashboard logic
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  Auth.requireAuth();

  // Display current date and user
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const user = Auth.getCurrentUser();
  document.getElementById('currentUser').textContent = user.username;

  // Navigation
  const navItems = document.querySelectorAll('.nav-item[data-section]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      navigateToSection(section);
    });
  });

  window.navigateToSection = function(section) {
    // Update active nav item
    navItems.forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Show content section
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    const contentSection = document.getElementById(`section-${section}`);
    if (contentSection) {
      contentSection.classList.add('active');
      document.getElementById('pageTitle').textContent = activeNav.textContent.trim();
    }

    // Render section content
    renderSection(section);
  };

  function renderSection(section) {
    switch (section) {
      case 'overview':
        renderDashboard();
        break;
      case 'orders':
        renderOrders();
        break;
      case 'tables':
        renderTables();
        break;
      case 'kitchen':
        renderKitchenMonitor();
        break;
      case 'products':
        renderProducts();
        break;
      case 'categories':
        renderCategories();
        break;
      case 'sales-overview':
        renderSalesOverview();
        break;
      case 'payments':
        renderPayments();
        break;
      case 'discounts':
        renderDiscounts();
        break;
      case 'refunds':
        renderRefunds();
        break;
      case 'daily-closing':
        renderDailyClosing();
        break;
      case 'product-reports':
        renderProductReports();
        break;
      case 'staff-reports':
        renderStaffReports();
        break;
      case 'cafe-profile':
        renderCafeProfile();
        break;
      case 'tax-charges':
        renderTaxCharges();
        break;
      case 'receipt-settings':
        renderReceiptSettings();
        break;
      case 'audit-log':
        renderAuditLog();
        break;
      case 'data-management':
        renderDataManagement();
        break;
    }
  }

  // ===== DASHBOARD =====
  function renderDashboard() {
    const today = Utils.getTodayDate();
    const todaysOrders = Orders.get().filter(o => o.createdAt && o.createdAt.startsWith(today) && (o.status === 'paid' || o.status === 'completed'));
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const yesterdaysOrders = Orders.get().filter(o => o.createdAt && o.createdAt.startsWith(yesterdayStr) && (o.status === 'paid' || o.status === 'completed'));

    const todaySales = todaysOrders.reduce((sum, o) => {
      const totals = CommercialPOS.calculateOrderTotals(o);
      return sum + totals.total;
    }, 0);

    const yesterdaySales = yesterdaysOrders.reduce((sum, o) => {
      const totals = CommercialPOS.calculateOrderTotals(o);
      return sum + totals.total;
    }, 0);

    const todayItems = todaysOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity || 1), 0), 0);
    const avgOrder = todaysOrders.length > 0 ? todaySales / todaysOrders.length : 0;

    // Calculate trends
    const salesTrend = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1) : 0;
    const ordersTrend = yesterdaysOrders.length > 0 ? ((todaysOrders.length - yesterdaysOrders.length) / yesterdaysOrders.length * 100).toFixed(1) : 0;

    // Update KPI cards
    document.getElementById('kpi-sales').textContent = Utils.formatCurrency(todaySales);
    document.getElementById('kpi-sales-trend').textContent = `${salesTrend >= 0 ? '+' : ''}${salesTrend}%`;
    document.getElementById('kpi-sales-trend').className = `kpi-trend ${salesTrend < 0 ? 'negative' : ''}`;

    document.getElementById('kpi-orders').textContent = todaysOrders.length;
    document.getElementById('kpi-orders-trend').textContent = `${ordersTrend >= 0 ? '+' : ''}${ordersTrend}%`;
    document.getElementById('kpi-orders-trend').className = `kpi-trend ${ordersTrend < 0 ? 'negative' : ''}`;

    document.getElementById('kpi-avg-order').textContent = Utils.formatCurrency(avgOrder);
    document.getElementById('kpi-avg-trend').textContent = '+0%';

    document.getElementById('kpi-items').textContent = todayItems;
    document.getElementById('kpi-items-trend').textContent = '+0%';

    // Render sales summary
    document.getElementById('summary-revenue').textContent = Utils.formatCurrency(todaySales);
    document.getElementById('summary-orders').textContent = todaysOrders.length;
    document.getElementById('summary-avg').textContent = Utils.formatCurrency(avgOrder);

    // Render recent activity
    renderRecentActivity();
  }

  function renderRecentActivity() {
    const logs = AuditLog.getTodayLogs().slice(0, 10);
    const activityList = document.getElementById('recent-activity');

    if (logs.length === 0) {
      activityList.innerHTML = '<p class="empty-state">No recent activity</p>';
      return;
    }

    activityList.innerHTML = logs.map(log => `
      <div class="activity-item">
        <strong>${log.action}</strong> - ${log.user} at ${new Date(log.timestamp).toLocaleTimeString()}
      </div>
    `).join('');
  }

  // ===== ORDERS =====
  function renderOrders() {
    const dateFilter = document.getElementById('order-date-filter').value;
    const statusFilter = document.getElementById('order-status-filter').value;
    const paymentFilter = document.getElementById('order-payment-filter').value;
    const searchTerm = document.getElementById('order-search').value.toLowerCase();

    let orders = Orders.get();
    const menu = Menu.get();

    // Apply filters
    if (dateFilter === 'today') {
      const today = Utils.getTodayDate();
      orders = orders.filter(o => o.createdAt && o.createdAt.startsWith(today));
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      orders = orders.filter(o => o.createdAt && o.createdAt.startsWith(yesterdayStr));
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      orders = orders.filter(o => o.createdAt && new Date(o.createdAt) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      orders = orders.filter(o => o.createdAt && new Date(o.createdAt) >= thirtyDaysAgo);
    }

    if (statusFilter !== 'all') {
      orders = orders.filter(o => o.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      const orderIds = Payments.get().filter(p => p.method === paymentFilter).map(p => p.orderId);
      orders = orders.filter(o => orderIds.includes(o.id));
    }

    if (searchTerm) {
      orders = orders.filter(o => 
        o.id.toLowerCase().includes(searchTerm) ||
        o.table.toString().includes(searchTerm) ||
        o.waiter.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by date descending
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const tbody = document.getElementById('orders-table-body');
    const emptyState = document.getElementById('orders-empty');

    if (orders.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = orders.map(order => {
      const totals = CommercialPOS.calculateOrderTotals(order);
      const items = order.items.map(i => i.name).join(', ');
      const date = order.createdAt.split('T')[0];
      const time = order.createdAt.split('T')[1].split('.')[0];
      const payments = Payments.getByOrderId(order.id);
      const paymentMethod = payments.length > 0 ? payments[0].method : '-';

      return `
        <tr>
          <td>${order.id.replace('o_', '')}</td>
          <td>${date}</td>
          <td>${time}</td>
          <td>${order.table}</td>
          <td>${order.waiter}</td>
          <td title="${items}">${items.substring(0, 30)}${items.length > 30 ? '...' : ''}</td>
          <td>${Utils.formatCurrency(totals.subtotal)}</td>
          <td>${Utils.formatCurrency(totals.discount)}</td>
          <td>${Utils.formatCurrency(totals.total)}</td>
          <td>${paymentMethod}</td>
          <td><span class="status-badge status-${order.status}">${order.status}</span></td>
          <td>
            <button onclick="openOrderDrawer('${order.id}')" style="margin-right:5px;font-size:12px;padding:4px 8px;">View</button>
            <button onclick="openReceiptModal('${order.id}')" style="margin-right:5px;font-size:12px;padding:4px 8px;">Receipt</button>
            ${(order.status === 'paid' || order.status === 'completed') ? `<button onclick="openRefundVoidModal('${order.id}')" style="font-size:12px;padding:4px 8px;">Refund</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ===== TABLES =====
  function renderTables() {
    const status = getTableStatus();
    const grid = document.getElementById('table-status-grid');

    grid.innerHTML = '';
    for (let i = 1; i <= CONFIG.TABLE_COUNT; i++) {
      const card = document.createElement('div');
      card.className = `table-status-card ${status[i] === 'free' ? 'free' : 'occupied'}`;
      card.innerHTML = `
        <div style="font-size:var(--font-size-2xl);font-weight:bold;">${i}</div>
        <div style="font-size:var(--font-size-sm);">${status[i] === 'free' ? 'Available' : 'Occupied'}</div>
      `;
      grid.appendChild(card);
    }

    // Render table history
    const history = TableHistory.get();
    const historyList = document.getElementById('table-history-list');

    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No table history</p>';
      return;
    }

    historyList.innerHTML = history.slice(-10).reverse().map(h => `
      <div class="activity-item">
        <strong>${h.action}</strong>: ${h.details || ''} - ${new Date(h.timestamp).toLocaleString()}
      </div>
    `).join('');
  }

  function getTableStatus() {
    const orders = Orders.get();
    const status = {};
    for (let i = 1; i <= CONFIG.TABLE_COUNT; i++) status[i] = 'free';
    orders.forEach(o => {
      if (o.status !== 'completed' && o.status !== 'paid' && o.status !== 'cancelled' && o.status !== 'voided' && o.orderType !== 'takeaway') {
        status[o.table] = 'occupied';
      }
    });
    return status;
  }

  // ===== KITCHEN MONITOR =====
  function renderKitchenMonitor() {
    const orders = Orders.get();
    const activeOrders = orders.filter(o => 
      o.status !== 'completed' && 
      o.status !== 'paid' && 
      o.status !== 'cancelled' &&
      o.status !== 'voided' &&
      o.status !== 'served'
    );

    const newOrders = activeOrders.filter(o => o.status === 'sent' || o.status === 'accepted');
    const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
    const readyOrders = activeOrders.filter(o => o.status === 'ready');

    // Sort by creation time
    newOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    preparingOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    readyOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    renderKitchenColumn('kitchen-new-orders', newOrders, 'No new orders');
    renderKitchenColumn('kitchen-preparing-orders', preparingOrders, 'No orders preparing');
    renderKitchenColumn('kitchen-ready-orders', readyOrders, 'No orders ready');

    document.getElementById('kitchen-new-count').textContent = newOrders.length;
    document.getElementById('kitchen-preparing-count').textContent = preparingOrders.length;
    document.getElementById('kitchen-ready-count').textContent = readyOrders.length;
  }

  function renderKitchenColumn(containerId, orders, emptyMessage) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (orders.length === 0) {
      container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
      return;
    }

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'activity-item';
      card.innerHTML = `
        <div><strong>Order #${order.id.replace('o_', '')}</strong></div>
        <div>Table ${order.table}</div>
        <div>Items: ${order.items.map(i => i.name).join(', ')}</div>
        <div>Status: ${order.status}</div>
      `;
      container.appendChild(card);
    });
  }

  // ===== PRODUCTS =====
  function renderProducts() {
    const menu = Menu.get();
    const grid = document.getElementById('products-grid');

    grid.innerHTML = menu.map(item => `
      <div class="product-card ${item.available ? '' : 'unavailable'}">
        <div style="font-weight:bold;">${item.name}</div>
        <div>${Utils.formatCurrency(item.price)}</div>
        <div style="font-size:var(--font-size-sm;color:var(--text-secondary);">${item.available ? 'Available' : 'Unavailable'}</div>
        <div style="margin-top:var(--spacing-sm);">
          <button onclick="editProduct(${item.id})" style="margin-right:5px;font-size:12px;padding:4px 8px;">Edit</button>
          <button onclick="toggleProductAvailability(${item.id})" style="font-size:12px;padding:4px 8px;">${item.available ? 'Disable' : 'Enable'}</button>
        </div>
      </div>
    `).join('');
  }

  // ===== CATEGORIES =====
  function renderCategories() {
    const categories = ['Veg', 'Non-Veg', 'Snacks', 'Drinks', 'Bakery & Sweets'];
    const list = document.getElementById('categories-list');

    list.innerHTML = categories.map(cat => `
      <div class="activity-item">
        <strong>${cat}</strong>
      </div>
    `).join('');
  }

  // ===== SALES OVERVIEW =====
  function renderSalesOverview() {
    const today = Utils.getTodayDate();
    const todaysOrders = Orders.get().filter(o => o.createdAt && o.createdAt.startsWith(today) && (o.status === 'paid' || o.status === 'completed'));

    let grossSales = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    let totalVat = 0;
    let totalService = 0;
    let totalTips = 0;

    todaysOrders.forEach(order => {
      const totals = CommercialPOS.calculateOrderTotals(order);
      grossSales += totals.subtotal;
      totalDiscounts += totals.discount;
      totalVat += totals.vat;
      totalService += totals.serviceCharge;
      totalTips += totals.tip;
    });

    // Get refunds
    const todaysRefunds = Refunds.getTodayRefunds();
    totalRefunds = todaysRefunds.reduce((sum, r) => sum + r.amount, 0);

    const netSales = grossSales - totalDiscounts - totalRefunds;

    document.getElementById('gross-sales').textContent = Utils.formatCurrency(grossSales);
    document.getElementById('total-discounts').textContent = `-${Utils.formatCurrency(totalDiscounts)}`;
    document.getElementById('total-refunds').textContent = `-${Utils.formatCurrency(totalRefunds)}`;
    document.getElementById('net-sales').textContent = Utils.formatCurrency(netSales);
    document.getElementById('total-vat').textContent = Utils.formatCurrency(totalVat);
    document.getElementById('total-service').textContent = Utils.formatCurrency(totalService);
    document.getElementById('total-tips').textContent = Utils.formatCurrency(totalTips);

    // Payment breakdown
    const payments = Payments.getTodayPayments();
    const cashTotal = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const cardTotal = payments.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0);
    const mobileTotal = payments.filter(p => p.method === 'mobile').reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = cashTotal + cardTotal + mobileTotal;

    const breakdown = document.getElementById('payment-breakdown');
    breakdown.innerHTML = `
      <div class="payment-method-card">
        <div>Cash</div>
        <div style="font-weight:bold;">${Utils.formatCurrency(cashTotal)}</div>
        <div style="font-size:var(--font-size-sm;color:var(--text-secondary);">${totalPayments > 0 ? ((cashTotal / totalPayments) * 100).toFixed(1) : 0}%</div>
      </div>
      <div class="payment-method-card">
        <div>Card</div>
        <div style="font-weight:bold;">${Utils.formatCurrency(cardTotal)}</div>
        <div style="font-size:var(--font-size-sm;color:var(--text-secondary);">${totalPayments > 0 ? ((cardTotal / totalPayments) * 100).toFixed(1) : 0}%</div>
      </div>
      <div class="payment-method-card">
        <div>Mobile</div>
        <div style="font-weight:bold;">${Utils.formatCurrency(mobileTotal)}</div>
        <div style="font-size:var(--font-size-sm;color:var(--text-secondary);">${totalPayments > 0 ? ((mobileTotal / totalPayments) * 100).toFixed(1) : 0}%</div>
      </div>
    `;

    // Hourly orders (simplified)
    const hourlyChart = document.getElementById('hourly-orders-chart');
    hourlyChart.innerHTML = '<p class="empty-state">Hourly breakdown requires Chart.js library</p>';
  }

  // ===== PAYMENTS =====
  function renderPayments() {
    const payments = Payments.get();
    const tbody = document.getElementById('payments-table-body');

    payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No payments recorded</td></tr>';
      return;
    }

    tbody.innerHTML = payments.slice(0, 50).map(p => `
      <tr>
        <td>${new Date(p.timestamp).toLocaleDateString()}</td>
        <td>${p.orderId.replace('o_', '')}</td>
        <td>${p.method}</td>
        <td>${Utils.formatCurrency(p.amount)}</td>
      </tr>
    `).join('');
  }

  // ===== DISCOUNTS =====
  function renderDiscounts() {
    const discounts = DiscountLogs.get();
    const tbody = document.getElementById('discounts-table-body');

    discounts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (discounts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No discounts recorded</td></tr>';
      return;
    }

    tbody.innerHTML = discounts.slice(0, 50).map(d => `
      <tr>
        <td>${new Date(d.timestamp).toLocaleDateString()}</td>
        <td>${d.orderId.replace('o_', '')}</td>
        <td>${d.discountType}</td>
        <td>${Utils.formatCurrency(d.discountAmount)}</td>
        <td>${d.reason}</td>
        <td>${d.appliedBy}</td>
      </tr>
    `).join('');
  }

  // ===== REFUNDS =====
  function renderRefunds() {
    const refunds = Refunds.get();
    const tbody = document.getElementById('refunds-table-body');

    refunds.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));

    if (refunds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No refunds recorded</td></tr>';
      return;
    }

    tbody.innerHTML = refunds.slice(0, 50).map(r => `
      <tr>
        <td>${new Date(r.processedAt).toLocaleDateString()}</td>
        <td>${r.orderId.replace('o_', '')}</td>
        <td>${Utils.formatCurrency(r.amount)}</td>
        <td>${r.reason}</td>
        <td>${r.processedBy}</td>
      </tr>
    `).join('');
  }

  // ===== DAILY CLOSING =====
  function renderDailyClosing() {
    document.getElementById('report-date').value = Utils.getTodayDate();
  }

  window.generateDailyReport = function() {
    const date = document.getElementById('report-date').value;
    if (!date) {
      UI.alert('Please select a date');
      return;
    }

    const report = DailyReports.generateReport(date);
    DailyReports.saveReport(report);

    const content = document.getElementById('daily-report-content');
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;">
        <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
          <h4>Sales</h4>
          <div>Total Sales: ${Utils.formatCurrency(report.sales)}</div>
          <div>Cash: ${Utils.formatCurrency(report.cashPayments)}</div>
          <div>Card: ${Utils.formatCurrency(report.cardPayments)}</div>
          <div>Mobile: ${Utils.formatCurrency(report.mobilePayments)}</div>
        </div>
        <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
          <h4>Orders</h4>
          <div>Total Orders: ${report.totalOrders}</div>
          <div>Completed: ${report.completedOrders}</div>
          <div>Cancelled: ${report.cancelledOrders}</div>
          <div>Avg Order Value: ${Utils.formatCurrency(report.avgOrderValue)}</div>
        </div>
        <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
          <h4>Adjustments</h4>
          <div>Refunds: ${Utils.formatCurrency(report.refunds)}</div>
          <div>Discounts: ${Utils.formatCurrency(report.discounts)}</div>
          <div>Tips: ${Utils.formatCurrency(report.tips)}</div>
        </div>
        <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
          <h4>Taxes & Charges</h4>
          <div>VAT: ${Utils.formatCurrency(report.vat)}</div>
          <div>Service Charge: ${Utils.formatCurrency(report.serviceCharge)}</div>
        </div>
        <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
          <h4>Best Selling</h4>
          <div>Item: ${report.bestSellingItem}</div>
          <div>Quantity: ${report.bestSellingItemQty}</div>
        </div>
      </div>
    `;
  };

  window.exportDailyReport = function() {
    const date = document.getElementById('report-date').value;
    const report = DailyReports.generateReport(date);

    const csv = `Date,Sales,Cash,Card,Mobile,Total Orders,Completed,Cancelled,Refunds,Discounts,Tips,VAT,Service Charge,Avg Order Value\n${date},${report.sales},${report.cashPayments},${report.cardPayments},${report.mobilePayments},${report.totalOrders},${report.completedOrders},${report.cancelledOrders},${report.refunds},${report.discounts},${report.tips},${report.vat},${report.serviceCharge},${report.avgOrderValue}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_report_${date}.csv`;
    a.click();
  };

  window.printDailyReport = function() {
    window.print();
  };

  // ===== PRODUCT REPORTS =====
  function renderProductReports() {
    const menu = Menu.get();
    const orders = Orders.get().filter(o => o.status === 'paid' || o.status === 'completed');

    const itemCounts = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
      });
    });

    const sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);

    const bestSelling = document.getElementById('best-selling-items');
    bestSelling.innerHTML = sortedItems.slice(0, 10).map(([name, qty], i) => `
      <div class="ranking-item">
        <span>${i + 1}. ${name}</span>
        <span>${qty}</span>
      </div>
    `).join('');

    // Category performance (simplified)
    const categoryPerformance = document.getElementById('category-performance');
    categoryPerformance.innerHTML = '<p class="empty-state">Category performance requires product categorization</p>';
  }

  // ===== STAFF REPORTS =====
  function renderStaffReports() {
    const orders = Orders.get().filter(o => o.status === 'paid' || o.status === 'completed');

    const waiterPerformance = {};
    const waiterTips = {};

    orders.forEach(o => {
      if (!waiterPerformance[o.waiter]) {
        waiterPerformance[o.waiter] = { orders: 0, sales: 0 };
        waiterTips[o.waiter] = 0;
      }
      waiterPerformance[o.waiter].orders++;
      const totals = CommercialPOS.calculateOrderTotals(o);
      waiterPerformance[o.waiter].sales += totals.total;
      waiterTips[o.waiter] += o.tip || 0;
    });

    const sortedWaiters = Object.entries(waiterPerformance).sort((a, b) => b[1].sales - a[1].sales);

    const waiterPerf = document.getElementById('waiter-performance');
    waiterPerf.innerHTML = sortedWaiters.map(([waiter, data], i) => `
      <div class="ranking-item">
        <span>${i + 1}. ${waiter}</span>
        <span>${data.orders} orders - ${Utils.formatCurrency(data.sales)}</span>
      </div>
    `).join('');

    const tipsByStaff = document.getElementById('tips-by-staff');
    tipsByStaff.innerHTML = Object.entries(waiterTips).sort((a, b) => b[1] - a[1]).map(([waiter, tips], i) => `
      <div class="ranking-item">
        <span>${i + 1}. ${waiter}</span>
        <span>${Utils.formatCurrency(tips)}</span>
      </div>
    `).join('');
  }

  // ===== CAFÉ PROFILE =====
  function renderCafeProfile() {
    const settings = Storage.get('cafe_profile', {
      name: 'CaféPOS',
      address: '',
      phone: '',
      email: ''
    });

    document.getElementById('cafe-name').value = settings.name;
    document.getElementById('cafe-address').value = settings.address;
    document.getElementById('cafe-phone').value = settings.phone;
    document.getElementById('cafe-email').value = settings.email;

    document.getElementById('cafe-profile-form').onsubmit = (e) => {
      e.preventDefault();
      Storage.set('cafe_profile', {
        name: document.getElementById('cafe-name').value,
        address: document.getElementById('cafe-address').value,
        phone: document.getElementById('cafe-phone').value,
        email: document.getElementById('cafe-email').value
      });
      UI.alert('Profile saved successfully');
    };
  }

  // ===== TAX & CHARGES =====
  function renderTaxCharges() {
    document.getElementById('vat-rate').value = (CONFIG.VAT_RATE * 100).toFixed(1);
    document.getElementById('service-charge-rate').value = (CONFIG.SERVICE_CHARGE_RATE * 100).toFixed(1);

    document.getElementById('tax-form').onsubmit = (e) => {
      e.preventDefault();
      UI.alert('Tax settings would update CONFIG. Requires implementation.');
    };
  }

  // ===== RECEIPT SETTINGS =====
  function renderReceiptSettings() {
    const settings = Storage.get('receipt_settings', {
      header: '☕ CaféPOS\nThank you for dining with us!',
      footer: 'Visit us again!\n'
    });

    document.getElementById('receipt-header').value = settings.header;
    document.getElementById('receipt-footer').value = settings.footer;

    document.getElementById('receipt-form').onsubmit = (e) => {
      e.preventDefault();
      Storage.set('receipt_settings', {
        header: document.getElementById('receipt-header').value,
        footer: document.getElementById('receipt-footer').value
      });
      UI.alert('Receipt settings saved successfully');
    };
  }

  // ===== AUDIT LOG =====
  function renderAuditLog() {
    const actionFilter = document.getElementById('audit-action-filter').value;
    const userFilter = document.getElementById('audit-user-filter').value.toLowerCase();

    let logs = AuditLog.get();

    if (actionFilter) {
      logs = logs.filter(log => log.action === actionFilter);
    }

    if (userFilter) {
      logs = logs.filter(log => log.user.toLowerCase().includes(userFilter));
    }

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const content = document.getElementById('audit-log-content');

    if (logs.length === 0) {
      content.innerHTML = '<p class="empty-state">No audit logs found</p>';
      return;
    }

    content.innerHTML = logs.slice(0, 100).map(log => `
      <div class="audit-log-item">
        <div><strong>Action:</strong> ${log.action}</div>
        <div><strong>User:</strong> ${log.user}</div>
        <div><strong>Time:</strong> ${Utils.formatDateTime(log.timestamp)}</div>
        <div><strong>Details:</strong> ${JSON.stringify(log)}</div>
      </div>
    `).join('');
  }

  // ===== DATA MANAGEMENT =====
  function renderDataManagement() {
    // Calculate storage usage
    let totalSize = 0;
    for (let key in localStorage) {
      totalSize += localStorage[key].length * 2; // UTF-16
    }
    const sizeKB = (totalSize / 1024).toFixed(2);
    document.getElementById('storage-used').textContent = `${sizeKB} KB`;
    document.getElementById('schema-version').textContent = Storage.get('cafe_schema_version', 1);
  }

  window.exportAllData = function() {
    const data = {
      orders: Orders.get(),
      menu: Menu.get(),
      payments: Payments.get(),
      refunds: Refunds.get(),
      discounts: DiscountLogs.get(),
      auditLog: AuditLog.get(),
      splitBills: SplitBills.get(),
      tableHistory: TableHistory.get(),
      receipts: Receipts.get(),
      dailyReports: DailyReports.get()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafe_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  window.importData = function() {
    UI.alert('Import functionality requires file input implementation');
  };

  window.clearOldData = function() {
    if (!confirm('This will delete orders older than 30 days. Continue?')) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let orders = Orders.get();
    const initialCount = orders.length;
    orders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    Orders.set(orders);

    UI.alert(`Deleted ${initialCount - orders.length} old orders`);
  };

  // ===== QUICK ACTIONS =====
  window.openDailyReport = function() {
    navigateToSection('daily-closing');
  };

  window.openAuditLog = function() {
    navigateToSection('audit-log');
  };

  // ===== ORDER DETAIL DRAWER =====
  window.openOrderDrawer = function(orderId) {
    const order = Orders.get().find(o => o.id === orderId);
    if (!order) return;

    const drawer = document.getElementById('order-drawer');
    const content = document.getElementById('order-drawer-content');

    const totals = CommercialPOS.calculateOrderTotals(order);
    const payments = Payments.getByOrderId(orderId);

    content.innerHTML = `
      <div style="margin-bottom:var(--spacing-lg);">
        <div><strong>Order #:</strong> ${order.id.replace('o_', '')}</div>
        <div><strong>Table:</strong> ${order.table}</div>
        <div><strong>Type:</strong> ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
        <div><strong>Waiter:</strong> ${order.waiter}</div>
        <div><strong>Status:</strong> ${order.status}</div>
        <div><strong>Created:</strong> ${Utils.formatDateTime(order.createdAt)}</div>
      </div>
      <div style="margin-bottom:var(--spacing-lg);">
        <h4>Items</h4>
        ${order.items.map(item => `
          <div style="display:flex;justify-content:space-between;padding:var(--spacing-sm) 0;">
            <span>${item.name} x${item.quantity || 1}</span>
            <span>${Utils.formatCurrency(item.price * (item.quantity || 1))}</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-bottom:var(--spacing-lg);">
        <h4>Financials</h4>
        <div>Subtotal: ${Utils.formatCurrency(totals.subtotal)}</div>
        <div>VAT: ${Utils.formatCurrency(totals.vat)}</div>
        <div>Service Charge: ${Utils.formatCurrency(totals.serviceCharge)}</div>
        <div>Discount: ${Utils.formatCurrency(totals.discount)}</div>
        <div>Tip: ${Utils.formatCurrency(totals.tip)}</div>
        <div style="font-weight:bold;margin-top:var(--spacing-sm);">Total: ${Utils.formatCurrency(totals.total)}</div>
      </div>
      <div style="margin-bottom:var(--spacing-lg);">
        <h4>Payment</h4>
        ${payments.length > 0 ? payments.map(p => `
          <div>${p.method}: ${Utils.formatCurrency(p.amount)}</div>
        `).join('') : '<p>No payment recorded</p>'}
      </div>
      ${order.note ? `<div style="margin-bottom:var(--spacing-lg);"><h4>Note</h4><p>${order.note}</p></div>` : ''}
      <div style="margin-top:var(--spacing-lg);">
        <button onclick="openReceiptModal('${order.id}')" class="btn-primary">Print Receipt</button>
        ${(order.status === 'paid' || order.status === 'completed') ? `<button onclick="openRefundVoidModal('${order.id}')" class="btn-danger" style="margin-left:var(--spacing-sm);">Refund</button>` : ''}
      </div>
    `;

    drawer.classList.add('open');
  };

  window.closeOrderDrawer = function() {
    document.getElementById('order-drawer').classList.remove('open');
  };

  // ===== PRODUCT MODAL =====
  window.openProductModal = function() {
    document.getElementById('product-modal-title').textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal').style.display = 'flex';
  };

  window.closeProductModal = function() {
    document.getElementById('product-modal').style.display = 'none';
  };

  window.editProduct = function(id) {
    const menu = Menu.get();
    const product = menu.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category || 'veg';
    document.getElementById('product-available').checked = product.available;
    document.getElementById('product-modal').style.display = 'flex';
  };

  window.toggleProductAvailability = function(id) {
    const menu = Menu.get();
    const idx = menu.findIndex(p => p.id === id);
    if (idx !== -1) {
      Menu.updateAvailability(id, !menu[idx].available);
      renderProducts();
    }
  };

  document.getElementById('product-form').onsubmit = (e) => {
    e.preventDefault();
    UI.alert('Product save functionality requires full implementation');
  };

  // ===== REFUND/VOID MODAL =====
  let currentRefundVoidOrderId = null;

  window.openRefundVoidModal = function(orderId) {
    currentRefundVoidOrderId = orderId;
    const order = Orders.get().find(o => o.id === orderId);
    if (!order) return;

    const title = document.getElementById('refundVoidTitle');
    const info = document.getElementById('refundVoidOrderInfo');
    const actionSelect = document.getElementById('refundVoidAction');
    const refundAmountDiv = document.getElementById('refundAmountDiv');

    const totals = CommercialPOS.calculateOrderTotals(order);
    info.textContent = `Order #${order.id.replace('o_', '')} | Table ${order.table} | Total: ${Utils.formatCurrency(totals.total)}`;

    if (order.status === 'paid' || order.status === 'completed') {
      actionSelect.value = 'refund';
      actionSelect.disabled = false;
      refundAmountDiv.style.display = 'block';
      title.textContent = 'Refund Order';
    } else {
      actionSelect.value = 'void';
      actionSelect.disabled = true;
      refundAmountDiv.style.display = 'none';
      title.textContent = 'Void Order';
    }

    document.getElementById('refundAmount').value = totals.total;
    document.getElementById('refundVoidReason').value = '';
    document.getElementById('refundVoidModal').style.display = 'flex';
  };

  window.closeRefundVoidModal = function() {
    document.getElementById('refundVoidModal').style.display = 'none';
    currentRefundVoidOrderId = null;
  };

  document.getElementById('refundVoidAction').addEventListener('change', (e) => {
    const refundAmountDiv = document.getElementById('refundAmountDiv');
    if (e.target.value === 'refund') {
      refundAmountDiv.style.display = 'block';
    } else {
      refundAmountDiv.style.display = 'none';
    }
  });

  document.getElementById('confirmRefundVoid').addEventListener('click', () => {
    if (!currentRefundVoidOrderId) return;

    const action = document.getElementById('refundVoidAction').value;
    const reason = document.getElementById('refundVoidReason').value.trim();

    if (!reason) {
      UI.alert('Please provide a reason');
      return;
    }

    if (action === 'refund') {
      const refundAmount = parseFloat(document.getElementById('refundAmount').value);
      const partial = document.getElementById('partialRefund').checked;

      const validation = CommercialPOS.validate(currentRefundVoidOrderId, 'refund');
      if (!validation.valid) {
        UI.alert(validation.reason);
        return;
      }

      const result = CommercialPOS.refundOrder(currentRefundVoidOrderId, refundAmount, reason, partial);
      if (result.success) {
        UI.alert(`Refund of ${Utils.formatCurrency(result.refundAmount)} processed successfully`);
        closeRefundVoidModal();
        renderOrders();
        renderDashboard();
      } else {
        UI.alert(result.reason);
      }
    } else {
      const validation = CommercialPOS.validate(currentRefundVoidOrderId, 'void');
      if (!validation.valid) {
        UI.alert(validation.reason);
        return;
      }

      const result = CommercialPOS.voidOrder(currentRefundVoidOrderId, reason);
      if (result.success) {
        UI.alert('Order voided successfully');
        closeRefundVoidModal();
        renderOrders();
        renderDashboard();
      } else {
        UI.alert(result.reason);
      }
    }
  });

  // ===== RECEIPT MODAL =====
  window.openReceiptModal = function(orderId) {
    const receipt = CommercialPOS.generateReceipt(orderId);
    if (!receipt) {
      UI.alert('Could not generate receipt');
      return;
    }

    const content = document.getElementById('receiptContent');
    content.innerHTML = `
      <div style="text-align:center;border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px;">
        <h3>☕ CaféPOS</h3>
        <div>Receipt #${receipt.orderNumber}</div>
        <div>${receipt.date} ${receipt.time}</div>
      </div>
      <div style="margin-bottom:10px;">
        <div>Table: ${receipt.table}</div>
        <div>Waiter: ${receipt.waiter}</div>
        <div>Type: ${receipt.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
      </div>
      <div style="border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px;">
        ${receipt.items.map(item => `
          <div style="display:flex;justify-content:space-between;">
            <span>${item.name} x${item.quantity || 1}</span>
            <span>${Utils.formatCurrency(item.price * (item.quantity || 1))}</span>
          </div>
        `).join('')}
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${Utils.formatCurrency(receipt.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>VAT:</span><span>${Utils.formatCurrency(receipt.vat)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>Service Charge:</span><span>${Utils.formatCurrency(receipt.serviceCharge)}</span></div>
        ${receipt.discount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Discount:</span><span>-${Utils.formatCurrency(receipt.discount)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;"><span>Tip:</span><span>${Utils.formatCurrency(receipt.tip)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;border-top:1px solid #000;padding-top:5px;margin-top:5px;"><span>TOTAL:</span><span>${Utils.formatCurrency(receipt.total)}</span></div>
      </div>
      ${receipt.payments.length > 0 ? `
        <div style="margin-top:10px;border-top:1px dashed #000;padding-top:10px;">
          <div><strong>Payment Method:</strong> ${receipt.payments.map(p => p.method).join(', ')}</div>
        </div>
      ` : ''}
      ${receipt.note ? `<div style="margin-top:10px;font-style:italic;">Note: ${receipt.note}</div>` : ''}
      <div style="text-align:center;margin-top:20px;font-size:10px;">
        Thank you for dining with us!
      </div>
    `;

    document.getElementById('receiptModal').style.display = 'flex';
  };

  window.closeReceiptModal = function() {
    document.getElementById('receiptModal').style.display = 'none';
  };

  document.getElementById('printReceipt').addEventListener('click', () => {
    window.print();
  });

  // ===== FILTER EVENT LISTENERS =====
  document.getElementById('order-date-filter').addEventListener('change', renderOrders);
  document.getElementById('order-status-filter').addEventListener('change', renderOrders);
  document.getElementById('order-payment-filter').addEventListener('change', renderOrders);
  document.getElementById('order-search').addEventListener('input', renderOrders);
  document.getElementById('audit-action-filter').addEventListener('change', renderAuditLog);
  document.getElementById('audit-user-filter').addEventListener('input', renderAuditLog);

  // ===== SALES OVERVIEW DATE FILTER =====
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      // Update dashboard based on selected range
    });
  });

  // ===== LOGOUT =====
  document.getElementById('logoutBtn').addEventListener('click', Auth.logout);

  // ===== INITIAL RENDER =====
  renderDashboard();

  // ===== EVENT LISTENERS FOR REAL-TIME UPDATES =====
  window.addEventListener('orders_updated', () => {
    if (document.getElementById('section-overview').classList.contains('active')) {
      renderDashboard();
    }
    if (document.getElementById('section-orders').classList.contains('active')) {
      renderOrders();
    }
    if (document.getElementById('section-tables').classList.contains('active')) {
      renderTables();
    }
    if (document.getElementById('section-kitchen').classList.contains('active')) {
      renderKitchenMonitor();
    }
  });

  window.addEventListener('menu_updated', () => {
    if (document.getElementById('section-products').classList.contains('active')) {
      renderProducts();
    }
  });

  // Auto-refresh kitchen monitor every 30 seconds
  setInterval(() => {
    if (document.getElementById('section-kitchen').classList.contains('active')) {
      renderKitchenMonitor();
    }
  }, 30000);
});
