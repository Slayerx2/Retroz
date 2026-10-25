// Shared data and logic (menu, orders, etc.)

// Local Storage Migration
function migrateLocalStorage() {
  const currentVersion = Storage.get('cafe_schema_version', 0);
  const targetVersion = 2;

  if (currentVersion >= targetVersion) {
    console.log('LocalStorage schema is up to date.');
    return;
  }

  console.log(`Migrating localStorage from version ${currentVersion} to ${targetVersion}`);

  // Migration steps
  if (currentVersion < 1) {
    // Initialize new storage keys if they don't exist
    if (!Storage.get(CONFIG.STORAGE_KEYS.SPLIT_BILLS)) {
      Storage.set(CONFIG.STORAGE_KEYS.SPLIT_BILLS, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.TABLE_HISTORY)) {
      Storage.set(CONFIG.STORAGE_KEYS.TABLE_HISTORY, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.DISCOUNT_LOGS)) {
      Storage.set(CONFIG.STORAGE_KEYS.DISCOUNT_LOGS, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.PAYMENTS)) {
      Storage.set(CONFIG.STORAGE_KEYS.PAYMENTS, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.RECEIPTS)) {
      Storage.set(CONFIG.STORAGE_KEYS.RECEIPTS, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.AUDIT_LOG)) {
      Storage.set(CONFIG.STORAGE_KEYS.AUDIT_LOG, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.REFUNDS)) {
      Storage.set(CONFIG.STORAGE_KEYS.REFUNDS, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.DAILY_REPORTS)) {
      Storage.set(CONFIG.STORAGE_KEYS.DAILY_REPORTS, []);
    }
    if (!Storage.get(CONFIG.STORAGE_KEYS.CATEGORIES)) {
      Storage.set(CONFIG.STORAGE_KEYS.CATEGORIES, defaultCategories);
    }

    // Update version
    Storage.set('cafe_schema_version', 1);
    console.log('Migration to version 1 completed successfully.');
  }

  if (currentVersion < 2) {
    // Migrate menu items to add category field
    const menu = Storage.get(CONFIG.STORAGE_KEYS.MENU);
    if (menu) {
      let needsUpdate = false;
      menu.forEach(item => {
        if (!item.category) {
          needsUpdate = true;
          // Assign category based on item ID ranges
          if (item.id >= 1 && item.id <= 8) {
            item.category = 'veg';
          } else if (item.id >= 9 && item.id <= 16) {
            item.category = 'non-veg';
          } else if (item.id >= 17 && item.id <= 21) {
            item.category = 'snacks';
          } else if (item.id >= 22 && item.id <= 31) {
            item.category = 'drinks';
          } else if (item.id >= 32 && item.id <= 34) {
            item.category = 'bakery';
          }
        }
      });
      if (needsUpdate) {
        Storage.set(CONFIG.STORAGE_KEYS.MENU, menu);
        console.log('Menu items migrated with category field.');
      }
    }

    // Ensure categories exist
    if (!Storage.get(CONFIG.STORAGE_KEYS.CATEGORIES)) {
      Storage.set(CONFIG.STORAGE_KEYS.CATEGORIES, defaultCategories);
    }

    // Update version
    Storage.set('cafe_schema_version', 2);
    console.log('Migration to version 2 completed successfully.');
  }
}

// Run migration on load
migrateLocalStorage();

// Default categories
const defaultCategories = [
  { id: 'veg', name: 'Veg', order: 1 },
  { id: 'non-veg', name: 'Non-Veg', order: 2 },
  { id: 'snacks', name: 'Snacks', order: 3 },
  { id: 'drinks', name: 'Drinks', order: 4 },
  { id: 'bakery', name: 'Bakery & Sweets', order: 5 }
];

// Category operations
const Categories = {
  get() {
    let categories = Storage.get(CONFIG.STORAGE_KEYS.CATEGORIES);
    if (!categories) {
      categories = defaultCategories;
      Storage.set(CONFIG.STORAGE_KEYS.CATEGORIES, categories);
    }
    return categories;
  },

  set(categories) {
    Storage.set(CONFIG.STORAGE_KEYS.CATEGORIES, categories);
    window.dispatchEvent(new Event('categories_updated'));
  },

  getById(id) {
    return this.get().find(c => c.id === id);
  },

  add(category) {
    const categories = this.get();
    category.id = category.id || category.name.toLowerCase().replace(/\s+/g, '-');
    category.order = category.order || categories.length + 1;
    categories.push(category);
    this.set(categories);
    return category;
  },

  update(id, updates) {
    const categories = this.get();
    const idx = categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...updates };
      this.set(categories);
    }
  },

  remove(id) {
    const categories = this.get();
    const filtered = categories.filter(c => c.id !== id);
    this.set(filtered);
  }
};

// Nepali Café & Restaurant Menu
const defaultMenu = [
  // Veg
  { id: 1, name: 'Veg Momo', price: 120, available: true, category: 'veg' },
  { id: 2, name: 'Paneer Chilli', price: 180, available: true, category: 'veg' },
  { id: 3, name: 'Veg Thukpa', price: 120, available: true, category: 'veg' },
  { id: 4, name: 'Aloo Jeera', price: 90, available: true, category: 'veg' },
  { id: 5, name: 'Veg Chowmein', price: 120, available: true, category: 'veg' },
  { id: 6, name: 'Paneer Butter Masala', price: 220, available: true, category: 'veg' },
  { id: 7, name: 'Dal Bhat Tarkari', price: 180, available: true, category: 'veg' },
  { id: 8, name: 'Veg Fried Rice', price: 120, available: true, category: 'veg' },
  // Non-Veg
  { id: 9, name: 'Chicken Momo', price: 160, available: true, category: 'non-veg' },
  { id: 10, name: 'Chicken Chilli', price: 220, available: true, category: 'non-veg' },
  { id: 11, name: 'Buff Momo', price: 150, available: true, category: 'non-veg' },
  { id: 12, name: 'Chicken Thukpa', price: 150, available: true, category: 'non-veg' },
  { id: 13, name: 'Chicken Chowmein', price: 150, available: true, category: 'non-veg' },
  { id: 14, name: 'Buff Sukuti', price: 250, available: true, category: 'non-veg' },
  { id: 15, name: 'Chicken Fried Rice', price: 150, available: true, category: 'non-veg' },
  { id: 16, name: 'Egg Curry', price: 110, available: true, category: 'non-veg' },
  // Snacks
  { id: 17, name: 'French Fries', price: 90, available: true, category: 'snacks' },
  { id: 18, name: 'Samosa', price: 40, available: true, category: 'snacks' },
  { id: 19, name: 'Pakoda', price: 70, available: true, category: 'snacks' },
  { id: 20, name: 'Spring Roll', price: 90, available: true, category: 'snacks' },
  { id: 21, name: 'Wai Wai Sadeko', price: 80, available: true, category: 'snacks' },
  // Drinks
  { id: 22, name: 'Black Tea', price: 30, available: true, category: 'drinks' },
  { id: 23, name: 'Milk Tea', price: 40, available: true, category: 'drinks' },
  { id: 24, name: 'Lemon Tea', price: 50, available: true, category: 'drinks' },
  { id: 25, name: 'Espresso', price: 80, available: true, category: 'drinks' },
  { id: 26, name: 'Cappuccino', price: 120, available: true, category: 'drinks' },
  { id: 27, name: 'Latte', price: 130, available: true, category: 'drinks' },
  { id: 28, name: 'Cold Coffee', price: 120, available: true, category: 'drinks' },
  { id: 29, name: 'Lassi', price: 70, available: true, category: 'drinks' },
  { id: 30, name: 'Fresh Lemon Soda', price: 60, available: true, category: 'drinks' },
  { id: 31, name: 'Bottled Water', price: 25, available: true, category: 'drinks' },
  // Bakery & Sweets
  { id: 32, name: 'Chocolate Cake', price: 120, available: true, category: 'bakery' },
  { id: 33, name: 'Sel Roti', price: 40, available: true, category: 'bakery' },
  { id: 34, name: 'Kheer', price: 60, available: true, category: 'bakery' }
];

// Menu operations
const Menu = {
  get() {
    let menu = Storage.get(CONFIG.STORAGE_KEYS.MENU);
    if (!menu) {
      menu = defaultMenu;
      Storage.set(CONFIG.STORAGE_KEYS.MENU, menu);
    }
    return menu;
  },

  set(menu) {
    Storage.set(CONFIG.STORAGE_KEYS.MENU, menu);
    window.dispatchEvent(new Event('menu_updated'));
  },

  updateAvailability(id, available) {
    const menu = this.get();
    const idx = menu.findIndex(item => item.id === id);
    if (idx !== -1) {
      menu[idx].available = available;
      this.set(menu);
    }
  }
};

// Order operations
const Orders = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.ORDERS, []);
  },

  set(orders) {
    Storage.set(CONFIG.STORAGE_KEYS.ORDERS, orders);
    window.dispatchEvent(new Event('orders_updated'));
  },

  add(order) {
    const orders = this.get();
    orders.push(order);
    this.set(orders);
  },

  updateStatus(orderId, status) {
    const orders = this.get();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      if (status === 'ready') orders[idx].readyAt = new Date().toISOString();
      if (status === 'completed' || status === 'served') orders[idx].completedAt = new Date().toISOString();
      this.set(orders);
    }
  },

  getTodaysOrders() {
    const today = Utils.getTodayDate();
    return this.get().filter(o => o.createdAt && o.createdAt.startsWith(today));
  },

  getActiveOrders() {
    return this.get().filter(o => o.status !== 'completed');
  },

  getByTable(tableNumber) {
    return this.get().filter(o => o.table === tableNumber && o.status !== 'completed');
  }
};

// Kitchen note operations
const KitchenNote = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.KITCHEN_NOTE, '');
  },

  set(note) {
    Storage.set(CONFIG.STORAGE_KEYS.KITCHEN_NOTE, note);
  }
};

// Split Bill operations
const SplitBills = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.SPLIT_BILLS, []);
  },

  set(bills) {
    Storage.set(CONFIG.STORAGE_KEYS.SPLIT_BILLS, bills);
  },

  createBill(parentOrderId, items, billNumber) {
    const bill = {
      id: Utils.generateId('bill'),
      parentOrderId,
      billNumber,
      items,
      subtotal: Utils.calculateTotal(items),
      vat: 0,
      serviceCharge: 0,
      discount: 0,
      discountReason: '',
      tip: 0,
      total: 0,
      paymentMethod: '',
      paid: false,
      paidAt: null,
      createdBy: Auth.getCurrentUser()?.username
    };
    return bill;
  },

  saveBill(bill) {
    const bills = this.get();
    bills.push(bill);
    this.set(bills);
  },

  updateBill(billId, updates) {
    const bills = this.get();
    const idx = bills.findIndex(b => b.id === billId);
    if (idx !== -1) {
      bills[idx] = { ...bills[idx], ...updates };
      this.set(bills);
    }
  },

  markBillPaid(billId, paymentMethod) {
    const bills = this.get();
    const idx = bills.findIndex(b => b.id === billId);
    if (idx !== -1) {
      bills[idx].paid = true;
      bills[idx].paidAt = new Date().toISOString();
      bills[idx].paymentMethod = paymentMethod;
      this.set(bills);
    }
  },

  checkAllBillsPaid(parentOrderId) {
    const bills = this.get().filter(b => b.parentOrderId === parentOrderId);
    return bills.length > 0 && bills.every(b => b.paid);
  }
};

// Table History operations
const TableHistory = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.TABLE_HISTORY, []);
  },

  add(entry) {
    const history = this.get();
    history.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    Storage.set(CONFIG.STORAGE_KEYS.TABLE_HISTORY, history);
  }
};

// Discount operations
const DiscountLogs = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.DISCOUNT_LOGS, []);
  },

  add(log) {
    const logs = this.get();
    logs.push({
      ...log,
      timestamp: new Date().toISOString()
    });
    Storage.set(CONFIG.STORAGE_KEYS.DISCOUNT_LOGS, logs);
  },

  getDiscountSummary(orderId) {
    return this.get().filter(log => log.orderId === orderId);
  }
};

// Payment operations
const Payments = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.PAYMENTS, []);
  },

  add(payment) {
    const payments = this.get();
    payments.push({
      ...payment,
      id: Utils.generateId('pay'),
      timestamp: new Date().toISOString()
    });
    Storage.set(CONFIG.STORAGE_KEYS.PAYMENTS, payments);
  },

  getByOrderId(orderId) {
    return this.get().filter(p => p.orderId === orderId);
  },

  getTodayPayments() {
    const today = Utils.getTodayDate();
    return this.get().filter(p => p.timestamp && p.timestamp.startsWith(today));
  }
};

// Receipt operations
const Receipts = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.RECEIPTS, []);
  },

  add(receipt) {
    const receipts = this.get();
    receipts.push({
      ...receipt,
      id: Utils.generateId('rcpt'),
      generatedAt: new Date().toISOString()
    });
    Storage.set(CONFIG.STORAGE_KEYS.RECEIPTS, receipts);
  },

  getByOrderId(orderId) {
    return this.get().filter(r => r.orderId === orderId);
  }
};

// Refund operations
const Refunds = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.REFUNDS, []);
  },

  add(refund) {
    const refunds = this.get();
    refunds.push({
      ...refund,
      id: Utils.generateId('ref'),
      processedAt: new Date().toISOString()
    });
    Storage.set(CONFIG.STORAGE_KEYS.REFUNDS, refunds);
  },

  getByOrderId(orderId) {
    return this.get().filter(r => r.orderId === orderId);
  },

  getTodayRefunds() {
    const today = Utils.getTodayDate();
    return this.get().filter(r => r.processedAt && r.processedAt.startsWith(today));
  }
};

// Audit Log operations
const AuditLog = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.AUDIT_LOG, []);
  },

  add(entry) {
    const logs = this.get();
    logs.push({
      ...entry,
      id: Utils.generateId('audit'),
      timestamp: new Date().toISOString()
    });
    Storage.set(CONFIG.STORAGE_KEYS.AUDIT_LOG, logs);
  },

  getByOrderId(orderId) {
    return this.get().filter(log => log.orderId === orderId);
  },

  getByUser(username) {
    return this.get().filter(log => log.user === username);
  },

  getTodayLogs() {
    const today = Utils.getTodayDate();
    return this.get().filter(log => log.timestamp && log.timestamp.startsWith(today));
  }
};

// Daily Report operations
const DailyReports = {
  get() {
    return Storage.get(CONFIG.STORAGE_KEYS.DAILY_REPORTS, []);
  },

  getByDate(date) {
    return this.get().filter(r => r.date === date);
  },

  generateReport(date) {
    const orders = Orders.get().filter(o => o.createdAt && o.createdAt.startsWith(date));
    const payments = Payments.get().filter(p => p.timestamp && p.timestamp.startsWith(date));
    const refunds = Refunds.get().filter(r => r.processedAt && r.processedAt.startsWith(date));
    const discounts = DiscountLogs.get().filter(d => d.timestamp && d.timestamp.startsWith(date));

    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'voided');

    const sales = completedOrders.reduce((sum, o) => {
      const totals = CommercialPOS.calculateOrderTotals(o);
      return sum + totals.total;
    }, 0);

    const cashPayments = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const cardPayments = payments.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0);
    const mobilePayments = payments.filter(p => p.method === 'mobile').reduce((sum, p) => sum + p.amount, 0);

    const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
    const totalDiscounts = discounts.reduce((sum, d) => sum + d.discountAmount, 0);
    const totalTips = orders.reduce((sum, o) => sum + (o.tip || 0), 0);

    const totalVAT = completedOrders.reduce((sum, o) => {
      const totals = CommercialPOS.calculateOrderTotals(o);
      return sum + totals.vat;
    }, 0);

    const totalServiceCharge = completedOrders.reduce((sum, o) => {
      const totals = CommercialPOS.calculateOrderTotals(o);
      return sum + totals.serviceCharge;
    }, 0);

    const avgOrderValue = completedOrders.length > 0 ? sales / completedOrders.length : 0;

    // Find best selling item
    const itemCounts = {};
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
      });
    });
    const bestSellingItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    const report = {
      date,
      sales,
      cashPayments,
      cardPayments,
      mobilePayments,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      refunds: totalRefunds,
      discounts: totalDiscounts,
      tips: totalTips,
      vat: totalVAT,
      serviceCharge: totalServiceCharge,
      avgOrderValue,
      bestSellingItem: bestSellingItem[0],
      bestSellingItemQty: bestSellingItem[1],
      generatedAt: new Date().toISOString()
    };

    return report;
  },

  saveReport(report) {
    const reports = this.get();
    const existingIdx = reports.findIndex(r => r.date === report.date);
    if (existingIdx !== -1) {
      reports[existingIdx] = report;
    } else {
      reports.push(report);
    }
    Storage.set(CONFIG.STORAGE_KEYS.DAILY_REPORTS, reports);
  }
};

// Commercial POS helper functions
const CommercialPOS = {
  // Calculate order totals with VAT, service charge, discount, tip
  calculateOrderTotals(order) {
    const subtotal = Utils.calculateTotal(order.items);
    const vat = CONFIG.VAT_INCLUDED ? 0 : subtotal * CONFIG.VAT_RATE;
    const serviceCharge = subtotal * CONFIG.SERVICE_CHARGE_RATE;
    const discount = order.discount || 0;
    const tip = order.tip || 0;
    const total = subtotal + vat + serviceCharge - discount + tip;

    return {
      subtotal,
      vat,
      serviceCharge,
      discount,
      tip,
      total
    };
  },

  // Split order by quantity
  splitByQuantity(order, splits) {
    const bills = [];
    let billNumber = 1;

    splits.forEach(split => {
      const splitItems = [];
      order.items.forEach(item => {
        const quantityInSplit = split[item.id] || 0;
        if (quantityInSplit > 0) {
          splitItems.push({
            ...item,
            quantity: quantityInSplit
          });
        }
      });

      if (splitItems.length > 0) {
        const bill = SplitBills.createBill(order.id, splitItems, billNumber);
        const totals = this.calculateOrderTotals({ items: splitItems, discount: 0, tip: 0 });
        bill.subtotal = totals.subtotal;
        bill.vat = totals.vat;
        bill.serviceCharge = totals.serviceCharge;
        bill.total = totals.total;
        bills.push(bill);
        billNumber++;
      }
    });

    return bills;
  },

  // Split order equally
  splitEqually(order, numberOfSplits) {
    const bills = [];
    const itemsPerSplit = Math.ceil(order.items.length / numberOfSplits);

    for (let i = 0; i < numberOfSplits; i++) {
      const startIdx = i * itemsPerSplit;
      const endIdx = Math.min(startIdx + itemsPerSplit, order.items.length);
      const splitItems = order.items.slice(startIdx, endIdx);

      if (splitItems.length > 0) {
        const bill = SplitBills.createBill(order.id, splitItems, i + 1);
        const totals = this.calculateOrderTotals({ items: splitItems, discount: 0, tip: 0 });
        bill.subtotal = totals.subtotal;
        bill.vat = totals.vat;
        bill.serviceCharge = totals.serviceCharge;
        bill.total = totals.total;
        bills.push(bill);
      }
    }

    return bills;
  },

  // Apply discount to order
  applyDiscount(order, discountType, discountValue, reason, requiresApproval = false) {
    const subtotal = Utils.calculateTotal(order.items);
    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
      if (discountValue > CONFIG.MAX_DISCOUNT_PERCENT && !requiresApproval) {
        return { success: false, reason: 'Requires manager approval' };
      }
    } else if (discountType === 'flat') {
      discountAmount = discountValue;
      if (discountValue > CONFIG.MAX_DISCOUNT_AMOUNT && !requiresApproval) {
        return { success: false, reason: 'Requires manager approval' };
      }
    }

    // Log the discount
    DiscountLogs.add({
      orderId: order.id,
      discountType,
      discountValue,
      discountAmount,
      reason,
      appliedBy: Auth.getCurrentUser()?.username,
      requiresApproval,
      approved: !requiresApproval
    });

    return { success: true, discountAmount };
  },

  // Merge two tables
  mergeTables(sourceTable, targetTable) {
    const sourceOrders = Orders.getByTable(sourceTable);
    const targetOrders = Orders.getByTable(targetTable);

    if (sourceOrders.length === 0) {
      return { success: false, reason: 'Source table has no active orders' };
    }

    if (targetOrders.length === 0) {
      return { success: false, reason: 'Target table has no active orders' };
    }

    // Move all orders from source to target
    sourceOrders.forEach(order => {
      order.table = targetTable;
      if (order.note) {
        order.note = `Merged from Table ${sourceTable}: ${order.note}`;
      } else {
        order.note = `Merged from Table ${sourceTable}`;
      }
    });

    Orders.set(Orders.get());

    // Log the merge
    TableHistory.add({
      action: 'merge',
      sourceTable,
      targetTable,
      ordersMoved: sourceOrders.length
    });

    return { success: true, ordersMoved: sourceOrders.length };
  },

  // Move order to another table
  moveOrder(orderId, targetTable) {
    const orders = Orders.get();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return { success: false, reason: 'Order not found' };
    }

    const targetOrders = Orders.getByTable(targetTable);
    if (targetOrders.length > 0) {
      return { success: false, reason: 'Target table is occupied' };
    }

    const oldTable = order.table;
    order.table = targetTable;
    Orders.set(orders);

    // Log the move
    TableHistory.add({
      action: 'move',
      orderId,
      fromTable: oldTable,
      toTable: targetTable
    });

    return { success: true };
  },

  // Refund order (admin only)
  refundOrder(orderId, refundAmount, reason, partial = false) {
    const orders = Orders.get();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return { success: false, reason: 'Order not found' };
    }

    if (order.status !== 'paid' && order.status !== 'completed') {
      return { success: false, reason: 'Only paid orders can be refunded' };
    }

    const totals = this.calculateOrderTotals(order);
    if (refundAmount > totals.total) {
      return { success: false, reason: 'Refund amount cannot exceed order total' };
    }

    // Add refund record
    Refunds.add({
      orderId,
      amount: refundAmount,
      reason,
      partial,
      processedBy: Auth.getCurrentUser()?.username
    });

    // Update order status
    order.status = 'refunded';
    Orders.set(orders);

    // Log audit
    AuditLog.add({
      action: 'refund',
      orderId,
      refundAmount,
      reason,
      partial,
      user: Auth.getCurrentUser()?.username
    });

    return { success: true, refundAmount };
  },

  // Void order (admin only)
  voidOrder(orderId, reason) {
    const orders = Orders.get();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return { success: false, reason: 'Order not found' };
    }

    if (order.status === 'paid' || order.status === 'completed') {
      return { success: false, reason: 'Use refund for paid orders' };
    }

    // Remove any payments
    const orderPayments = Payments.getByOrderId(orderId);
    orderPayments.forEach(p => {
      // In a real system, you'd void the payment transaction
    });

    // Update order status
    order.status = 'voided';
    Orders.set(orders);

    // Log audit
    AuditLog.add({
      action: 'void',
      orderId,
      reason,
      user: Auth.getCurrentUser()?.username
    });

    return { success: true };
  },

  // Process payment
  processPayment(orderId, paymentDetails) {
    const orders = Orders.get();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return { success: false, reason: 'Order not found' };
    }

    const totals = this.calculateOrderTotals(order);
    const totalPayment = paymentDetails.reduce((sum, p) => sum + p.amount, 0);

    if (Math.abs(totalPayment - totals.total) > 0.01) {
      return { success: false, reason: 'Payment amount must equal order total' };
    }

    // Check for negative payments
    if (paymentDetails.some(p => p.amount < 0)) {
      return { success: false, reason: 'Negative payment amounts not allowed' };
    }

    // Add payment records
    paymentDetails.forEach(payment => {
      Payments.add({
        orderId,
        method: payment.method,
        amount: payment.amount,
        received: payment.received || payment.amount,
        change: payment.change || 0
      });
    });

    // Update order status
    order.status = 'paid';
    order.paidAt = new Date().toISOString();
    Orders.set(orders);

    // Log audit
    AuditLog.add({
      action: 'payment',
      orderId,
      paymentMethod: paymentDetails.map(p => `${p.method}: ${p.amount}`).join(', '),
      totalAmount: totalPayment,
      user: Auth.getCurrentUser()?.username
    });

    return { success: true, changeDue: paymentDetails[0]?.change || 0 };
  },

  // Generate receipt
  generateReceipt(orderId) {
    const order = Orders.get().find(o => o.id === orderId);
    if (!order) {
      return null;
    }

    const payments = Payments.getByOrderId(orderId);
    const totals = this.calculateOrderTotals(order);

    const receipt = {
      orderId,
      orderNumber: order.id.replace('o_', ''),
      date: order.createdAt.split('T')[0],
      time: order.createdAt.split('T')[1].split('.')[0],
      table: order.table,
      waiter: order.waiter,
      orderType: order.orderType,
      items: order.items,
      subtotal: totals.subtotal,
      vat: totals.vat,
      serviceCharge: totals.serviceCharge,
      discount: totals.discount,
      tip: totals.tip,
      total: totals.total,
      payments: payments,
      note: order.note
    };

    // Save receipt
    Receipts.add(receipt);

    // Log audit
    AuditLog.add({
      action: 'receipt_generated',
      orderId,
      receiptId: receipt.id,
      user: Auth.getCurrentUser()?.username
    });

    return receipt;
  },

  // Validation functions
  validate(orderId, action) {
    const order = Orders.get().find(o => o.id === orderId);
    if (!order) {
      return { valid: false, reason: 'Order not found' };
    }

    switch (action) {
      case 'refund':
        if (order.status !== 'paid' && order.status !== 'completed') {
          return { valid: false, reason: 'Order must be paid to refund' };
        }
        const existingRefund = Refunds.getByOrderId(orderId);
        if (existingRefund.length > 0) {
          return { valid: false, reason: 'Order already refunded' };
        }
        break;

      case 'void':
        if (order.status === 'paid' || order.status === 'completed') {
          return { valid: false, reason: 'Use refund for paid orders' };
        }
        if (order.status === 'voided') {
          return { valid: false, reason: 'Order already voided' };
        }
        break;

      case 'payment':
        const existingPayments = Payments.getByOrderId(orderId);
        if (existingPayments.length > 0) {
          return { valid: false, reason: 'Order already paid' };
        }
        break;

      case 'split':
        const existingSplit = SplitBills.get().filter(b => b.parentOrderId === orderId);
        if (existingSplit.length > 0) {
          return { valid: false, reason: 'Order already split' };
        }
        if (order.status === 'refunded') {
          return { valid: false, reason: 'Cannot split refunded orders' };
        }
        break;

      case 'move':
        if (order.status === 'paid' || order.status === 'completed') {
          return { valid: false, reason: 'Cannot move paid orders' };
        }
        break;

      case 'merge':
        if (order.status === 'paid' || order.status === 'completed') {
          return { valid: false, reason: 'Cannot merge paid orders' };
        }
        break;

      case 'discount':
        const totals = this.calculateOrderTotals(order);
        if (order.discount && order.discount >= totals.subtotal) {
          return { valid: false, reason: 'Discount cannot exceed subtotal' };
        }
        break;

      default:
        return { valid: false, reason: 'Unknown action' };
    }

    return { valid: true };
  }
};