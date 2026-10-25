// Waiter page logic
document.addEventListener('DOMContentLoaded', () => {
  console.log('Waiter page loaded');

  // Check authentication
  Auth.requireAuth();

  const menu = Menu.get();
  console.log('Menu loaded:', menu.length, 'items');
  const selectedItems = [];

  // DOM elements
  const orderForm = document.getElementById('orderForm');
  const ordersList = document.getElementById('ordersList');
  const tablesGrid = document.getElementById('tablesGrid');
  const tableNumberInput = document.getElementById('tableNumber');
  const orderTypeInput = document.getElementById('orderType');
  const menuSearch = document.getElementById('menuSearch');
  const categorySelect = document.getElementById('categorySelect');

  console.log('DOM elements:', {
    orderForm: !!orderForm,
    ordersList: !!ordersList,
    tablesGrid: !!tablesGrid,
    tableNumberInput: !!tableNumberInput,
    orderTypeInput: !!orderTypeInput,
    menuSearch: !!menuSearch,
    categorySelect: !!categorySelect
  });

  // Get categories from Categories service
  const categories = Categories.get();

  // Populate category dropdown
  function populateCategories() {
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }
  populateCategories();

  // Quick access / favorites items (for fast ordering)
  // Removed as per user request

  // Table management
  function getTableStatus() {
    const orders = Orders.get();
    const status = {};
    for (let i = 1; i <= CONFIG.TABLE_COUNT; i++) status[i] = 'free';
    orders.forEach(o => {
      if (o.status !== 'completed' && o.orderType !== 'takeaway') {
        status[o.table] = 'occupied';
      }
    });
    return status;
  }

  function renderTables() {
    console.log('Rendering tables...');
    const status = getTableStatus();
    tablesGrid.innerHTML = '';
    for (let i = 1; i <= CONFIG.TABLE_COUNT; i++) {
      const btn = document.createElement('button');
      btn.textContent = `Table ${i}`;
      if (status[i] === 'free') {
        btn.style.background = '#eee';
      } else {
        const orders = Orders.getByTable(i);
        let color = '#81c784'; // green (eating)
        if (orders.some(o => o.status === 'ready')) color = '#ff5252'; // red (unpaid)
        btn.style.background = color;
      }
      btn.style.color = '#222';
      btn.style.fontWeight = 'bold';
      btn.style.border = '2px solid #888';
      btn.style.margin = '1px';
      btn.disabled = false;
      btn.onclick = () => {
        tableNumberInput.value = i;
        orderTypeInput.value = 'dinein';
      };
      tablesGrid.appendChild(btn);
      
      if (status[i] === 'occupied') {
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear Table';
        clearBtn.className = 'clear-table-btn';
        clearBtn.style.marginLeft = '8px';
        clearBtn.onclick = () => {
          const orders = Orders.get();
          let changed = false;
          orders.forEach(o => {
            if (o.table == i && o.status !== 'completed') {
              o.status = 'completed';
              o.completedAt = new Date().toISOString();
              changed = true;
            }
          });
          if (changed) Orders.set(orders);
          renderTables();
          renderOrders();
        };
        tablesGrid.appendChild(clearBtn);
      }
    }
  }

  // Order type change handler
  orderTypeInput.addEventListener('change', () => {
    if (orderTypeInput.value === 'takeaway') {
      tableNumberInput.value = '';
      tableNumberInput.disabled = true;
    } else {
      tableNumberInput.disabled = false;
    }
  });

  // Filter menu based on search
  function getFilteredMenu() {
    const search = (menuSearch?.value || '').trim().toLowerCase();
    if (!search) return menu;
    return menu.filter(item => {
      const txt = [item.name, item.tags?.join(' ') || '', item.desc || ''].join(' ').toLowerCase();
      return txt.includes(search);
    });
  }

  // Category change handler
  categorySelect.addEventListener('change', () => {
    renderMenuGrid();
  });

  // Search handler
  menuSearch.addEventListener('input', () => {
    renderMenuGrid();
  });

  // Render menu grid based on selected category
  function renderMenuGrid() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const selectedCategory = categorySelect.value; // Keep as ID
    const searchTerm = menuSearch.value.toLowerCase();

    let filteredMenu = menu;

    // Filter by category if selected
    if (selectedCategory) {
      filteredMenu = menu.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filteredMenu = filteredMenu.filter(item => item.name.toLowerCase().includes(searchTerm));
    }

    // Show empty state if no items
    if (filteredMenu.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2em; color: #888;">No items found in this category</div>';
      return;
    }

    filteredMenu.forEach(item => {
      const card = document.createElement('div');
      const isSelected = selectedItems.some(i => i.id === item.id);
      const selectedItem = selectedItems.find(i => i.id === item.id);
      const quantity = selectedItem ? selectedItem.quantity : 1;

      card.className = 'menu-card' + (isSelected ? ' selected' : '');
      card.tabIndex = 0;
      card.style.outline = 'none';

      let img = '';
      if (item.img) {
        if (item.img.startsWith('assets/')) {
          img = `<img src='${item.img}' alt='' />`;
        } else {
          img = `<span class='emoji'>${item.img}</span>`;
        }
      }

      card.innerHTML = `
        ${img}
        <div class="item-name">${item.name}</div>
        <div class="item-price">${Utils.formatCurrency(item.price)}</div>
        <div class="item-quantity">
          <button class="qty-btn minus" data-id="${item.id}">-</button>
          <span class="qty-value">${quantity}</span>
          <button class="qty-btn plus" data-id="${item.id}">+</button>
        </div>
      `;

      // Quantity button handlers
      card.querySelector('.minus').addEventListener('click', (e) => {
        e.stopPropagation();
        updateItemQuantity(item.id, -1);
      });

      card.querySelector('.plus').addEventListener('click', (e) => {
        e.stopPropagation();
        updateItemQuantity(item.id, 1);
      });

      // Add item on card click
      card.addEventListener('click', () => {
        updateItemQuantity(item.id, 1);
      });

      grid.appendChild(card);
    });
  }

  function updateItemQuantity(itemId, change) {
    const idx = selectedItems.findIndex(i => i.id === itemId);
    const menuItem = menu.find(m => m.id === itemId);

    if (idx !== -1) {
      selectedItems[idx].quantity += change;
      if (selectedItems[idx].quantity <= 0) {
        selectedItems.splice(idx, 1);
      }
    } else if (change > 0 && menuItem) {
      selectedItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      });
    }

    renderMenuGrid();
    renderOrderSummary();
  }

  // Render order summary
  function renderOrderSummary() {
    const summaryPane = document.getElementById('orderSummaryPane');
    const itemsDiv = document.getElementById('summaryItems');
    
    if (!summaryPane || !itemsDiv) return;
    
    // Show/hide summary based on items
    if (!selectedItems.length) {
      summaryPane.style.display = 'none';
      return;
    }
    
    summaryPane.style.display = 'block';

    itemsDiv.innerHTML = selectedItems.map(item => `
      <div class="summary-item">
        <span>${item.name} x${item.quantity || 1}</span>
        <span>${Utils.formatCurrency(item.price * (item.quantity || 1))}</span>
        <button class="remove-item" data-id="${item.id}">×</button>
      </div>
    `).join('');

    // Add remove handlers
    itemsDiv.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = selectedItems.findIndex(i => i.id === id);
        if (idx !== -1) {
          selectedItems.splice(idx, 1);
          renderMenuGrid();
          renderOrderSummary();
        }
      });
    });

    const total = selectedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    itemsDiv.innerHTML += `<div class="summary-total"><strong>Total: ${Utils.formatCurrency(total)}</strong></div>`;
  }

  // Render orders
  function renderOrders() {
    const user = Auth.getCurrentUser();
    const orders = Orders.get().filter(o => o.waiter === user.username && o.status !== 'completed');
    ordersList.innerHTML = '';
    if (orders.length === 0) {
      ordersList.innerHTML = '<em>No active orders.</em>';
      return;
    }
    orders.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-status status-' + order.status;
      const totals = CommercialPOS.calculateOrderTotals(order);
      div.innerHTML = `
        <div><strong>Table ${order.table}</strong> | ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
        <div>Items: ${order.items.map(i => i.name).join(', ')}</div>
        <div>Status: ${order.status} | Total: ${Utils.formatCurrency(totals.total)}</div>
        <div style="margin-top:8px;">
          <button onclick="openDiscountModal('${order.id}')" style="margin-right:5px;font-size:12px;padding:4px 8px;">Discount</button>
          <button onclick="openMoveTableModal('${order.id}')" style="margin-right:5px;font-size:12px;padding:4px 8px;">Move Table</button>
          <button onclick="openPaymentModal('${order.id}')" style="font-size:12px;padding:4px 8px;">Pay</button>
        </div>
      `;
      ordersList.appendChild(div);
    });
  }

  // Kitchen note display
  function showKitchenNote() {
    const noteDiv = document.getElementById('waiterKitchenNote');
    if (!noteDiv) return;
    const note = KitchenNote.get();
    noteDiv.textContent = note || 'No announcement from kitchen.';
  }

  // Listen for kitchen announcement updates
  window.addEventListener('kitchen_announcement_updated', showKitchenNote);

  // Listen for localStorage changes (cross-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === CONFIG.STORAGE_KEYS.KITCHEN_NOTE) {
      showKitchenNote();
    }
  });

  // Order form submit (Send to Kitchen)
  orderForm.onsubmit = function(e) {
    e.preventDefault();
    const table = parseInt(tableNumberInput.value);
    const tip = parseFloat(document.getElementById('tip').value) || 0;
    const orderType = orderTypeInput.value;

    if (orderType === 'dinein') {
      const status = getTableStatus();
      if (!table || status[table] === 'occupied') {
        UI.alert('Selected table is already occupied or invalid.');
        return;
      }
    }

    if (selectedItems.length === 0) {
      UI.alert('Select at least one item.');
      return;
    }

    const items = selectedItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1
    }));
    const user = Auth.getCurrentUser();
    const note = document.getElementById('orderNote').value;

    const order = {
      id: Utils.generateId('o'),
      table,
      items,
      status: 'sent',
      createdAt: new Date().toISOString(),
      waiter: user.username,
      tip,
      note,
      orderType
    };

    Orders.add(order);
    UI.alert('Order sent to kitchen successfully!');
    orderForm.reset();
    categorySelect.value = '';
    selectedItems.length = 0;
    renderMenuGrid();
    renderOrderSummary();
    renderOrders();
  };

  const toggleDark = document.getElementById('toggleDark');
  if (toggleDark) {
    toggleDark.onclick = () => {
      document.body.classList.toggle('dark');
    };
  }
  
  const summaryCheckout = document.getElementById('summaryCheckout');
  if (summaryCheckout) {
    summaryCheckout.onclick = () => {
      // Create a temporary order for checkout
      const table = parseInt(tableNumberInput.value) || 0;
      const tip = parseFloat(document.getElementById('tip').value) || 0;
      const orderType = orderTypeInput.value;
      const note = document.getElementById('orderNote').value;

      const order = {
        id: Utils.generateId('o'),
        table,
        items: selectedItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        status: 'paid',
        createdAt: new Date().toISOString(),
        waiter: Auth.getCurrentUser()?.username,
        tip,
        note,
        orderType
      };

      // Show receipt
      showReceipt(order);
    };
  }

  function showReceipt(order) {
    const modal = document.getElementById('receiptModal');
    const content = document.getElementById('receiptContent');

    const totals = CommercialPOS.calculateOrderTotals(order);

    content.innerHTML = `
      <div style="text-align:center;border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px;">
        <h3 style="margin:0;">☕ CaféPOS</h3>
        <div style="font-size:12px;margin:5px 0;">Receipt</div>
        <div style="font-size:11px;">${new Date().toLocaleString()}</div>
      </div>
      <div style="margin-bottom:10px;font-size:12px;">
        <div><strong>Table:</strong> ${order.table || 'N/A'}</div>
        <div><strong>Type:</strong> ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
        <div><strong>Waiter:</strong> ${order.waiter || 'N/A'}</div>
      </div>
      <div style="border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px;font-size:12px;">
        ${order.items.map(item => `
          <div style="display:flex;justify-content:space-between;margin:2px 0;">
            <span>${item.name} x${item.quantity || 1}</span>
            <span>${Utils.formatCurrency(item.price * (item.quantity || 1))}</span>
          </div>
        `).join('')}
      </div>
      <div style="border-top:1px dashed #000;padding-top:10px;margin-top:10px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${Utils.formatCurrency(totals.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>VAT (13%):</span><span>${Utils.formatCurrency(totals.vat)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>Service Charge (10%):</span><span>${Utils.formatCurrency(totals.serviceCharge)}</span></div>
        ${order.tip ? `<div style="display:flex;justify-content:space-between;"><span>Tip:</span><span>${Utils.formatCurrency(order.tip)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-top:8px;"><span>TOTAL:</span><span>${Utils.formatCurrency(totals.total)}</span></div>
      </div>
      <div style="text-align:center;margin-top:20px;font-size:11px;">
        Thank you for dining with us!
      </div>
    `;

    modal.style.display = 'flex';
  }

  document.getElementById('closeReceipt').addEventListener('click', () => {
    document.getElementById('receiptModal').style.display = 'none';
    // Clear order after closing receipt
    selectedItems.length = 0;
    renderMenuGrid();
    renderOrderSummary();
    orderForm.reset();
    categorySelect.value = '';
  });

  document.getElementById('printReceipt').addEventListener('click', () => {
    window.print();
  });

  // Event listeners
  window.addEventListener('orders_updated', renderOrders);
  window.addEventListener('menu_updated', renderMenuGrid);
  if (menuSearch) {
    menuSearch.addEventListener('input', Utils.debounce(renderMenuGrid, 300));
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', Auth.logout);
  }

  // Initial render
  console.log('Starting initial render...');
  renderTables();
  renderMenuGrid();
  renderOrders();
  renderOrderSummary();
  showKitchenNote();
  console.log('Initial render complete');

  // Periodically refresh kitchen note (every 30 seconds)
  setInterval(showKitchenNote, 30000);

  // ===== COMMERCIAL POS FEATURES =====

  // Split Bill functionality removed for now
  // Can be re-enabled if needed in the future

  // Merge Tables Modal
  const mergeTablesBtn = document.getElementById('mergeTablesBtn');
  if (mergeTablesBtn) {
    mergeTablesBtn.addEventListener('click', openMergeTablesModal);
  }

  function openMergeTablesModal() {
    const modal = document.getElementById('mergeTablesModal');
    const sourceSelect = document.getElementById('mergeSourceTable');
    const targetSelect = document.getElementById('mergeTargetTable');

    const status = getTableStatus();
    const allTables = Object.keys(status).map(t => parseInt(t));

    // Show all tables, but mark occupied ones
    sourceSelect.innerHTML = allTables.map(t => 
      `<option value="${t}">Table ${t} ${status[t] === 'occupied' ? '(Occupied)' : '(Available)'}</option>`
    ).join('');
    
    targetSelect.innerHTML = allTables.map(t => 
      `<option value="${t}">Table ${t} ${status[t] === 'occupied' ? '(Occupied)' : '(Available)'}</option>`
    ).join('');

    modal.style.display = 'flex';
  }

  document.getElementById('cancelMergeTables').addEventListener('click', () => {
    document.getElementById('mergeTablesModal').style.display = 'none';
  });

  document.getElementById('confirmMergeTables').addEventListener('click', () => {
    const sourceTable = parseInt(document.getElementById('mergeSourceTable').value);
    const targetTable = parseInt(document.getElementById('mergeTargetTable').value);

    if (sourceTable === targetTable) {
      UI.alert('Source and target tables cannot be the same.');
      return;
    }

    if (!confirm(`Merge Table ${sourceTable} into Table ${targetTable}?`)) {
      return;
    }

    const result = CommercialPOS.mergeTables(sourceTable, targetTable);
    if (result.success) {
      UI.alert(`Successfully merged ${result.ordersMoved} orders.`);
      document.getElementById('mergeTablesModal').style.display = 'none';
      renderTables();
      renderOrders();
    } else {
      UI.alert(result.reason);
    }
  });

  // Move Table Modal
  let currentMoveOrderId = null;

  window.openMoveTableModal = function(orderId) {
    currentMoveOrderId = orderId;
    const modal = document.getElementById('moveTableModal');
    const targetSelect = document.getElementById('moveTargetTable');

    const status = getTableStatus();
    const availableTables = Object.entries(status).filter(([_, s]) => s === 'free').map(([t, _]) => parseInt(t));

    targetSelect.innerHTML = availableTables.map(t => `<option value="${t}">Table ${t}</option>`).join('');

    if (availableTables.length === 0) {
      UI.alert('No available tables to move to.');
      return;
    }

    modal.style.display = 'flex';
  };

  document.getElementById('cancelMoveTable').addEventListener('click', () => {
    document.getElementById('moveTableModal').style.display = 'none';
    currentMoveOrderId = null;
  });

  document.getElementById('confirmMoveTable').addEventListener('click', () => {
    const targetTable = parseInt(document.getElementById('moveTargetTable').value);

    if (!currentMoveOrderId) return;

    const result = CommercialPOS.moveOrder(currentMoveOrderId, targetTable);
    if (result.success) {
      UI.alert('Order moved successfully.');
      document.getElementById('moveTableModal').style.display = 'none';
      renderTables();
      renderOrders();
    } else {
      UI.alert(result.reason);
    }
  });

  // Discount Modal
  let currentDiscountOrderId = null;

  window.openDiscountModal = function(orderId) {
    currentDiscountOrderId = orderId;
    const modal = document.getElementById('discountModal');
    const warningDiv = document.getElementById('discountWarning');

    document.getElementById('discountValue').value = '';
    warningDiv.style.display = 'none';
    modal.style.display = 'flex';
  };

  document.getElementById('discountType').addEventListener('change', () => {
    const type = document.getElementById('discountType').value;
    const warningDiv = document.getElementById('discountWarning');

    if (type === 'percentage') {
      warningDiv.textContent = `Max discount: ${CONFIG.MAX_DISCOUNT_PERCENT}%`;
    } else {
      warningDiv.textContent = `Max discount: ${CONFIG.MAX_DISCOUNT_AMOUNT} NPR`;
    }
    warningDiv.style.display = 'block';
  });

  document.getElementById('cancelDiscount').addEventListener('click', () => {
    document.getElementById('discountModal').style.display = 'none';
    currentDiscountOrderId = null;
  });

  document.getElementById('confirmDiscount').addEventListener('click', () => {
    if (!currentDiscountOrderId) return;

    const order = Orders.get().find(o => o.id === currentDiscountOrderId);
    if (!order) return;

    const discountType = document.getElementById('discountType').value;
    const discountValue = parseFloat(document.getElementById('discountValue').value);
    const reason = document.getElementById('discountReason').value;

    if (!discountValue || discountValue <= 0) {
      UI.alert('Please enter a valid discount value.');
      return;
    }

    const result = CommercialPOS.applyDiscount(order, discountType, discountValue, reason);

    if (result.success) {
      order.discount = result.discountAmount;
      order.discountReason = reason;
      Orders.set(Orders.get());
      UI.alert(`Discount of ${Utils.formatCurrency(result.discountAmount)} applied successfully.`);
      document.getElementById('discountModal').style.display = 'none';
      renderOrders();
    } else {
      UI.alert(result.reason);
    }
  });

  // Payment Modal
  let currentPaymentOrderId = null;

  window.openPaymentModal = function(orderId) {
    currentPaymentOrderId = orderId;
    const order = Orders.get().find(o => o.id === orderId);
    if (!order) return;

    const validation = CommercialPOS.validate(orderId, 'payment');
    if (!validation.valid) {
      UI.alert(validation.reason);
      return;
    }

    const modal = document.getElementById('paymentModal');
    const info = document.getElementById('paymentOrderInfo');
    const totals = CommercialPOS.calculateOrderTotals(order);

    info.textContent = `Order #${order.id.replace('o_', '')} | Table ${order.table} | Total: ${Utils.formatCurrency(totals.total)}`;

    document.getElementById('paymentMethod').value = 'cash';
    document.getElementById('amountReceived').value = totals.total;
    document.getElementById('changeDue').textContent = '';
    document.getElementById('mixedPaymentDiv').style.display = 'none';
    document.getElementById('cashPaymentDiv').style.display = 'block';

    modal.style.display = 'flex';
  };

  document.getElementById('paymentMethod').addEventListener('change', (e) => {
    const cashDiv = document.getElementById('cashPaymentDiv');
    const mixedDiv = document.getElementById('mixedPaymentDiv');

    if (e.target.value === 'mixed') {
      cashDiv.style.display = 'none';
      mixedDiv.style.display = 'block';
      addMixedPaymentInput();
    } else {
      cashDiv.style.display = 'block';
      mixedDiv.style.display = 'none';
    }
  });

  document.getElementById('amountReceived').addEventListener('input', (e) => {
    const order = Orders.get().find(o => o.id === currentPaymentOrderId);
    if (!order) return;

    const totals = CommercialPOS.calculateOrderTotals(order);
    const received = parseFloat(e.target.value) || 0;
    const change = received - totals.total;

    document.getElementById('changeDue').textContent = change >= 0 ?
      `Change Due: ${Utils.formatCurrency(change)}` :
      `Insufficient: ${Utils.formatCurrency(Math.abs(change))}`;
  });

  function addMixedPaymentInput() {
    const container = document.getElementById('mixedPaymentInputs');
    const methodSelect = document.createElement('select');
    methodSelect.className = 'mixed-payment-method';
    methodSelect.innerHTML = `
      <option value="cash">Cash</option>
      <option value="card">Card</option>
      <option value="mobile">Mobile Wallet</option>
    `;
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'mixed-payment-amount';
    amountInput.placeholder = 'Amount';
    amountInput.min = '0';
    amountInput.style.width = '100px';
    amountInput.style.margin = '5px';

    const div = document.createElement('div');
    div.style.margin = '5px 0';
    div.appendChild(methodSelect);
    div.appendChild(amountInput);
    container.appendChild(div);
  }

  document.getElementById('addPaymentMethod').addEventListener('click', addMixedPaymentInput);

  document.getElementById('cancelPayment').addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
    currentPaymentOrderId = null;
    document.getElementById('mixedPaymentInputs').innerHTML = '';
  });

  document.getElementById('confirmPayment').addEventListener('click', () => {
    if (!currentPaymentOrderId) return;

    const order = Orders.get().find(o => o.id === currentPaymentOrderId);
    if (!order) return;

    const paymentMethod = document.getElementById('paymentMethod').value;
    const totals = CommercialPOS.calculateOrderTotals(order);
    let paymentDetails = [];

    if (paymentMethod === 'mixed') {
      const methods = document.querySelectorAll('.mixed-payment-method');
      const amounts = document.querySelectorAll('.mixed-payment-amount');

      methods.forEach((method, i) => {
        const amount = parseFloat(amounts[i].value) || 0;
        if (amount > 0) {
          paymentDetails.push({
            method: method.value,
            amount,
            received: amount,
            change: 0
          });
        }
      });

      const totalPayment = paymentDetails.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPayment - totals.total) > 0.01) {
        UI.alert(`Total payment (${Utils.formatCurrency(totalPayment)}) must equal order total (${Utils.formatCurrency(totals.total)})`);
        return;
      }
    } else {
      const received = parseFloat(document.getElementById('amountReceived').value) || 0;
      const change = received - totals.total;

      if (received < totals.total) {
        UI.alert('Insufficient payment amount.');
        return;
      }

      paymentDetails.push({
        method: paymentMethod,
        amount: totals.total,
        received,
        change
      });
    }

    const result = CommercialPOS.processPayment(currentPaymentOrderId, paymentDetails);
    if (result.success) {
      UI.alert(`Payment processed successfully. Change: ${Utils.formatCurrency(result.changeDue)}`);
      document.getElementById('paymentModal').style.display = 'none';
      document.getElementById('mixedPaymentInputs').innerHTML = '';
      renderOrders();
      renderTables();
    } else {
      UI.alert(result.reason);
    }
  });
});