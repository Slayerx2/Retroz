// Cook interface logic

document.addEventListener('DOMContentLoaded', () => {
    const kitchenOrdersList = document.getElementById('kitchenOrdersList');

    function renderKitchenOrders() {
        const orders = getOrders().filter(o => o.status !== 'completed');
        kitchenOrdersList.innerHTML = '';
        if (orders.length === 0) {
            kitchenOrdersList.innerHTML = '<em>No active orders.</em>';
            return;
        }
        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-status status-' + order.status;
            const menu = getMenu();
            div.innerHTML = `Table ${order.table} | Items: ${order.items.map(i => {
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
            }).join(', ')}<br>Status: ${order.status}`;
            if(order.note) {
                div.innerHTML += `<br><em>Note: ${order.note}</em>`;
            }
            if (order.status === 'preparing') {
                const btn = document.createElement('button');
                btn.textContent = 'Mark Ready';
                btn.onclick = () => updateOrderStatus(order.id, 'ready');
                div.appendChild(document.createElement('br'));
                div.appendChild(btn);
            } else if (order.status === 'ready') {
                const btn = document.createElement('button');
                btn.textContent = 'Complete Order';
                btn.onclick = () => updateOrderStatus(order.id, 'completed');
                div.appendChild(document.createElement('br'));
                div.appendChild(btn);
            }
            kitchenOrdersList.appendChild(div);
        });
    }

    window.addEventListener('orders_updated', renderKitchenOrders);
    renderKitchenOrders();
});
