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

  console.log('DOM elements:', {
    orderForm: !!orderForm,
    ordersList: !!ordersList,
    tablesGrid: !!tablesGrid,
    tableNumberInput: !!tableNumberInput,
    orderTypeInput: !!orderTypeInput,
    menuSearch: !!menuSearch
  });

  // Favorite sections configuration
  const favoriteSections = [
    {
      name: "Veg",
      items: [
        { key: "veg momo", label: "Veg Momo" },
        { key: "paneer chilli", label: "Paneer Chilli" },
        { key: "veg thukpa", label: "Veg Thukpa" },
        { key: "aloo jeera", label: "Aloo Jeera" },
        { key: "veg chowmein", label: "Veg Chowmein" },
        { key: "paneer butter masala", label: "Paneer Butter Masala" },
        { key: "dal bhat tarkari", label: "Dal Bhat Tarkari" },
        { key: "veg fried rice", label: "Veg Fried Rice" }
      ]
    },
    {
      name: "Non-Veg",
      items: [
        { key: "chicken momo", label: "Chicken Momo" },
        { key: "chicken chilli", label: "Chicken Chilli" },
        { key: "buff momo", label: "Buff Momo" },
        { key: "chicken thukpa", label: "Chicken Thukpa" },
        { key: "chicken chowmein", label: "Chicken Chowmein" },
        { key: "buff sukuti", label: "Buff Sukuti" },
        { key: "chicken fried rice", label: "Chicken Fried Rice" },
        { key: "egg curry", label: "Egg Curry" }
      ]
    },
    {
      name: "Snacks",
      items: [
        { key: "french fries", label: "French Fries" },
        { key: "samosa", label: "Samosa" },
        { key: "pakoda", label: "Pakoda" },
        { key: "spring roll", label: "Spring Roll" },
        { key: "wai wai sadeko", label: "Wai Wai Sadeko" }
      ]
    },
    {
      name: "Drinks",
      items: [
        { key: "black tea", label: "Black Tea" },
        { key: "milk tea", label: "Milk Tea" },
        { key: "lemon tea", label: "Lemon Tea" },
        { key: "espresso", label: "Espresso" },
        { key: "cappuccino", label: "Cappuccino" },
        { key: "latte", label: "Latte" },
        { key: "cold coffee", label: "Cold Coffee" },
        { key: "lassi", label: "Lassi" },
        { key: "fresh lemon soda", label: "Fresh Lemon Soda" },
        { key: "bottled water", label: "Bottled Water" }
      ]
    },
    {
      name: "Bakery & Sweets",
      items: [
        { key: "chocolate cake", label: "Chocolate Cake" },
        { key: "sel roti", label: "Sel Roti" },
        { key: "kheer", label: "Kheer" }
      ]
    }
  ];

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

  // Render favorites bar
  function renderFavoritesBar() {
    const bar = document.getElementById('favoritesBar');
    if (!bar) return;
    bar.innerHTML = '';
    favoriteSections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'favorites-section';
      
      const title = document.createElement('div');
      title.className = 'fav-section-title';
      title.textContent = section.name;
      sectionDiv.appendChild(title);
      
      const btnRow = document.createElement('div');
      btnRow.className = 'fav-section-row';
      
      section.items.forEach(fav => {
        const item = menu.find(m => {
          const menuName = m.name.toLowerCase();
          const favKey = fav.key.toLowerCase();
          return menuName === favKey || menuName.includes(favKey) || favKey.includes(menuName);
        });
        
        const btn = document.createElement('button');
        btn.className = 'fav-btn';
        if (item && selectedItems.some(i => i.id === item.id)) btn.classList.add('selected');
        btn.innerHTML = fav.label;
        
        if (item) {
          btn.onclick = () => {
            const idxSel = selectedItems.findIndex(i => i.id === item.id);
            if (idxSel === -1) selectedItems.push(item);
            else selectedItems.splice(idxSel, 1);
            renderMenuGrid();
            renderFavoritesBar();
            renderOrderSummary();
          };
        } else {
          btn.disabled = true;
          btn.classList.add('disabled');
        }
        btnRow.appendChild(btn);
      });
      
      sectionDiv.appendChild(btnRow);
      bar.appendChild(sectionDiv);
    });
  }

  // Render menu grid
  function renderMenuGrid() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const filteredMenu = getFilteredMenu();
    filteredMenu.forEach(item => {
      const card = document.createElement('div');
      card.className = 'menu-card' + (selectedItems.some(i => i.id === item.id) ? ' selected' : '');
      card.tabIndex = 0;
      card.style.outline = 'none';
      card.onclick = () => {
        const idx = selectedItems.findIndex(i => i.id === item.id);
        if (idx === -1) {
          selectedItems.push(item);
        } else {
          selectedItems.splice(idx, 1);
        }
        renderMenuGrid();
        renderFavoritesBar();
        renderOrderSummary();
      };
      
      let img = '';
      if (item.img) {
        if (item.img.startsWith('assets/')) {
          img = `<img src='${item.img}' alt='' />`;
        } else {
          img = `<span class='emoji'>${item.img}</span>`;
        }
      }
      
      card.innerHTML = `${img}<div>${item.name}</div><div style='font-size:0.85em;color:#aaa;'>${Utils.formatCurrency(item.price)}</div>`;
      grid.appendChild(card);
    });
  }

  // Render order summary
  function renderOrderSummary() {
    const itemsDiv = document.getElementById('summaryItems');
    if (!itemsDiv) return;
    if (!selectedItems.length) {
      itemsDiv.textContent = 'No items yet.';
      return;
    }
    const total = Utils.calculateTotal(selectedItems);
    itemsDiv.innerHTML = selectedItems.map(i => `<span style='margin-right:12px;'>${i.name}</span>`).join('') + 
                      `<b style='margin-left:18px;color:#004E89;'>${Utils.formatCurrency(total)}</b>`;
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
          <button onclick="openSplitBillModal('${order.id}')" style="margin-right:5px;font-size:12px;padding:4px 8px;">Split Bill</button>
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
    noteDiv.textContent = note || 'No note from kitchen.';
  }

  // Print modals
  function showPrintModals(order) {
    document.querySelectorAll('.print-modal').forEach(e => e.remove());
    
    const total = Utils.calculateTotal(order.items) + (order.tip || 0);
    
    const kitchen = document.createElement('div');
    kitchen.className = 'print-modal';
    kitchen.innerHTML = `
      <h2>Kitchen Slip</h2>
      <div><b>Table:</b> ${order.table}</div>
      <div><b>Waiter:</b> ${order.waiter}</div>
      <div><b>Type:</b> ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
      <div><b>Items:</b><ul style='margin:0 0 0 1em;padding:0;'>${order.items.map(i => `<li>${i.name} - ${Utils.formatCurrency(i.price)}</li>`).join('')}</ul></div>
      <div><b>Tip:</b> ${Utils.formatCurrency(order.tip || 0)}</div>
      <div><b>Total:</b> ${Utils.formatCurrency(total)} <span style='font-size:0.9em;color:#888;'>(VAT included)</span></div>
      <button onclick="window.print()">Print</button>
      <button onclick="this.parentElement.remove()">Close</button>
    `;
    document.body.appendChild(kitchen);
    
    const bill = document.createElement('div');
    bill.className = 'print-modal';
    bill.style.left = '60%';
    bill.innerHTML = `
      <h2>Customer Bill</h2>
      <div><b>Table:</b> ${order.table}</div>
      <div><b>Waiter:</b> ${order.waiter}</div>
      <div><b>Type:</b> ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
      <div><b>Items:</b><ul style='margin:0 0 0 1em;padding:0;'>${order.items.map(i => `<li>${i.name} - ${Utils.formatCurrency(i.price)}</li>`).join('')}</ul></div>
      <div><b>Tip:</b> ${Utils.formatCurrency(order.tip || 0)}</div>
      <div><b>Total:</b> ${Utils.formatCurrency(total)} <span style='font-size:0.9em;color:#888;'>(VAT included)</span></div>
      <button onclick="window.print()">Print</button>
      <button onclick="this.parentElement.remove()">Close</button>
    `;
    document.body.appendChild(bill);
  }

  // Order form submit
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
    
    const items = selectedItems.map(item => ({ id: item.id, name: item.name, price: item.price }));
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
    showPrintModals(order);
    orderForm.reset();
    selectedItems.length = 0;
    renderMenu();
  };

  // FAB buttons
  const fabNewOrder = document.getElementById('fabNewOrder');
  if (fabNewOrder) {
    fabNewOrder.onclick = () => {
      orderForm.reset();
      selectedItems.length = 0;
      renderMenu();
      renderOrderSummary();
    };
  }
  
  const fabClear = document.getElementById('fabClear');
  if (fabClear) {
    fabClear.onclick = () => {
      selectedItems.length = 0;
      renderMenu();
      renderOrderSummary();
    };
  }
  
  const fabHelp = document.getElementById('fabHelp');
  if (fabHelp) {
    fabHelp.onclick = () => {
      UI.alert('Need help? Call +91 XXXX-XXXXXX or ask your manager.');
    };
  }
  
  const toggleDark = document.getElementById('toggleDark');
  if (toggleDark) {
    toggleDark.onclick = () => {
      document.body.classList.toggle('dark');
    };
  }
  
  const summaryCheckout = document.getElementById('summaryCheckout');
  if (summaryCheckout) {
    summaryCheckout.onclick = () => {
      orderForm.requestSubmit();
    };
  }

  // Main render function
  function renderMenu() {
    renderFavoritesBar();
    renderMenuGrid();
  }

  // Event listeners
  window.addEventListener('orders_updated', renderOrders);
  window.addEventListener('menu_updated', renderMenu);
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
  renderMenu();
  renderOrders();
  renderOrderSummary();
  showKitchenNote();
  console.log('Initial render complete');

  // ===== COMMERCIAL POS FEATURES =====

  // Split Bill Modal
  let currentSplitOrder = null;

  window.openSplitBillModal = function(orderId) {
    const order = Orders.get().find(o => o.id === orderId);
    if (!order) return;

    currentSplitOrder = order;
    const modal = document.getElementById('splitBillModal');
    const itemsDiv = document.getElementById('splitBillItems');

    itemsDiv.innerHTML = order.items.map(item => `
      <div style="margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px;">
        <strong>${item.name}</strong> - ${Utils.formatCurrency(item.price)}
        <div>
          <label>Quantity:</label>
          <input type="number" class="split-quantity" data-item-id="${item.id}" value="${item.quantity || 1}" min="0" max="${item.quantity || 1}" style="width:60px;padding:4px;">
        </div>
      </div>
    `).join('');

    modal.style.display = 'flex';
  };

  document.getElementById('cancelSplitBill').addEventListener('click', () => {
    document.getElementById('splitBillModal').style.display = 'none';
    currentSplitOrder = null;
  });

  document.getElementById('splitByQuantity').addEventListener('click', () => {
    if (!currentSplitOrder) return;

    const splits = [];
    const quantityInputs = document.querySelectorAll('.split-quantity');
    const split1 = {};
    const split2 = {};

    quantityInputs.forEach(input => {
      const itemId = parseInt(input.dataset.itemId);
      const qty = parseInt(input.value);
      const item = currentSplitOrder.items.find(i => i.id === itemId);
      const maxQty = item.quantity || 1;

      if (qty > 0 && qty <= maxQty) {
        split1[itemId] = qty;
        split2[itemId] = maxQty - qty;
      }
    });

    splits.push(split1, split2);
    const bills = CommercialPOS.splitByQuantity(currentSplitOrder, splits);

    displaySplitBills(bills);
  });

  document.getElementById('splitEqually').addEventListener('click', () => {
    if (!currentSplitOrder) return;

    const numberOfSplits = prompt('How many splits?', '2');
    if (!numberOfSplits || isNaN(numberOfSplits)) return;

    const bills = CommercialPOS.splitEqually(currentSplitOrder, parseInt(numberOfSplits));
    displaySplitBills(bills);
  });

  function displaySplitBills(bills) {
    const detailsDiv = document.getElementById('splitBillDetails');
    detailsDiv.innerHTML = bills.map(bill => `
      <div style="margin:10px 0;padding:10px;background:#e8f5e9;border-radius:4px;">
        <h4>Bill ${bill.billNumber}</h4>
        <div>Subtotal: ${Utils.formatCurrency(bill.subtotal)}</div>
        <div>VAT: ${Utils.formatCurrency(bill.vat)}</div>
        <div>Service Charge: ${Utils.formatCurrency(bill.serviceCharge)}</div>
        <div><strong>Total: ${Utils.formatCurrency(bill.total)}</strong></div>
        <button onclick="payBill('${bill.id}')" style="margin-top:8px;">Pay Bill</button>
      </div>
    `).join('');
  }

  window.payBill = function(billId) {
    const paymentMethod = prompt('Payment method (cash/card/upi):', 'cash');
    if (!paymentMethod) return;

    SplitBills.markBillPaid(billId, paymentMethod);

    // Check if all bills are paid
    if (currentSplitOrder && SplitBills.checkAllBillsPaid(currentSplitOrder.id)) {
      Orders.updateStatus(currentSplitOrder.id, 'paid');
      UI.alert('All bills paid. Order marked as paid.');
      document.getElementById('splitBillModal').style.display = 'none';
      renderOrders();
    } else {
      UI.alert('Bill paid successfully.');
    }
  };

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
    const occupiedTables = Object.entries(status).filter(([_, s]) => s === 'occupied').map(([t, _]) => parseInt(t));

    sourceSelect.innerHTML = occupiedTables.map(t => `<option value="${t}">Table ${t}</option>`).join('');
    targetSelect.innerHTML = occupiedTables.map(t => `<option value="${t}">Table ${t}</option>`).join('');

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