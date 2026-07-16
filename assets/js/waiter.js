// Waiter interface logic

document.addEventListener('DOMContentLoaded', () => {
    const menuItemsDiv = document.getElementById('menuItems');
    const orderForm = document.getElementById('orderForm');
    const ordersList = document.getElementById('ordersList');
    const menu = getMenu();
    const tablesGrid = document.getElementById('tablesGrid');
    const tableNumberInput = document.getElementById('tableNumber');
    const orderTypeInput = document.getElementById('orderType');

    // Table management
    function getTableStatus() {
        const orders = getOrders();
        const status = {};
        for (let i = 1; i <= 10; i++) status[i] = 'free';
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
        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.textContent = `Table ${i}`;
            if (status[i] === 'free') {
                btn.style.background = '#eee'; // gray
            } else {
                // Find latest order for table
                const orders = getOrders().filter(o => o.table == i && o.status !== 'completed');
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
            // Add clear table button if table is occupied
            if (status[i] === 'occupied') {
                const clearBtn = document.createElement('button');
                clearBtn.textContent = 'Clear Table';
                clearBtn.className = 'clear-table-btn';
                clearBtn.style.marginLeft = '8px';
                clearBtn.onclick = () => {
                    // Mark all non-completed orders for this table as completed
                    const orders = getOrders();
                    let changed = false;
                    orders.forEach(o => {
                        if (o.table == i && o.status !== 'completed') {
                            o.status = 'completed';
                            o.completedAt = new Date().toISOString();
                            changed = true;
                        }
                    });
                    if (changed) saveOrders(orders);
                    renderTables();
                    renderOrders();
                };
                tablesGrid.appendChild(clearBtn);
            }
        }
    }
    orderTypeInput.addEventListener('change', () => {
        if (orderTypeInput.value === 'takeaway') {
            tableNumberInput.value = '';
            tableNumberInput.disabled = true;
        } else {
            tableNumberInput.disabled = false;
        }
    });
    renderTables();
    window.addEventListener('orders_updated', renderTables);

    // MVP+: Favorites, search, grid, color tags, dark mode
    let selectedItems = [];
    // --- FAVORITE SECTIONS ---
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
        ],
        collapsed: false
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
        ],
        collapsed: false
      },
      {
        name: "Snacks",
        items: [
          { key: "french fries", label: "French Fries" },
          { key: "samosa", label: "Samosa" },
          { key: "pakoda", label: "Pakoda" },
          { key: "spring roll", label: "Spring Roll" },
          { key: "wai wai sadeko", label: "Wai Wai Sadeko" }
        ],
        collapsed: false
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
        ],
        collapsed: false
      },
      {
        name: "Bakery & Sweets",
        items: [
          { key: "chocolate cake", label: "Chocolate Cake" },
          { key: "sel roti", label: "Sel Roti" },
          { key: "kheer", label: "Kheer" }
        ],
        collapsed: false
      }
    ];
    const colorTagMap = {
        spicy: 'tag-red',
        veg: 'tag-green',
        bestseller: 'tag-blue'
    };

    // Helper: Get best-selling menu item for today
    function getBestSellingToday() {
        const todaysOrders = typeof getTodaysOrders === 'function' ? getTodaysOrders() : [];
        const itemCounts = {};
        todaysOrders.forEach(order => {
            (order.items || []).forEach(i => {
                // Support both {id, name, price} and string name
                const key = i.id || (menu.find(m => m.name === i) || {}).id;
                if (!key) return;
                itemCounts[key] = (itemCounts[key] || 0) + 1;
            });
        });
        let bestId = null, bestCount = 0;
        for (const id in itemCounts) {
            if (itemCounts[id] > bestCount) {
                bestId = id;
                bestCount = itemCounts[id];
            }
        }
        if (!bestId) return null;
        return menu.find(m => m.id == bestId) || null;
    }

    // Helper: Get best-selling menu item for a given section
    function getBestSellingForSection(section) {
        const todaysOrders = typeof getTodaysOrders === 'function' ? getTodaysOrders() : [];
        const sectionKeys = section.items.map(i => i.key).filter(Boolean);
        const itemCounts = {};
        todaysOrders.forEach(order => {
            (order.items || []).forEach(i => {
                // Support both {id, name, price} and string name
                const menuItem = typeof i === 'object' ? menu.find(m => m.id === i.id) : menu.find(m => m.name === i);
                if (!menuItem) return;
                // Match if menuItem matches any key in this section
                if (sectionKeys.some(key => menuItem.name.toLowerCase().includes(key))) {
                    itemCounts[menuItem.id] = (itemCounts[menuItem.id] || 0) + 1;
                }
            });
        });
        let bestId = null, bestCount = 0;
        for (const id in itemCounts) {
            if (itemCounts[id] > bestCount) {
                bestId = id;
                bestCount = itemCounts[id];
            }
        }
        if (!bestId) return null;
        return menu.find(m => m.id == bestId) || null;
    }

    // Filter menu based on search or favorites
    function getFilteredMenu() {
        const search = (document.getElementById('menuSearch')?.value || '').trim().toLowerCase();
        let filtered = menu;
        if (window.__showBestSelling) {
            filtered = menu.filter(item => item.name.toLowerCase() === window.__showBestSelling);
        } else if (search) {
            filtered = menu.filter(item => {
                const txt = [item.name, item.tags?.join(' '), item.desc].join(' ').toLowerCase();
                return txt.includes(search);
            });
        } else {
            // Hide all items that are in Veg/Non-Veg sections unless their section is expanded
            let hideKeys = [];
            favoriteSections.forEach((section, sIdx) => {
                if ((sIdx === 0 || sIdx === 1) && section.collapsed) {
                    hideKeys = hideKeys.concat(section.items.map(i => i.key));
                }
            });
            filtered = menu.filter(item => !hideKeys.some(key => key && item.name.toLowerCase().includes(key)));
        }
        return filtered;
    }

    // Render favorites bar
    function renderFavoritesBar() {
        const bar = document.getElementById('favoritesBar');
        bar.innerHTML = '';
        favoriteSections.forEach(section => {
            section.collapsed = false; // Always expanded
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'favorites-section';
            const title = document.createElement('div');
            title.className = 'favorites-title';
            title.textContent = section.name;
            sectionDiv.appendChild(title);
            const btnRow = document.createElement('div');
            btnRow.className = 'favorites-row';
            section.items.forEach((fav, idx) => {
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
        if (!grid) return; // Prevent null errors if element missing
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
            let tags = '';
            if (item.tags) {
                tags = '<div class="tags">' + item.tags.map(t => `<span class='tag ${colorTagMap[t]||''}' title='${t}'></span>`).join('') + '</div>';
            }
            card.innerHTML = `${img}<div>${item.name}</div><div style='font-size:0.85em;color:#aaa;'>NPR ${item.price}</div>${tags}`;
            grid.appendChild(card);
        });
    }

    // Render order summary
    function renderOrderSummary() {
        const pane = document.getElementById('orderSummaryPane');
        const itemsDiv = document.getElementById('summaryItems');
        if (!selectedItems.length) {
            itemsDiv.textContent = 'No items yet.';
            return;
        }
        let total = selectedItems.reduce((s,i)=>s+i.price,0);
        itemsDiv.innerHTML = selectedItems.map(i => `<span style='margin-right:12px;'>${i.name}</span>`).join('') + `<b style='margin-left:18px;color:#004E89;'>NPR ${total}</b>`;
    }

    // FAB cluster and dark mode
    document.getElementById('fabNewOrder').onclick = () => {
        document.getElementById('orderForm').reset();
        selectedItems = [];
        renderMenu();
        renderOrderSummary();
    };
    document.getElementById('fabClear').onclick = () => {
        selectedItems = [];
        renderMenu();
        renderOrderSummary();
    };
    document.getElementById('fabHelp').onclick = () => {
        alert('Need help? Call +91 XXXX-XXXXXX or ask your manager.');
    };
    document.getElementById('toggleDark').onclick = () => {
        document.body.classList.toggle('dark');
    };
    document.getElementById('summaryCheckout').onclick = () => {
        document.getElementById('orderForm').requestSubmit();
    };

    // Main render
    function renderMenu() {
        renderFavoritesBar();
        renderMenuGrid();
    }

    // Orders rendering
    function renderOrders() {
        const user = getUser();
        const orders = getOrders().filter(o => o.waiter === user.username && o.status !== 'completed');
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

    // Order form submit
    orderForm.onsubmit = function(e) {
        e.preventDefault();
        const table = document.getElementById('tableNumber').value;
        const tip = parseFloat(document.getElementById('tip').value) || 0;
        const orderType = document.getElementById('orderType').value;
        if (orderType === 'dinein') {
            const status = getTableStatus();
            if (!table || status[table] === 'occupied') {
                alert('Selected table is already occupied or invalid.');
                return;
            }
        }
        if (selectedItems.length === 0) {
            alert('Select at least one item.');
            return;
        }
        const items = selectedItems.map(item => ({ id: item.id, name: item.name, price: item.price }));
        const user = getUser();
        const note = document.getElementById('orderNote').value;
        const order = {
            id: 'o_' + Date.now(),
            table,
            items,
            status: 'preparing',
            createdAt: new Date().toISOString(),
            waiter: user.username,
            tip,
            note,
            orderType
        };
        addOrder(order);
        showPrintModals(order);
        orderForm.reset();
        selectedItems = [];
        renderMenu();
    };

    // Print modals for kitchen and bill
    function showPrintModals(order) {
        document.querySelectorAll('.print-modal').forEach(e => e.remove());
        const kitchen = document.createElement('div');
        kitchen.className = 'print-modal';
        kitchen.style = 'position:fixed;top:10%;left:50%;transform:translateX(-50%);background:#fff;padding:2em;z-index:1000;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.18);min-width:320px;';
        kitchen.innerHTML = `<h2>Kitchen Slip</h2>
            <div><b>Table:</b> ${order.table}</div>
            <div><b>Waiter:</b> ${order.waiter}</div>
            <div><b>Type:</b> ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
            <div><b>Items:</b><ul style='margin:0 0 0 1em;padding:0;'>${order.items.map(i => `<li>${i.name} - NPR ${i.price}</li>`).join('')}</ul></div>
            <div><b>Tip:</b> NPR ${order.tip || 0}</div>
            <div><b>Total:</b> NPR ${order.items.reduce((s,i)=>s+i.price,0) + (order.tip||0)} <span style='font-size:0.9em;color:#888;'>(VAT included)</span></div>
            <button onclick="window.print()">Print</button>
            <button onclick="this.parentElement.remove()">Close</button>`;
        document.body.appendChild(kitchen);
        const bill = document.createElement('div');
        bill.className = 'print-modal';
        bill.style = 'position:fixed;top:10%;left:60%;transform:translateX(-50%);background:#fff;padding:2em;z-index:1000;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.18);min-width:320px;';
        bill.innerHTML = `<h2>Customer Bill</h2>
            <div><b>Table:</b> ${order.table}</div>
            <div><b>Waiter:</b> ${order.waiter}</div>
            <div><b>Type:</b> ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
            <div><b>Items:</b><ul style='margin:0 0 0 1em;padding:0;'>${order.items.map(i => `<li>${i.name} - NPR ${i.price}</li>`).join('')}</ul></div>
            <div><b>Tip:</b> NPR ${order.tip || 0}</div>
            <div><b>Total:</b> NPR ${order.items.reduce((s,i)=>s+i.price,0) + (order.tip||0)} <span style='font-size:0.9em;color:#888;'>(VAT included)</span></div>
            <button onclick="window.print()">Print</button>
            <button onclick="this.parentElement.remove()">Close</button>`;
        document.body.appendChild(bill);
    }

    // Orders/event listeners
    window.addEventListener('orders_updated', renderOrders);
    window.addEventListener('menu_updated', renderMenu);

    // Initial render
    renderMenu();
    renderOrders();
    renderOrderSummary();
});
