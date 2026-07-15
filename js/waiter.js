// Waiter page logic
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  Auth.requireAuth();

  const menu = Menu.get();
  const selectedItems = [];
  
  // DOM elements
  const orderForm = document.getElementById('orderForm');
  const ordersList = document.getElementById('ordersList');
  const tablesGrid = document.getElementById('tablesGrid');
  const tableNumberInput = document.getElementById('tableNumber');
  const orderTypeInput = document.getElementById('orderType');
  const menuSearch = document.getElementById('menuSearch');

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
      const txt = [item.name, item.tags?.join(' '), item.desc].join(' ').toLowerCase();
      return txt.includes(search);
    });
  }

  // Render favorites bar
  function renderFavoritesBar() {
    const bar = document.getElementById('favoritesBar');
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
    getFilteredMenu().forEach(item => {
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
      div.textContent = `Table ${order.table} | Items: ${order.items.map(i => i.name).join(', ')} | Status: ${order.status}`;
      ordersList.appendChild(div);
    });
  }

  // Kitchen note display
  function showKitchenNote() {
    const note = KitchenNote.get();
    document.getElementById('waiterKitchenNote').textContent = note || 'No note from kitchen.';
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
      status: 'preparing',
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
  document.getElementById('fabNewOrder').onclick = () => {
    orderForm.reset();
    selectedItems.length = 0;
    renderMenu();
    renderOrderSummary();
  };
  
  document.getElementById('fabClear').onclick = () => {
    selectedItems.length = 0;
    renderMenu();
    renderOrderSummary();
  };
  
  document.getElementById('fabHelp').onclick = () => {
    UI.alert('Need help? Call +91 XXXX-XXXXXX or ask your manager.');
  };
  
  document.getElementById('toggleDark').onclick = () => {
    document.body.classList.toggle('dark');
  };
  
  document.getElementById('summaryCheckout').onclick = () => {
    orderForm.requestSubmit();
  };

  // Main render function
  function renderMenu() {
    renderFavoritesBar();
    renderMenuGrid();
  }

  // Event listeners
  window.addEventListener('orders_updated', renderOrders);
  window.addEventListener('menu_updated', renderMenu);
  menuSearch?.addEventListener('input', Utils.debounce(renderMenuGrid, 300));

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', Auth.logout);

  // Initial render
  renderTables();
  renderMenu();
  renderOrders();
  renderOrderSummary();
  showKitchenNote();
});