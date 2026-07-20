// Admin Dashboard Logic - Professional Management System

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentSection = 'overview';
    let selectedOrderForCancel = null;

    // Initialize current date
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });

    function navigateToSection(section) {
        // Update nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');

        // Update page title
        const titles = {
            overview: 'Overview',
            orders: 'Orders',
            menu: 'Menu Management',
            tables: 'Tables',
            staff: 'Staff',
            reports: 'Reports',
            audit: 'Audit Logs',
            settings: 'Settings'
        };
        document.getElementById('pageTitle').textContent = titles[section];

        currentSection = section;

        // Render section content
        switch (section) {
            case 'overview':
                renderOverview();
                break;
            case 'orders':
                renderOrders();
                break;
            case 'menu':
                renderMenu();
                break;
            case 'tables':
                renderTables();
                break;
            case 'staff':
                renderStaff();
                break;
            case 'reports':
                renderReports();
                break;
            case 'audit':
                renderAuditLogs();
                break;
            case 'settings':
                renderSettings();
                break;
        }
    }

    // Overview Dashboard
    function renderOverview() {
        const orders = getOrders();
        const todaysOrders = getTodaysOrders();
        const menu = getMenu();

        // Calculate metrics
        const totalSales = todaysOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = todaysOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const totalTips = todaysOrders.reduce((sum, o) => sum + (o.tip || 0), 0);
        const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'paid' && o.status !== 'cancelled').length;
        const cancelledOrders = todaysOrders.filter(o => o.status === 'cancelled').length;

        // Best-selling item
        const itemCounts = {};
        todaysOrders.forEach(order => {
            order.items.forEach(item => {
                itemCounts[item.id] = (itemCounts[item.id] || 0) + item.quantity;
            });
        });
        let bestSellingItem = null;
        let maxCount = 0;
        for (const [id, count] of Object.entries(itemCounts)) {
            if (count > maxCount) {
                maxCount = count;
                bestSellingItem = menu.find(m => m.id == id);
            }
        }

        // Average preparation time
        const prepTimes = todaysOrders
            .filter(o => o.readyAt && o.createdAt)
            .map(o => {
                const created = new Date(o.createdAt);
                const ready = new Date(o.readyAt);
                return (ready - created) / 60000; // minutes
            });
        const avgPrepTime = prepTimes.length > 0 ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : 0;

        const metricsGrid = document.getElementById('metricsGrid');
        metricsGrid.innerHTML = `
            <div class="metric-card">
                <div class="metric-label">Total Sales</div>
                <div class="metric-value">NPR ${totalSales.toLocaleString()}</div>
                <div class="metric-change">Today</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Orders</div>
                <div class="metric-value">${totalOrders}</div>
                <div class="metric-change">Today</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Order Value</div>
                <div class="metric-value">NPR ${avgOrderValue.toFixed(0)}</div>
                <div class="metric-change">Today</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Tips</div>
                <div class="metric-value">NPR ${totalTips.toLocaleString()}</div>
                <div class="metric-change">Today</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Active Orders</div>
                <div class="metric-value">${activeOrders}</div>
                <div class="metric-change">Current</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Cancelled Orders</div>
                <div class="metric-value">${cancelledOrders}</div>
                <div class="metric-change">Today</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Best-Selling Item</div>
                <div class="metric-value" style="font-size: 1.5em;">${bestSellingItem ? bestSellingItem.name : 'N/A'}</div>
                <div class="metric-change">${maxCount} sold</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Prep Time</div>
                <div class="metric-value">${avgPrepTime.toFixed(1)} min</div>
                <div class="metric-change">Today</div>
            </div>
        `;
    }

    // Orders Section
    function renderOrders() {
        const orders = getOrders();
        const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
        const dateFilter = document.getElementById('orderDateFilter').value;
        const statusFilter = document.getElementById('orderStatusFilter').value;
        const typeFilter = document.getElementById('orderTypeFilter').value;
        const waiterFilter = document.getElementById('orderWaiterFilter').value;

        // Populate waiter filter
        const waiters = [...new Set(orders.map(o => o.waiter))];
        const waiterSelect = document.getElementById('orderWaiterFilter');
        if (waiterSelect.options.length === 1) {
            waiters.forEach(waiter => {
                const option = document.createElement('option');
                option.value = waiter;
                option.textContent = waiter;
                waiterSelect.appendChild(option);
            });
        }

        // Filter orders
        let filteredOrders = orders.filter(order => {
            // Search filter
            if (searchTerm) {
                const searchStr = `${order.id} ${order.waiter} ${order.items.map(i => i.name).join(' ')}`.toLowerCase();
                if (!searchStr.includes(searchTerm)) return false;
            }

            // Date filter
            if (dateFilter !== 'all') {
                const orderDate = new Date(order.createdAt).toDateString();
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                const weekAgo = new Date(Date.now() - 604800000);

                switch (dateFilter) {
                    case 'today':
                        if (orderDate !== today) return false;
                        break;
                    case 'yesterday':
                        if (orderDate !== yesterday) return false;
                        break;
                    case 'week':
                        if (new Date(order.createdAt) < weekAgo) return false;
                        break;
                }
            }

            // Status filter
            if (statusFilter !== 'all' && order.status !== statusFilter) return false;

            // Type filter
            if (typeFilter !== 'all' && order.orderType !== typeFilter) return false;

            // Waiter filter
            if (waiterFilter !== 'all' && order.waiter !== waiterFilter) return false;

            return true;
        });

        // Sort by date (newest first)
        filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';

        if (filteredOrders.length === 0) {
            ordersList.innerHTML = '<div class="empty-state">No orders found</div>';
            return;
        }

        filteredOrders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-item';

            const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';
            const itemsSummary = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');

            div.innerHTML = `
                <div class="order-item-info">
                    <div class="order-item-header">
                        <span>#${order.id.replace('o_', '')}</span>
                        <span>${tableInfo}</span>
                        <span>${new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="order-item-details">
                        <div>Items: ${itemsSummary}</div>
                        <div>Waiter: ${order.waiter} | Total: NPR ${(order.total || 0).toFixed(0)} | Status: ${order.status}</div>
                    </div>
                </div>
                <div class="order-item-actions">
                    <button class="btn-secondary" data-action="view" data-id="${order.id}">View</button>
                    ${order.status !== 'paid' && order.status !== 'cancelled' ? `
                        <button class="btn-danger" data-action="cancel" data-id="${order.id}">Cancel</button>
                    ` : ''}
                </div>
            `;

            div.querySelector('[data-action="view"]').addEventListener('click', () => {
                showOrderDetail(order);
            });

            const cancelBtn = div.querySelector('[data-action="cancel"]');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    showCancelOrderModal(order);
                });
            }

            ordersList.appendChild(div);
        });
    }

    function showOrderDetail(order) {
        const modal = document.getElementById('orderDetailModal');
        const content = document.getElementById('orderDetailContent');

        const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';

        content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <strong>Order #${order.id.replace('o_', '')}</strong>
            </div>
            <div style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
            <div style="margin-bottom: 8px;"><strong>${tableInfo}</strong></div>
            <div style="margin-bottom: 8px;"><strong>Waiter:</strong> ${order.waiter}</div>
            <div style="margin-bottom: 8px;"><strong>Status:</strong> ${order.status}</div>
            <div style="margin-bottom: 16px;"><strong>Total:</strong> NPR ${(order.total || 0).toFixed(0)}</div>
            <div style="margin-bottom: 16px;">
                <strong>Items:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    ${order.items.map(item => `
                        <li>${item.name} x${item.quantity} - NPR ${(item.price * item.quantity).toFixed(0)}
                            ${item.note ? `<br><small>Note: ${item.note}</small>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            ${order.note ? `<div style="margin-bottom: 16px;"><strong>Note:</strong> ${order.note}</div>` : ''}
            ${order.cancelReason ? `<div style="margin-bottom: 16px; color: #f44336;"><strong>Cancel Reason:</strong> ${order.cancelReason}</div>` : ''}
        `;

        modal.style.display = 'flex';

        document.getElementById('closeOrderDetailBtn').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('printOrderBtn').onclick = () => {
            printReceipt(order);
        };

        document.getElementById('cancelOrderBtn').onclick = () => {
            modal.style.display = 'none';
            showCancelOrderModal(order);
        };
    }

    function showCancelOrderModal(order) {
        selectedOrderForCancel = order;
        const modal = document.getElementById('cancelOrderModal');
        modal.style.display = 'flex';

        document.getElementById('confirmCancelBtn').onclick = () => {
            const reason = document.getElementById('cancelReason').value.trim();
            if (!reason) {
                showToast('Please provide a reason for cancellation', 'warning');
                return;
            }

            cancelOrder(order.id, reason);
            modal.style.display = 'none';
            document.getElementById('cancelReason').value = '';
        };

        document.getElementById('closeCancelModalBtn').onclick = () => {
            modal.style.display = 'none';
            document.getElementById('cancelReason').value = '';
        };
    }

    function cancelOrder(orderId, reason) {
        const orders = getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'cancelled';
            order.cancelReason = reason;
            order.cancelledAt = new Date().toISOString();
            saveOrders(orders);
            showToast('Order cancelled successfully', 'success');
            renderOrders();
        }
    }

    function printReceipt(order) {
        // Simple print implementation
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head><title>Receipt #${order.id.replace('o_', '')}</title></head>
            <body>
                <h2>☕ CaféPOS</h2>
                <p>Order #${order.id.replace('o_', '')}</p>
                <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
                <p>${order.orderType === 'dinein' ? 'Table ' + order.table : 'Take Away'}</p>
                <hr>
                ${order.items.map(i => `<p>${i.name} x${i.quantity} - NPR ${(i.price * i.quantity).toFixed(0)}</p>`).join('')}
                <hr>
                <p><strong>Total: NPR ${(order.total || 0).toFixed(0)}</strong></p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Menu Section
    function renderMenu() {
        const menu = getMenu();
        const searchTerm = document.getElementById('menuSearch').value.toLowerCase();
        const categoryFilter = document.getElementById('menuCategoryFilter').value;

        let filteredMenu = menu.filter(item => {
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm)) return false;
            if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
            return true;
        });

        const menuList = document.getElementById('menuList');
        menuList.innerHTML = '';

        filteredMenu.forEach(item => {
            const card = document.createElement('div');
            card.className = `menu-item-card ${!item.available ? 'archived' : ''}`;

            card.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                    <div>Category: ${item.category || 'Other'}</div>
                    <div>${item.vegetarian ? '🌱 Vegetarian' : 'Non-Vegetarian'}</div>
                    ${item.prepTime ? `<div>Prep: ${item.prepTime} min</div>` : ''}
                </div>
                <div class="item-price">NPR ${item.price.toFixed(0)}</div>
                <div class="item-actions">
                    <button class="btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                    <button class="btn-secondary" data-action="toggle" data-id="${item.id}">
                        ${item.available ? 'Disable' : 'Enable'}
                    </button>
                    <button class="btn-danger" data-action="archive" data-id="${item.id}">
                        ${item.archived ? 'Unarchive' : 'Archive'}
                    </button>
                </div>
            `;

            card.querySelector('[data-action="edit"]').addEventListener('click', () => {
                showMenuItemModal(item);
            });

            card.querySelector('[data-action="toggle"]').addEventListener('click', () => {
                toggleMenuItemAvailability(item.id);
            });

            card.querySelector('[data-action="archive"]').addEventListener('click', () => {
                archiveMenuItem(item.id);
            });

            menuList.appendChild(card);
        });
    }

    function showMenuItemModal(item = null) {
        const modal = document.getElementById('menuItemModal');
        const title = document.getElementById('menuItemModalTitle');
        const form = document.getElementById('menuItemForm');

        if (item) {
            title.textContent = 'Edit Menu Item';
            document.getElementById('editItemId').value = item.id;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemCategory').value = item.category || 'veg';
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemDescription').value = item.desc || '';
            document.getElementById('itemImage').value = item.img || '';
            document.getElementById('itemVegetarian').checked = item.vegetarian || false;
            document.getElementById('itemPrepTime').value = item.prepTime || '';
            document.getElementById('itemAvailable').checked = item.available !== false;
        } else {
            title.textContent = 'Add Menu Item';
            form.reset();
            document.getElementById('editItemId').value = '';
        }

        modal.style.display = 'flex';

        document.getElementById('closeMenuItemModalBtn').onclick = () => {
            modal.style.display = 'none';
        };
    }

    function saveMenuItem(e) {
        e.preventDefault();
        const id = document.getElementById('editItemId').value;
        const menu = getMenu();

        const itemData = {
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            price: parseFloat(document.getElementById('itemPrice').value),
            desc: document.getElementById('itemDescription').value,
            img: document.getElementById('itemImage').value,
            vegetarian: document.getElementById('itemVegetarian').checked,
            prepTime: parseInt(document.getElementById('itemPrepTime').value) || null,
            available: document.getElementById('itemAvailable').checked
        };

        if (id) {
            // Edit existing
            const index = menu.findIndex(m => m.id == id);
            if (index !== -1) {
                menu[index] = { ...menu[index], ...itemData };
                
                // Add audit log
                if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                    const user = getUser();
                    StorageService.addAuditLog({
                        userId: user.username || 'admin',
                        action: 'menu_item_edited',
                        entityType: 'product',
                        entityId: id,
                        description: `Menu item "${itemData.name}" edited`
                    });
                }
            }
        } else {
            // Add new
            const newId = Math.max(...menu.map(m => m.id), 0) + 1;
            menu.push({ id: newId, ...itemData });
            
            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                const user = getUser();
                StorageService.addAuditLog({
                    userId: user.username || 'admin',
                    action: 'menu_item_created',
                    entityType: 'product',
                    entityId: newId.toString(),
                    description: `Menu item "${itemData.name}" created`
                });
            }
        }

        setMenu(menu);
        document.getElementById('menuItemModal').style.display = 'none';
        showToast('Menu item saved successfully', 'success');
        renderMenu();
    }

    function toggleMenuItemAvailability(id) {
        const menu = getMenu();
        const item = menu.find(m => m.id == id);
        if (item) {
            item.available = !item.available;
            setMenu(menu);
            
            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                const user = getUser();
                StorageService.addAuditLog({
                    userId: user.username || 'admin',
                    action: 'availability_changed',
                    entityType: 'product',
                    entityId: id,
                    description: `Menu item "${item.name}" ${item.available ? 'enabled' : 'disabled'}`
                });
            }
            
            showToast(`Item ${item.available ? 'enabled' : 'disabled'}`, 'success');
            renderMenu();
        }
    }

    function archiveMenuItem(id) {
        const menu = getMenu();
        const item = menu.find(m => m.id == id);
        if (item) {
            item.archived = !item.archived;
            item.available = !item.archived; // Archive also disables
            setMenu(menu);
            showToast(`Item ${item.archived ? 'archived' : 'unarchived'}`, 'success');
            renderMenu();
        }
    }

    // Tables Section
    function renderTables() {
        const tables = getTables() || [];
        const tablesList = document.getElementById('tablesList');
        tablesList.innerHTML = '';

        tables.forEach(table => {
            const card = document.createElement('div');
            card.className = `table-item-card ${!table.enabled ? 'disabled' : ''}`;

            const orders = getOrders();
            const activeOrders = orders.filter(o => 
                o.table === table.id && 
                o.status !== 'completed' && 
                o.status !== 'paid' && 
                o.status !== 'cancelled'
            );

            card.innerHTML = `
                <div class="table-name">${table.name}</div>
                <div class="table-status">${table.enabled ? 'Enabled' : 'Disabled'} | ${activeOrders.length} active orders</div>
                <div class="table-actions">
                    <button class="btn-secondary" data-action="edit" data-id="${table.id}">Edit</button>
                    <button class="btn-secondary" data-action="toggle" data-id="${table.id}">
                        ${table.enabled ? 'Disable' : 'Enable'}
                    </button>
                    ${activeOrders.length === 0 ? `
                        <button class="btn-danger" data-action="delete" data-id="${table.id}">Delete</button>
                    ` : ''}
                </div>
            `;

            card.querySelector('[data-action="edit"]').addEventListener('click', () => {
                showTableModal(table);
            });

            card.querySelector('[data-action="toggle"]').addEventListener('click', () => {
                toggleTable(table.id);
            });

            const deleteBtn = card.querySelector('[data-action="delete"]');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    deleteTable(table.id);
                });
            }

            tablesList.appendChild(card);
        });
    }

    function getTables() {
        return JSON.parse(localStorage.getItem('cafe_tables') || '[]');
    }

    function saveTables(tables) {
        localStorage.setItem('cafe_tables', JSON.stringify(tables));
    }

    function showTableModal(table = null) {
        const modal = document.getElementById('tableModal');
        const title = document.getElementById('tableModalTitle');

        if (table) {
            title.textContent = 'Edit Table';
            document.getElementById('editTableId').value = table.id;
            document.getElementById('tableName').value = table.name;
            document.getElementById('tableEnabled').checked = table.enabled !== false;
        } else {
            title.textContent = 'Add Table';
            document.getElementById('tableForm').reset();
            document.getElementById('editTableId').value = '';
        }

        modal.style.display = 'flex';

        document.getElementById('closeTableModalBtn').onclick = () => {
            modal.style.display = 'none';
        };
    }

    function saveTable(e) {
        e.preventDefault();
        const id = document.getElementById('editTableId').value;
        const tables = getTables();

        const tableData = {
            name: document.getElementById('tableName').value,
            enabled: document.getElementById('tableEnabled').checked
        };

        if (id) {
            const index = tables.findIndex(t => t.id == id);
            if (index !== -1) {
                tables[index] = { ...tables[index], ...tableData };
            }
        } else {
            const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
            tables.push({ id: newId, ...tableData });
        }

        saveTables(tables);
        document.getElementById('tableModal').style.display = 'none';
        showToast('Table saved successfully', 'success');
        renderTables();
    }

    function toggleTable(id) {
        const tables = getTables();
        const table = tables.find(t => t.id == id);
        if (table) {
            table.enabled = !table.enabled;
            saveTables(tables);
            showToast(`Table ${table.enabled ? 'enabled' : 'disabled'}`, 'success');
            renderTables();
        }
    }

    function deleteTable(id) {
        if (!confirm('Are you sure you want to delete this table?')) return;

        const tables = getTables();
        const filtered = tables.filter(t => t.id != id);
        saveTables(filtered);
        showToast('Table deleted successfully', 'success');
        renderTables();
    }

    // Staff Section
    function renderStaff() {
        const staffList = document.getElementById('staffList');
        const predefinedUsers = [
            { username: 'admin', role: 'admin', active: true },
            { username: 'waiter1', role: 'waiter', active: true },
            { username: 'waiter2', role: 'waiter', active: true },
            { username: 'cook1', role: 'cook', active: true },
            { username: 'cook2', role: 'cook', active: true }
        ];

        staffList.innerHTML = '';

        predefinedUsers.forEach(user => {
            const card = document.createElement('div');
            card.className = 'staff-card';

            card.innerHTML = `
                <div class="staff-name">${user.username}</div>
                <div class="staff-role ${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                <div class="staff-details">
                    <div>Status: ${user.active ? 'Active' : 'Inactive'}</div>
                    <div>Last Login: Not available (frontend-only)</div>
                </div>
            `;

            staffList.appendChild(card);
        });
    }

    // Reports Section
    function renderReports() {
        const dateRange = document.getElementById('reportDateRange').value;
        const orders = getOrders();
        const menu = getMenu();

        // Filter orders by date range
        let filteredOrders = orders;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 86400000);
        const weekAgo = new Date(today.getTime() - 604800000);

        switch (dateRange) {
            case 'today':
                filteredOrders = orders.filter(o => new Date(o.createdAt) >= today);
                break;
            case 'yesterday':
                filteredOrders = orders.filter(o => {
                    const date = new Date(o.createdAt);
                    return date >= yesterday && date < today;
                });
                break;
            case 'week':
                filteredOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo);
                break;
        }

        // Calculate metrics
        const sales = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const vat = filteredOrders.reduce((sum, o) => sum + (o.vat || 0), 0);
        const serviceCharges = filteredOrders.reduce((sum, o) => sum + (o.serviceCharge || 0), 0);
        const tips = filteredOrders.reduce((sum, o) => sum + (o.tip || 0), 0);
        const discounts = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
        const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;

        // Product sales
        const productSales = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
            });
        });

        // Waiter performance
        const waiterPerformance = {};
        filteredOrders.forEach(order => {
            if (!waiterPerformance[order.waiter]) {
                waiterPerformance[order.waiter] = { orders: 0, sales: 0 };
            }
            waiterPerformance[order.waiter].orders++;
            waiterPerformance[order.waiter].sales += order.total || 0;
        });

        const reportsContent = document.getElementById('reportsContent');
        reportsContent.innerHTML = `
            <div class="report-section">
                <h3>Financial Summary</h3>
                <table class="report-table">
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td>Total Sales</td><td>NPR ${sales.toLocaleString()}</td></tr>
                    <tr><td>VAT</td><td>NPR ${vat.toLocaleString()}</td></tr>
                    <tr><td>Service Charges</td><td>NPR ${serviceCharges.toLocaleString()}</td></tr>
                    <tr><td>Tips</td><td>NPR ${tips.toLocaleString()}</td></tr>
                    <tr><td>Discounts</td><td>NPR ${discounts.toLocaleString()}</td></tr>
                    <tr><td>Cancelled Orders</td><td>${cancelledCount}</td></tr>
                </table>
            </div>

            <div class="report-section">
                <h3>Product Sales</h3>
                <table class="report-table">
                    <tr><th>Item</th><th>Quantity Sold</th></tr>
                    ${Object.entries(productSales).map(([name, qty]) => `
                        <tr><td>${name}</td><td>${qty}</td></tr>
                    `).join('')}
                </table>
            </div>

            <div class="report-section">
                <h3>Waiter Performance</h3>
                <table class="report-table">
                    <tr><th>Waiter</th><th>Orders</th><th>Sales</th></tr>
                    ${Object.entries(waiterPerformance).map(([waiter, data]) => `
                        <tr><td>${waiter}</td><td>${data.orders}</td><td>NPR ${data.sales.toLocaleString()}</td></tr>
                    `).join('')}
                </table>
            </div>
        `;
    }

    function exportToCSV() {
        const orders = getOrders();
        const csvContent = [
            ['Order ID', 'Date', 'Table', 'Waiter', 'Status', 'Total', 'Items'].join(','),
            ...orders.map(order => [
                order.id,
                new Date(order.createdAt).toLocaleString(),
                order.orderType === 'dinein' ? order.table : 'Take Away',
                order.waiter,
                order.status,
                order.total || 0,
                order.items.map(i => `${i.name} x${i.quantity}`).join('; ')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cafe_orders_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported successfully', 'success');
    }

    // Audit Logs Section
    function renderAuditLogs() {
        const actionFilter = document.getElementById('auditActionFilter').value;
        const entityFilter = document.getElementById('auditEntityTypeFilter').value;
        
        let logs = [];
        if (typeof StorageService !== 'undefined' && StorageService.getAuditLogs) {
            logs = StorageService.getAuditLogs();
        }
        
        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Filter logs
        if (actionFilter !== 'all') {
            logs = logs.filter(log => log.action === actionFilter);
        }
        if (entityFilter !== 'all') {
            logs = logs.filter(log => log.entityType === entityFilter);
        }
        
        const auditContent = document.getElementById('auditLogsContent');
        auditContent.innerHTML = '';
        
        if (logs.length === 0) {
            auditContent.innerHTML = '<div class="empty-state">No audit logs found</div>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'audit-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${logs.map(log => `
                    <tr>
                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                        <td>${log.userId}</td>
                        <td><span class="action-badge ${log.action}">${formatAction(log.action)}</span></td>
                        <td>${log.entityType} #${log.entityId}</td>
                        <td>${log.description}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        auditContent.appendChild(table);
    }
    
    function formatAction(action) {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Settings Section
    function renderSettings() {
        const settings = getSettings();

        document.getElementById('cafeName').value = settings.cafeName || 'CaféPOS';
        document.getElementById('cafeAddress').value = settings.address || '';
        document.getElementById('cafePhone').value = settings.phone || '';
        document.getElementById('currency').value = settings.currency || 'NPR';
        document.getElementById('vatRate').value = settings.vatRate || 13;
        document.getElementById('serviceChargeRate').value = settings.serviceChargeRate || 10;
        document.getElementById('receiptFooter').value = settings.receiptFooter || 'Thank you for dining with us!';
        document.getElementById('kitchenWarningTime').value = settings.kitchenWarningTime || 10;
        document.getElementById('kitchenDelayTime').value = settings.kitchenDelayTime || 20;
        document.getElementById('themePreference').value = settings.theme || 'light';
    }

    function getSettings() {
        return JSON.parse(localStorage.getItem('cafe_settings') || '{}');
    }

    function saveSettingsData(settings) {
        localStorage.setItem('cafe_settings', JSON.stringify(settings));
    }

    function saveSettings() {
        const settings = {
            cafeName: document.getElementById('cafeName').value,
            address: document.getElementById('cafeAddress').value,
            phone: document.getElementById('cafePhone').value,
            currency: document.getElementById('currency').value,
            vatRate: parseFloat(document.getElementById('vatRate').value),
            serviceChargeRate: parseFloat(document.getElementById('serviceChargeRate').value),
            receiptFooter: document.getElementById('receiptFooter').value,
            kitchenWarningTime: parseInt(document.getElementById('kitchenWarningTime').value),
            kitchenDelayTime: parseInt(document.getElementById('kitchenDelayTime').value),
            theme: document.getElementById('themePreference').value
        };

        saveSettingsData(settings);
        
        // Add audit log
        if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
            const user = getUser();
            StorageService.addAuditLog({
                userId: user.username || 'admin',
                action: 'settings_changed',
                entityType: 'settings',
                entityId: 'global',
                description: 'System settings updated'
            });
        }
        
        showToast('Settings saved successfully', 'success');
    }

    // Toast notifications
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.background = type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#f44336';
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Event listeners
    document.getElementById('orderSearch').addEventListener('input', renderOrders);
    document.getElementById('orderDateFilter').addEventListener('change', renderOrders);
    document.getElementById('orderStatusFilter').addEventListener('change', renderOrders);
    document.getElementById('orderTypeFilter').addEventListener('change', renderOrders);
    document.getElementById('orderWaiterFilter').addEventListener('change', renderOrders);

    document.getElementById('menuSearch').addEventListener('input', renderMenu);
    document.getElementById('menuCategoryFilter').addEventListener('change', renderMenu);
    document.getElementById('addMenuItemBtn').addEventListener('click', () => showMenuItemModal());
    document.getElementById('menuItemForm').addEventListener('submit', saveMenuItem);

    document.getElementById('addTableBtn').addEventListener('click', () => showTableModal());
    document.getElementById('tableForm').addEventListener('submit', saveTable);

    document.getElementById('reportDateRange').addEventListener('change', renderReports);
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);

    document.getElementById('auditActionFilter').addEventListener('change', renderAuditLogs);
    document.getElementById('auditEntityTypeFilter').addEventListener('change', renderAuditLogs);

    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

    // Modal accessibility - close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal[style*="flex"]');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });

    window.addEventListener('orders_updated', () => {
        if (currentSection === 'overview') renderOverview();
        if (currentSection === 'orders') renderOrders();
        if (currentSection === 'reports') renderReports();
    });

    window.addEventListener('menu_updated', () => {
        if (currentSection === 'menu') renderMenu();
    });

    // Initialize tables if not exists
    if (!getTables().length) {
        const defaultTables = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Table ${i + 1}`,
            enabled: true
        }));
        saveTables(defaultTables);
    }

    // Initial render
    renderOverview();
});
