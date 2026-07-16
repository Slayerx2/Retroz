// Kitchen Display System - Professional Kitchen Board

document.addEventListener('DOMContentLoaded', () => {
    // State
    let soundEnabled = true;
    let lastOrderCount = 0;
    const WARNING_MINUTES = 10;
    const DELAYED_MINUTES = 20;

    // Audio context for sound notifications
    let audioContext = null;

    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    function playNotificationSound() {
        if (!soundEnabled || !audioContext) return;

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }

    // Kitchen Announcement
    function loadKitchenAnnouncement() {
        const announcement = localStorage.getItem('kitchen_announcement') || '';
        document.getElementById('announcementText').textContent = announcement || 'No announcements';
    }

    function saveKitchenAnnouncement(text) {
        localStorage.setItem('kitchen_announcement', text);
        document.getElementById('announcementText').textContent = text || 'No announcements';
    }

    // Announcement modal
    document.getElementById('editAnnouncementBtn').addEventListener('click', () => {
        const modal = document.getElementById('announcementModal');
        const input = document.getElementById('announcementInput');
        const currentText = localStorage.getItem('kitchen_announcement') || '';
        input.value = currentText;
        modal.style.display = 'flex';
    });

    document.getElementById('saveAnnouncementBtn').addEventListener('click', () => {
        const text = document.getElementById('announcementInput').value.trim();
        saveKitchenAnnouncement(text);
        document.getElementById('announcementModal').style.display = 'none';
        showToast('Announcement updated', 'success');
    });

    document.getElementById('cancelAnnouncementBtn').addEventListener('click', () => {
        document.getElementById('announcementModal').style.display = 'none';
    });

    // Sound toggle
    document.getElementById('soundToggleBtn').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const btn = document.getElementById('soundToggleBtn');
        btn.textContent = soundEnabled ? '🔊' : '🔇';
        btn.classList.toggle('muted', !soundEnabled);
        
        // Initialize audio on first interaction
        if (soundEnabled && !audioContext) {
            initAudio();
        }
    });

    // Timing state calculation
    function getTimingState(order) {
        const createdTime = new Date(order.createdAt);
        const elapsedMinutes = Math.floor((Date.now() - createdTime) / 60000);

        if (elapsedMinutes >= DELAYED_MINUTES) {
            return { state: 'delayed', text: `Delayed ${elapsedMinutes} min`, class: 'delayed' };
        } else if (elapsedMinutes >= WARNING_MINUTES) {
            return { state: 'warning', text: `Waiting ${elapsedMinutes} min`, class: 'warning' };
        } else {
            return { state: 'normal', text: `${elapsedMinutes} min`, class: 'normal' };
        }
    }

    // Create kitchen order card
    function createKitchenOrderCard(order) {
        const card = document.createElement('div');
        const timing = getTimingState(order);
        
        card.className = `kitchen-order-card timing-${timing.class}`;

        const tableInfo = order.orderType === 'dinein' ? `Table ${order.table}` : 'Take Away';
        const orderNumber = order.id.replace('o_', '');

        card.innerHTML = `
            <div class="kitchen-order-header">
                <div class="kitchen-order-number">#${orderNumber}</div>
                <div class="kitchen-order-time ${timing.class}">${timing.text}</div>
            </div>
            <div class="kitchen-order-body">
                <div class="kitchen-order-info">
                    <span><strong>${tableInfo}</strong></span>
                    <span><strong>Waiter:</strong> ${order.waiter}</span>
                </div>
                <div class="kitchen-order-items">
                    ${order.items.map(item => `
                        <div class="kitchen-order-item">
                            <span>${item.name}</span>
                            <span class="kitchen-order-item-quantity">x${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>
                ${order.note ? `<div class="kitchen-order-note">Note: ${order.note}</div>` : ''}
                ${order.items.some(i => i.note) ? `
                    <div class="kitchen-order-note">
                        Item notes: ${order.items.filter(i => i.note).map(i => `${i.name}: ${i.note}`).join(', ')}
                    </div>
                ` : ''}
            </div>
            <div class="kitchen-order-actions" id="actions-${order.id}"></div>
        `;

        // Add appropriate actions based on status
        const actionsContainer = card.querySelector(`#actions-${order.id}`);
        const actions = getKitchenActions(order.status);
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.textContent = action.label;
            btn.className = action.className || '';
            btn.addEventListener('click', () => action.handler(order));
            actionsContainer.appendChild(btn);
        });

        return card;
    }

    function getKitchenActions(status) {
        const actions = [];

        switch (status) {
            case 'sent':
                actions.push({
                    label: 'Start Preparing',
                    className: 'btn-primary',
                    handler: (order) => updateOrderStatus(order.id, 'preparing')
                });
                actions.push({
                    label: 'Accept',
                    className: 'btn-secondary',
                    handler: (order) => updateOrderStatus(order.id, 'accepted')
                });
                break;
            case 'accepted':
                actions.push({
                    label: 'Start Preparing',
                    className: 'btn-primary',
                    handler: (order) => updateOrderStatus(order.id, 'preparing')
                });
                break;
            case 'preparing':
                actions.push({
                    label: 'Mark Ready',
                    className: 'btn-primary',
                    handler: (order) => updateOrderStatus(order.id, 'ready')
                });
                break;
            case 'ready':
                actions.push({
                    label: 'Complete',
                    className: 'btn-primary',
                    handler: (order) => updateOrderStatus(order.id, 'served')
                });
                break;
            default:
                break;
        }

        return actions;
    }

    // Render kitchen board
    function renderKitchenBoard() {
        const orders = getOrders();
        const activeOrders = orders.filter(o => 
            o.status !== 'completed' && 
            o.status !== 'paid' && 
            o.status !== 'cancelled' &&
            o.status !== 'served'
        );

        // Check for new orders and play sound
        const currentOrderCount = activeOrders.length;
        if (currentOrderCount > lastOrderCount && soundEnabled) {
            playNotificationSound();
        }
        lastOrderCount = currentOrderCount;

        // Separate orders by status
        const newOrders = activeOrders.filter(o => o.status === 'sent' || o.status === 'accepted');
        const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
        const readyOrders = activeOrders.filter(o => o.status === 'ready');

        // Sort by creation time (oldest first)
        newOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        preparingOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        readyOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Render columns
        renderColumn('new-orders', newOrders, 'No new orders');
        renderColumn('preparing-orders', preparingOrders, 'No orders preparing');
        renderColumn('ready-orders', readyOrders, 'No orders ready');

        // Update counts
        document.getElementById('new-count').textContent = newOrders.length;
        document.getElementById('preparing-count').textContent = preparingOrders.length;
        document.getElementById('ready-count').textContent = readyOrders.length;
    }

    function renderColumn(containerId, orders, emptyMessage) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
            return;
        }

        orders.forEach(order => {
            const card = createKitchenOrderCard(order);
            container.appendChild(card);
        });
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

    // Auto-refresh every 30 seconds
    setInterval(renderKitchenBoard, 30000);

    // Event listeners
    window.addEventListener('orders_updated', renderKitchenBoard);
    window.addEventListener('storage', (e) => {
        if (e.key === 'kitchen_announcement') {
            loadKitchenAnnouncement();
        }
    });

    // Initialize
    loadKitchenAnnouncement();
    renderKitchenBoard();
});
