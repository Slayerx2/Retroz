// Admin dashboard logic

document.addEventListener('DOMContentLoaded', () => {
    const allOrdersList = document.getElementById('allOrdersList');
    const menuManagement = document.getElementById('menuManagement');
    const tipsTracking = document.getElementById('tipsTracking');

    // Analytics
    let analyticsPanel = document.getElementById('analyticsPanel');
    if (!analyticsPanel) {
        analyticsPanel = document.createElement('section');
        analyticsPanel.id = 'analyticsPanel';
        document.querySelector('main').insertBefore(analyticsPanel, allOrdersList.parentElement);
    }
    function renderAnalytics() {
        const todaysOrders = getTodaysOrders();
        const totalSales = todaysOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price, 0), 0);
        const totalTips = todaysOrders.reduce((sum, o) => sum + (o.tip || 0), 0);
        analyticsPanel.innerHTML = `<h3>Today\'s Analytics</h3>
            <div><strong>Total Sales:</strong> NPR ${totalSales.toLocaleString()} <span style='font-size:0.9em;'>(VAT included)</span></div>
            <div><strong>Orders:</strong> ${todaysOrders.length}</div>
            <div><strong>Total Tips:</strong> NPR ${totalTips.toLocaleString()}</div>`;
    }

    function renderAllOrders() {
        const orders = getOrders();
        allOrdersList.innerHTML = '';
        if (orders.length === 0) {
            allOrdersList.innerHTML = '<em>No orders yet.</em>';
            return;
        }
        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-status status-' + order.status;
            div.innerHTML = `Table ${order.table} | ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'} | Items: ${order.items.map(i => {
                const menu = getMenu();
                const menuItem = menu.find(m => m.id === i.id);
                let imgHtml = '';
                if (menuItem && menuItem.img) {
                    if (menuItem.img.endsWith('.png') || menuItem.img.endsWith('.jpg')) {
                        imgHtml = `<img src='${menuItem.img}' alt='' style='width:20px;height:20px;vertical-align:middle;margin-right:4px;'>`;
                    } else {
                        imgHtml = `<span style='font-size:1.1em;margin-right:4px;'>${menuItem.img}</span>`;
                    }
                }
                return imgHtml + i.name;
            }).join(', ')} | Status: ${order.status}<br>Waiter: ${order.waiter} | Tip: NPR ${order.tip || 0}<br>Created: ${new Date(order.createdAt).toLocaleString()}${order.readyAt ? '<br>Ready: ' + new Date(order.readyAt).toLocaleString() : ''}${order.completedAt ? '<br>Completed: ' + new Date(order.completedAt).toLocaleString() : ''}<br><span style='font-size:0.9em;color:#888;'>VAT included</span>`;
            if(order.note) {
                div.innerHTML += `<br><em>Note: ${order.note}</em>`;
            }
            allOrdersList.appendChild(div);
        });
    }

    function renderMenuManagement() {
        const menu = getMenu();
        menuManagement.innerHTML = '';
        menu.forEach(item => {
            const div = document.createElement('div');
            div.innerHTML = `${item.name} (NPR ${item.price.toFixed(2)}) <button data-id="${item.id}" class="toggle-availability">${item.available ? 'Set Unavailable' : 'Set Available'}</button>`;
            menuManagement.appendChild(div);
        });
        menuManagement.querySelectorAll('.toggle-availability').forEach(btn => {
            btn.onclick = function() {
                const id = parseInt(this.getAttribute('data-id'));
                const menu = getMenu();
                const idx = menu.findIndex(i => i.id === id);
                if (idx !== -1) {
                    menu[idx].available = !menu[idx].available;
                    setMenu(menu);
                }
            };
        });
    }

    function renderTipsTracking() {
        const orders = getOrders();
        const totalTips = orders.reduce((sum, o) => sum + (o.tip || 0), 0);
        tipsTracking.innerHTML = `<strong>Total Tips:</strong> NPR ${totalTips.toLocaleString()}`;
    }

    window.addEventListener('orders_updated', () => {
        renderAllOrders();
        renderTipsTracking();
        renderAnalytics();
    });
    window.addEventListener('menu_updated', renderMenuManagement);

    renderAllOrders();
    renderMenuManagement();
    renderTipsTracking();
    renderAnalytics();
});
