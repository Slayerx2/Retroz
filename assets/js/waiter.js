// Waiter interface logic - Professional POS Layout

document.addEventListener('DOMContentLoaded', () => {
    const menu = getMenu();
    const orders = getOrders();
    
    // State
    let currentOrderType = 'dinein';
    let selectedTable = null;
    let selectedCategory = 'all';
    let cart = JSON.parse(localStorage.getItem('cafe_cart') || '[]');
    let isSubmitting = false;

    // Constants
    const VAT_RATE = 0.13;
    const SERVICE_CHARGE_RATE = 0.10;
    const TABLE_COUNT = 10;

    // Categories
    const categories = [
        { id: 'all', name: 'All' },
        { id: 'veg', name: 'Veg' },
        { id: 'non-veg', name: 'Non-Veg' },
        { id: 'snacks', name: 'Snacks' },
        { id: 'drinks', name: 'Drinks' },
        { id: 'bakery', name: 'Bakery & Sweets' }
    ];

    // Initialize menu with categories
    function categorizeMenu() {
        const vegItems = [1, 2, 3, 4, 5, 6, 7, 8];
        const nonVegItems = [9, 10, 11, 12, 13, 14, 15, 16];
        const snackItems = [17, 18, 19, 20, 21];
        const drinkItems = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
        const bakeryItems = [32, 33, 34];

        menu.forEach(item => {
            if (vegItems.includes(item.id)) item.category = 'veg';
            else if (nonVegItems.includes(item.id)) item.category = 'non-veg';
            else if (snackItems.includes(item.id)) item.category = 'snacks';
            else if (drinkItems.includes(item.id)) item.category = 'drinks';
            else if (bakeryItems.includes(item.id)) item.category = 'bakery';
            else item.category = 'all';
        });
    }
    categorizeMenu();

    // Table management
    function getTableStatus(tableNum) {
        const orders = getOrders();
        const tableOrders = orders.filter(o => 
            o.table === tableNum && 
            o.status !== 'completed' && 
            o.orderType === 'dinein'
        );
        
        if (tableOrders.length === 0) {
            return { status: 'available', time: null };
        }

        const latestOrder = tableOrders.reduce((latest, order) => {
            return new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest;
        });

        const elapsed = Math.floor((Date.now() - new Date(latestOrder.createdAt)) / 60000); // minutes
        
        let status = 'occupied';
        if (latestOrder.status === 'preparing') status = 'order-sent';
        else if (latestOrder.status === 'ready') status = 'ready';
        else if (latestOrder.billRequested) status = 'bill-requested';

        return { status, time: elapsed };
    }

    function formatElapsedTime(minutes) {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    function renderTables() {
        const tablesGrid = document.getElementById('tablesGrid');
        tablesGrid.innerHTML = '';

        for (let i = 1; i <= TABLE_COUNT; i++) {
            const tableStatus = getTableStatus(i);
            const card = document.createElement('div');
            card.className = `table-card status-${tableStatus.status}`;
            if (selectedTable === i) card.classList.add('selected');
            
            card.innerHTML = `
                <div class="table-number">Table ${i}</div>
                <div class="table-status">${tableStatus.status.replace('-', ' ')}</div>
                ${tableStatus.time ? `<div class="table-time">${formatElapsedTime(tableStatus.time)}</div>` : ''}
            `;

            card.addEventListener('click', () => {
                if (currentOrderType === 'takeaway') {
                    showToast('Please select "Dine In" to choose a table', 'warning');
                    return;
                }
                selectedTable = selectedTable === i ? null : i;
                renderTables();
                updateSelectedTableInfo();
                validateOrder();
            });

            tablesGrid.appendChild(card);
        }
    }

    function updateSelectedTableInfo() {
        const info = document.getElementById('selectedTableInfo');
        if (selectedTable) {
            const tableStatus = getTableStatus(selectedTable);
            info.innerHTML = `<span class="table-label">Table ${selectedTable} (${tableStatus.status.replace('-', ' ')})</span>`;
        } else if (currentOrderType === 'takeaway') {
            info.innerHTML = `<span class="table-label">Take Away Order</span>`;
        } else {
            info.innerHTML = `<span class="table-label">No table selected</span>`;
        }
    }

    // Order type handling
    function setupOrderTypeButtons() {
        const buttons = document.querySelectorAll('.order-type-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentOrderType = btn.dataset.type;
                
                if (currentOrderType === 'takeaway') {
                    selectedTable = null;
                    renderTables();
                }
                
                updateSelectedTableInfo();
                validateOrder();
            });
        });
    }

    // Category tabs
    function renderCategoryTabs() {
        const container = document.getElementById('categoryTabs');
        container.innerHTML = '';

        categories.forEach(cat => {
            const tab = document.createElement('button');
            tab.className = `category-tab ${selectedCategory === cat.id ? 'active' : ''}`;
            tab.textContent = cat.name;
            tab.addEventListener('click', () => {
                selectedCategory = cat.id;
                renderCategoryTabs();
                renderMenuGrid();
            });
            container.appendChild(tab);
        });
    }

    // Menu rendering
    function renderMenuGrid() {
        const grid = document.getElementById('menuGrid');
        const emptyState = document.getElementById('emptySearchState');
        const searchTerm = document.getElementById('menuSearch').value.toLowerCase().trim();

        let filteredMenu = menu;

        // Filter by category
        if (selectedCategory !== 'all') {
            filteredMenu = filteredMenu.filter(item => item.category === selectedCategory);
        }

        // Filter by search
        if (searchTerm) {
            filteredMenu = filteredMenu.filter(item => 
                item.name.toLowerCase().includes(searchTerm)
            );
        }

        grid.innerHTML = '';

        if (filteredMenu.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filteredMenu.forEach(item => {
            const card = document.createElement('div');
            card.className = `menu-card ${!item.available ? 'unavailable' : ''}`;
            
            card.innerHTML = `
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">NPR ${item.price}</div>
                <div class="menu-item-category">${categories.find(c => c.id === item.category)?.name || 'Other'}</div>
                <button class="add-btn" ${!item.available ? 'disabled' : ''}>Add</button>
            `;

            const addBtn = card.querySelector('.add-btn');
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.available) {
                    addToCart(item);
                }
            });

            grid.appendChild(card);
        });
    }

    // Search handling
    document.getElementById('menuSearch').addEventListener('input', () => {
        renderMenuGrid();
    });

    // Cart management
    function addToCart(item) {
        const existingItem = cart.find(c => c.id === item.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                note: ''
            });
        }
        saveCart();
        renderCart();
        validateOrder();
    }

    function updateCartItemQuantity(itemId, delta) {
        const item = cart.find(c => c.id === itemId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(itemId);
            } else {
                saveCart();
                renderCart();
                validateOrder();
            }
        }
    }

    function removeFromCart(itemId) {
        cart = cart.filter(c => c.id !== itemId);
        saveCart();
        renderCart();
        validateOrder();
    }

    function updateCartItemNote(itemId, note) {
        const item = cart.find(c => c.id === itemId);
        if (item) {
            item.note = note;
            saveCart();
        }
    }

    function saveCart() {
        localStorage.setItem('cafe_cart', JSON.stringify(cart));
    }

    function clearCart() {
        cart = [];
        saveCart();
        renderCart();
        validateOrder();
    }

    function renderCart() {
        const container = document.getElementById('orderItems');
        
        if (cart.length === 0) {
            container.innerHTML = '<div class="empty-cart">No items in order</div>';
            updateTotals();
            return;
        }

        container.innerHTML = '';

        cart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'order-item';
            
            div.innerHTML = `
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    ${item.note ? `<div class="order-item-note">${item.note}</div>` : ''}
                </div>
                <div class="order-item-controls">
                    <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                    <span class="order-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                    <span class="order-item-price">NPR ${item.price * item.quantity}</span>
                    <button class="remove-item-btn" data-id="${item.id}">×</button>
                </div>
            `;

            // Event listeners
            div.querySelector('[data-action="decrease"]').addEventListener('click', () => {
                updateCartItemQuantity(item.id, -1);
            });

            div.querySelector('[data-action="increase"]').addEventListener('click', () => {
                updateCartItemQuantity(item.id, 1);
            });

            div.querySelector('.remove-item-btn').addEventListener('click', () => {
                removeFromCart(item.id);
            });

            // Add note input on double-click
            div.addEventListener('dblclick', () => {
                const note = prompt('Add note for this item:', item.note || '');
                if (note !== null) {
                    updateCartItemNote(item.id, note);
                    renderCart();
                }
            });

            container.appendChild(div);
        });

        updateTotals();
    }

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vat = subtotal * VAT_RATE;
        const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const total = subtotal + vat + serviceCharge - discount;

        document.getElementById('subtotal').textContent = `NPR ${subtotal.toFixed(0)}`;
        document.getElementById('vat').textContent = `NPR ${vat.toFixed(0)}`;
        document.getElementById('serviceCharge').textContent = `NPR ${serviceCharge.toFixed(0)}`;
        document.getElementById('total').textContent = `NPR ${Math.max(0, total).toFixed(0)}`;
    }

    document.getElementById('discount').addEventListener('input', updateTotals);

    function validateOrder() {
        const btn = document.getElementById('sendToKitchenBtn');
        const hasItems = cart.length > 0;
        const hasTable = currentOrderType === 'takeaway' || selectedTable !== null;
        
        btn.disabled = !(hasItems && hasTable);
    }

    // Send to kitchen with confirmation
    document.getElementById('sendToKitchenBtn').addEventListener('click', () => {
        if (isSubmitting) return;
        showConfirmationModal();
    });

    function showConfirmationModal() {
        const modal = document.getElementById('confirmModal');
        const content = document.getElementById('confirmModalContent');
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vat = subtotal * VAT_RATE;
        const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const total = subtotal + vat + serviceCharge - discount;
        const orderNote = document.getElementById('orderNote').value;

        content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <strong>Order Type:</strong> ${currentOrderType === 'dinein' ? `Dine In - Table ${selectedTable}` : 'Take Away'}
            </div>
            <div style="margin-bottom: 16px;">
                <strong>Items:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    ${cart.map(item => `
                        <li>${item.name} x${item.quantity} - NPR ${item.price * item.quantity}
                            ${item.note ? `<br><small>Note: ${item.note}</small>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            ${orderNote ? `<div style="margin-bottom: 16px;"><strong>Order Note:</strong> ${orderNote}</div>` : ''}
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee;">
                <div>Subtotal: NPR ${subtotal.toFixed(0)}</div>
                <div>VAT (13%): NPR ${vat.toFixed(0)}</div>
                <div>Service Charge (10%): NPR ${serviceCharge.toFixed(0)}</div>
                ${discount > 0 ? `<div>Discount: -NPR ${discount.toFixed(0)}</div>` : ''}
                <div style="font-weight: bold; font-size: 1.1em; margin-top: 8px;">Total: NPR ${Math.max(0, total).toFixed(0)}</div>
            </div>
        `;

        modal.style.display = 'flex';

        document.getElementById('confirmOrderBtn').onclick = () => {
            submitOrder();
            modal.style.display = 'none';
        };

        document.getElementById('cancelOrderBtn').onclick = () => {
            modal.style.display = 'none';
        };
    }

    function submitOrder() {
        if (isSubmitting) return;
        isSubmitting = true;

        const user = getUser();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vat = subtotal * VAT_RATE;
        const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const total = subtotal + vat + serviceCharge - discount;
        const orderNote = document.getElementById('orderNote').value;

        const order = {
            id: 'o_' + Date.now(),
            table: currentOrderType === 'dinein' ? selectedTable : null,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                note: item.note
            })),
            status: 'sent',
            createdAt: new Date().toISOString(),
            waiter: user.username,
            note: orderNote,
            orderType: currentOrderType,
            subtotal,
            vat,
            serviceCharge,
            discount,
            total
        };

        addOrder(order);

        // Add audit log
        if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
            StorageService.addAuditLog({
                userId: user.username,
                action: 'order_created',
                entityType: 'order',
                entityId: order.id,
                description: `Order created for ${currentOrderType === 'dinein' ? 'Table ' + selectedTable : 'Take Away'}`
            });
        }

        // Clear cart and reset form
        clearCart();
        document.getElementById('orderNote').value = '';
        document.getElementById('discount').value = '0';
        selectedTable = null;
        renderTables();
        updateSelectedTableInfo();
        validateOrder();

        showToast('Order sent to kitchen successfully!', 'success');
        renderActiveOrders();

        isSubmitting = false;
    }

    // Clear order functionality
    function setupClearOrder() {
        // Add clear button to order summary
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn-secondary';
        clearBtn.textContent = 'Clear Order';
        clearBtn.style.marginTop = '10px';
        clearBtn.style.width = '100%';
        
        clearBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                document.getElementById('clearModal').style.display = 'flex';
            }
        });

        document.querySelector('.order-summary').appendChild(clearBtn);

        document.getElementById('confirmClearBtn').onclick = () => {
            clearCart();
            document.getElementById('orderNote').value = '';
            document.getElementById('discount').value = '0';
            selectedTable = null;
            renderTables();
            updateSelectedTableInfo();
            document.getElementById('clearModal').style.display = 'none';
        };

        document.getElementById('cancelClearBtn').onclick = () => {
            document.getElementById('clearModal').style.display = 'none';
        };
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

    // Active orders rendering
    function renderActiveOrders() {
        const user = getUser();
        const ordersList = document.getElementById('ordersList');
        const emptyState = document.getElementById('emptyOrdersState');
        const orders = getOrders().filter(o => o.waiter === user.username && o.status !== 'completed' && o.status !== 'paid');

        if (orders.length === 0) {
            ordersList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        ordersList.innerHTML = '';

        // Sort orders by creation time (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        orders.forEach(order => {
            const card = createOrderCard(order);
            ordersList.appendChild(card);
        });
    }

    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card';

        const createdTime = new Date(order.createdAt);
        const elapsedMinutes = Math.floor((Date.now() - createdTime) / 60000);
        const timeString = elapsedMinutes < 60 ? `${elapsedMinutes}m ago` : `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m ago`;

        const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';
        const itemsSummary = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');

        card.innerHTML = `
            <div class="order-card-header">
                <div class="order-card-number">#${order.id.replace('o_', '')}</div>
                <div class="order-card-time">${timeString}</div>
            </div>
            <div class="order-card-body">
                <div class="order-card-info">
                    <span><strong>${tableInfo}</strong></span>
                    <span><strong>Waiter:</strong> ${order.waiter}</span>
                    <span class="status-badge ${order.status}">${order.status.replace('-', ' ')}</span>
                </div>
                <div class="order-card-items">${itemsSummary}</div>
                ${order.note ? `<div class="order-card-note">Note: ${order.note}</div>` : ''}
            </div>
            <div class="order-card-footer">
                <div class="order-card-total">NPR ${order.total.toFixed(0)}</div>
                <div class="order-card-actions" id="actions-${order.id}"></div>
            </div>
        `;

        // Add appropriate actions based on status
        const actionsContainer = card.querySelector(`#actions-${order.id}`);
        const actions = getOrderActions(order.status);
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.textContent = action.label;
            btn.className = action.className || '';
            btn.addEventListener('click', () => action.handler(order));
            actionsContainer.appendChild(btn);
        });

        return card;
    }

    function getOrderActions(status) {
        const actions = [];

        switch (status) {
            case 'sent':
                actions.push({
                    label: 'Cancel',
                    className: 'btn-danger',
                    handler: (order) => showOrderActionModal('cancel', order)
                });
                break;
            case 'accepted':
                actions.push({
                    label: 'Cancel',
                    className: 'btn-danger',
                    handler: (order) => showOrderActionModal('cancel', order)
                });
                break;
            case 'preparing':
                // No actions while preparing
                break;
            case 'ready':
                actions.push({
                    label: 'Mark Served',
                    className: 'btn-primary',
                    handler: (order) => updateOrderStatus(order.id, 'served')
                });
                break;
            case 'served':
                actions.push({
                    label: 'Request Bill',
                    className: 'btn-primary',
                    handler: (order) => updateOrderStatus(order.id, 'bill-requested')
                });
                break;
            case 'bill-requested':
                actions.push({
                    label: 'Checkout',
                    className: 'btn-primary',
                    handler: (order) => showOrderActionModal('checkout', order)
                });
                break;
            case 'cancelled':
                // No actions for cancelled orders
                break;
            default:
                break;
        }

        // Always add view receipt for completed orders
        if (status === 'paid') {
            actions.push({
                label: 'View Receipt',
                className: '',
                handler: (order) => showReceiptModal(order)
            });
        }

        return actions;
    }

    function showOrderActionModal(action, order) {
        const modal = document.getElementById('orderActionModal');
        const title = document.getElementById('orderActionTitle');
        const content = document.getElementById('orderActionContent');

        let actionTitle = '';
        let actionContent = '';
        let confirmHandler = null;

        switch (action) {
            case 'cancel':
                actionTitle = 'Cancel Order?';
                actionContent = `
                    <p>Are you sure you want to cancel order #${order.id.replace('o_', '')}?</p>
                    <p><strong>Table:</strong> ${order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away'}</p>
                    <p><strong>Total:</strong> NPR ${order.total.toFixed(0)}</p>
                    <p style="color: #f44336;">This action cannot be undone.</p>
                `;
                confirmHandler = () => {
                    updateOrderStatus(order.id, 'cancelled');
                    modal.style.display = 'none';
                };
                break;
            case 'checkout':
                modal.style.display = 'none';
                showCheckoutModal(order);
                return;
            default:
                return;
        }

        title.textContent = actionTitle;
        content.innerHTML = actionContent;
        modal.style.display = 'flex';

        document.getElementById('confirmOrderActionBtn').onclick = confirmHandler;
        document.getElementById('cancelOrderActionBtn').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Checkout Modal
    let currentCheckoutOrder = null;

    function showCheckoutModal(order) {
        currentCheckoutOrder = order;
        const modal = document.getElementById('checkoutModal');
        const content = document.getElementById('checkoutContent');

        const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';

        content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <strong>Order #${order.id.replace('o_', '')}</strong>
            </div>
            <div style="margin-bottom: 8px;"><strong>${tableInfo}</strong></div>
            <div style="margin-bottom: 16px;">
                <strong>Items:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    ${order.items.map(item => `
                        <li>${item.name} x${item.quantity} - NPR ${(item.price * item.quantity).toFixed(0)}</li>
                    `).join('')}
                </ul>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 12px; margin-top: 12px;">
                <div>Subtotal: NPR ${order.subtotal.toFixed(0)}</div>
                <div>VAT (13%): NPR ${order.vat.toFixed(0)}</div>
                <div>Service Charge (10%): NPR ${order.serviceCharge.toFixed(0)}</div>
                ${order.discount > 0 ? `<div>Discount: -NPR ${order.discount.toFixed(0)}</div>` : ''}
                <div style="font-weight: bold; font-size: 1.2em; margin-top: 8px;">Total Due: NPR ${order.total.toFixed(0)}</div>
            </div>
        `;

        // Reset form
        document.getElementById('paymentMethod').value = 'cash';
        document.getElementById('amountReceived').value = '';
        document.getElementById('tipAmount').value = '0';
        document.getElementById('changeDue').textContent = '';
        document.getElementById('cashPaymentGroup').style.display = 'block';

        modal.style.display = 'flex';

        document.getElementById('cancelPaymentBtn').onclick = () => {
            modal.style.display = 'none';
            currentCheckoutOrder = null;
        };

        document.getElementById('confirmPaymentBtn').onclick = () => {
            processPayment();
        };
    }

    // Payment method change handler
    document.getElementById('paymentMethod').addEventListener('change', (e) => {
        const cashGroup = document.getElementById('cashPaymentGroup');
        if (e.target.value === 'cash') {
            cashGroup.style.display = 'block';
        } else {
            cashGroup.style.display = 'none';
        }
    });

    // Amount received change handler
    document.getElementById('amountReceived').addEventListener('input', (e) => {
        if (!currentCheckoutOrder) return;
        
        const amountReceived = parseFloat(e.target.value) || 0;
        const tip = parseFloat(document.getElementById('tipAmount').value) || 0;
        const totalDue = currentCheckoutOrder.total + tip;
        const change = amountReceived - totalDue;

        const changeDueEl = document.getElementById('changeDue');
        if (change >= 0) {
            changeDueEl.textContent = `Change Due: NPR ${change.toFixed(0)}`;
            changeDueEl.classList.remove('negative');
        } else {
            changeDueEl.textContent = `Remaining: NPR ${Math.abs(change).toFixed(0)}`;
            changeDueEl.classList.add('negative');
        }
    });

    // Tip change handler
    document.getElementById('tipAmount').addEventListener('input', () => {
        const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
        const tip = parseFloat(document.getElementById('tipAmount').value) || 0;
        if (currentCheckoutOrder) {
            const totalDue = currentCheckoutOrder.total + tip;
            const change = amountReceived - totalDue;

            const changeDueEl = document.getElementById('changeDue');
            if (change >= 0) {
                changeDueEl.textContent = `Change Due: NPR ${change.toFixed(0)}`;
                changeDueEl.classList.remove('negative');
            } else {
                changeDueEl.textContent = `Remaining: NPR ${Math.abs(change).toFixed(0)}`;
                changeDueEl.classList.add('negative');
            }
        }
    });

    function processPayment() {
        if (!currentCheckoutOrder) return;

        const paymentMethod = document.getElementById('paymentMethod').value;
        const tip = parseFloat(document.getElementById('tipAmount').value) || 0;
        const totalDue = currentCheckoutOrder.total + tip;

        // Validation for cash payment
        if (paymentMethod === 'cash') {
            const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
            if (amountReceived < totalDue) {
                showToast('Amount received is less than total due', 'warning');
                return;
            }
        }

        // Confirm payment
        if (!confirm('Confirm payment processing?')) return;

        // Update order
        const orders = getOrders();
        const orderIndex = orders.findIndex(o => o.id === currentCheckoutOrder.id);
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'paid';
            orders[orderIndex].tip = tip;
            orders[orderIndex].paymentMethod = paymentMethod;
            orders[orderIndex].paidAt = new Date().toISOString();
            
            if (paymentMethod === 'cash') {
                orders[orderIndex].amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
                orders[orderIndex].changeDue = orders[orderIndex].amountReceived - totalDue;
            }

            saveOrders(orders);
        }

        // Add audit log for payment
        if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
            StorageService.addAuditLog({
                userId: user.username,
                action: 'payment_completed',
                entityType: 'order',
                entityId: currentCheckoutOrder.id,
                description: `Payment completed via ${paymentMethod} - NPR ${totalPaid.toFixed(0)}`
            });
        }

        // Close checkout modal
        document.getElementById('checkoutModal').style.display = 'none';

        // Show success modal
        showPaymentSuccessModal(orders[orderIndex], totalDue);

        // Update UI
        renderActiveOrders();
        renderTables();

        currentCheckoutOrder = null;
    }

    function showPaymentSuccessModal(order, totalPaid) {
        const modal = document.getElementById('paymentSuccessModal');
        const content = document.getElementById('paymentSuccessContent');

        const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';

        content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <strong>Order #${order.id.replace('o_', '')}</strong>
            </div>
            <div style="margin-bottom: 8px;"><strong>${tableInfo}</strong></div>
            <div style="margin-bottom: 8px;">Payment Method: ${order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}</div>
            <div style="margin-bottom: 8px;">Total Paid: NPR ${totalPaid.toFixed(0)}</div>
            ${order.paymentMethod === 'cash' ? `
                <div style="margin-bottom: 8px;">Amount Received: NPR ${order.amountReceived.toFixed(0)}</div>
                <div style="margin-bottom: 8px;">Change Due: NPR ${order.changeDue.toFixed(0)}</div>
            ` : ''}
            ${order.tip > 0 ? `<div style="margin-bottom: 8px;">Tip: NPR ${order.tip.toFixed(0)}</div>` : ''}
        `;

        modal.style.display = 'flex';

        document.getElementById('closeSuccessModalBtn').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('printFinalReceiptBtn').onclick = () => {
            printFullReceipt(order, totalPaid);
        };
    }

    function showReceiptModal(order) {
        const modal = document.getElementById('receiptModal');
        const content = document.getElementById('receiptContent');

        const createdTime = new Date(order.createdAt).toLocaleString();
        const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';
        const settings = JSON.parse(localStorage.getItem('cafe_settings') || '{}');
        const cafeName = settings.cafeName || 'CaféPOS';
        const cafeAddress = settings.address || '';
        const cafePhone = settings.phone || '';
        const receiptFooter = settings.receiptFooter || 'Thank you for dining with us!';

        content.innerHTML = `
            <div class="receipt-print-area">
                <h1>${cafeName}</h1>
                ${cafeAddress ? `<p>${cafeAddress}</p>` : ''}
                ${cafePhone ? `<p>${cafePhone}</p>` : ''}
                <hr>
                <p><strong>Receipt #${order.id.replace('o_', '')}</strong></p>
                <p>Order #${order.id.replace('o_', '')}</p>
                <p>${tableInfo}</p>
                <p>Date: ${createdTime}</p>
                <p>Waiter: ${order.waiter}</p>
                <hr>
                ${order.items.map(item => `
                    <div class="receipt-item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>NPR ${(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                `).join('')}
                <hr>
                <div class="receipt-total">
                    <div>Subtotal: NPR ${order.subtotal.toFixed(0)}</div>
                    <div>VAT (13%): NPR ${order.vat.toFixed(0)}</div>
                    <div>Service Charge (10%): NPR ${order.serviceCharge.toFixed(0)}</div>
                    ${order.discount > 0 ? `<div>Discount: -NPR ${order.discount.toFixed(0)}</div>` : ''}
                    <div style="font-size: 1.2em; margin-top: 8px;">Total: NPR ${order.total.toFixed(0)}</div>
                </div>
                ${order.note ? `<p style="margin-top: 10px; font-style: italic;">Note: ${order.note}</p>` : ''}
                <div class="receipt-footer">${receiptFooter}</div>
            </div>
        `;

        modal.style.display = 'flex';

        document.getElementById('closeReceiptBtn').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('printReceiptBtn').onclick = () => {
            printFullReceipt(order, order.total);
        };
    }

    function printFullReceipt(order, totalPaid) {
        const settings = JSON.parse(localStorage.getItem('cafe_settings') || '{}');
        const cafeName = settings.cafeName || 'CaféPOS';
        const cafeAddress = settings.address || '';
        const cafePhone = settings.phone || '';
        const receiptFooter = settings.receiptFooter || 'Thank you for dining with us!';
        const currency = settings.currency || 'NPR';

        const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';
        const createdTime = new Date(order.createdAt).toLocaleString();
        const paidTime = order.paidAt ? new Date(order.paidAt).toLocaleString() : '';

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt #${order.id.replace('o_', '')}</title>
                <style>
                    body {
                        font-family: monospace;
                        font-size: 12px;
                        width: 80mm;
                        margin: 0;
                        padding: 5mm;
                    }
                    h1, h2, h3 {
                        text-align: center;
                        margin: 5px 0;
                    }
                    hr {
                        border: 1px dashed black;
                        margin: 5px 0;
                    }
                    .receipt-item {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                    }
                    .receipt-total {
                        border-top: 1px solid black;
                        margin-top: 5px;
                        padding-top: 5px;
                    }
                    .receipt-footer {
                        text-align: center;
                        margin-top: 10px;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <h1>${cafeName}</h1>
                ${cafeAddress ? `<p>${cafeAddress}</p>` : ''}
                ${cafePhone ? `<p>${cafePhone}</p>` : ''}
                <hr>
                <h3>RECEIPT</h3>
                <p><strong>Receipt #${order.id.replace('o_', '')}</strong></p>
                <p>Order #${order.id.replace('o_', '')}</p>
                <p>${tableInfo}</p>
                <p>Date: ${createdTime}</p>
                ${paidTime ? `<p>Paid: ${paidTime}</p>` : ''}
                <p>Waiter: ${order.waiter}</p>
                <hr>
                ${order.items.map(item => `
                    <div class="receipt-item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>${currency} ${(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                    ${item.note ? `<div style="font-style: italic; font-size: 10px;">Note: ${item.note}</div>` : ''}
                `).join('')}
                <hr>
                <div class="receipt-total">
                    <div>Subtotal: ${currency} ${order.subtotal.toFixed(0)}</div>
                    <div>VAT (13%): ${currency} ${order.vat.toFixed(0)}</div>
                    <div>Service Charge (10%): ${currency} ${order.serviceCharge.toFixed(0)}</div>
                    ${order.discount > 0 ? `<div>Discount: -${currency} ${order.discount.toFixed(0)}</div>` : ''}
                    ${order.tip > 0 ? `<div>Tip: ${currency} ${order.tip.toFixed(0)}</div>` : ''}
                    <div style="font-size: 1.2em; margin-top: 8px;">Total: ${currency} ${totalPaid.toFixed(0)}</div>
                </div>
                ${order.paymentMethod ? `
                    <hr>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}</p>
                    ${order.paymentMethod === 'cash' ? `
                        <p>Amount Received: ${currency} ${order.amountReceived.toFixed(0)}</p>
                        <p>Change Due: ${currency} ${order.changeDue.toFixed(0)}</p>
                    ` : ''}
                ` : ''}
                ${order.note ? `<p style="margin-top: 10px; font-style: italic;">Order Note: ${order.note}</p>` : ''}
                <div class="receipt-footer">${receiptFooter}</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Event listeners for updates
    window.addEventListener('orders_updated', () => {
        renderTables();
        renderActiveOrders();
    });

    window.addEventListener('menu_updated', () => {
        renderMenuGrid();
    });

    // Initialize
    renderTables();
    setupOrderTypeButtons();
    renderCategoryTabs();
    renderMenuGrid();
    renderCart();
    updateSelectedTableInfo();
    validateOrder();
    setupClearOrder();
    renderActiveOrders();
});
