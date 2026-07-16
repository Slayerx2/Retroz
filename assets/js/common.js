// Shared logic for order storage and syncing (localStorage-based mock)
// Updated to use new StorageService for better data management

// Load storage service first
const script = document.createElement('script');
script.src = 'storage-service.js';
document.head.appendChild(script);

// Nepali Café & Restaurant Menu (no icons)
const defaultMenu = [
  // Veg
  { id: 1, name: 'Veg Momo', price: 120, available: true },
  { id: 2, name: 'Paneer Chilli', price: 180, available: true },
  { id: 3, name: 'Veg Thukpa', price: 120, available: true },
  { id: 4, name: 'Aloo Jeera', price: 90, available: true },
  { id: 5, name: 'Veg Chowmein', price: 120, available: true },
  { id: 6, name: 'Paneer Butter Masala', price: 220, available: true },
  { id: 7, name: 'Dal Bhat Tarkari', price: 180, available: true },
  { id: 8, name: 'Veg Fried Rice', price: 120, available: true },
  // Non-Veg
  { id: 9, name: 'Chicken Momo', price: 160, available: true },
  { id: 10, name: 'Chicken Chilli', price: 220, available: true },
  { id: 11, name: 'Buff Momo', price: 150, available: true },
  { id: 12, name: 'Chicken Thukpa', price: 150, available: true },
  { id: 13, name: 'Chicken Chowmein', price: 150, available: true },
  { id: 14, name: 'Buff Sukuti', price: 250, available: true },
  { id: 15, name: 'Chicken Fried Rice', price: 150, available: true },
  { id: 16, name: 'Egg Curry', price: 110, available: true },
  // Snacks
  { id: 17, name: 'French Fries', price: 90, available: true },
  { id: 18, name: 'Samosa', price: 40, available: true },
  { id: 19, name: 'Pakoda', price: 70, available: true },
  { id: 20, name: 'Spring Roll', price: 90, available: true },
  { id: 21, name: 'Wai Wai Sadeko', price: 80, available: true },
  // Drinks
  { id: 22, name: 'Black Tea', price: 30, available: true },
  { id: 23, name: 'Milk Tea', price: 40, available: true },
  { id: 24, name: 'Lemon Tea', price: 50, available: true },
  { id: 25, name: 'Espresso', price: 80, available: true },
  { id: 26, name: 'Cappuccino', price: 120, available: true },
  { id: 27, name: 'Latte', price: 130, available: true },
  { id: 28, name: 'Cold Coffee', price: 120, available: true },
  { id: 29, name: 'Lassi', price: 70, available: true },
  { id: 30, name: 'Fresh Lemon Soda', price: 60, available: true },
  { id: 31, name: 'Bottled Water', price: 25, available: true },
  // Bakery & Sweets
  { id: 32, name: 'Chocolate Cake', price: 120, available: true },
  { id: 33, name: 'Sel Roti', price: 40, available: true },
  { id: 34, name: 'Kheer', price: 60, available: true }
];

// Wrapper functions for backward compatibility
function getMenu() {
    // Try to use new storage service first, fall back to old method
    if (typeof StorageService !== 'undefined' && StorageService.getProducts) {
        const products = StorageService.getProducts();
        if (products.length > 0) {
            return products.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                available: p.available,
                category: p.category,
                desc: p.description,
                img: p.imageUrl,
                vegetarian: p.vegetarian,
                prepTime: p.preparationTime
            }));
        }
    }
    
    // Fall back to old method
    let menu = JSON.parse(localStorage.getItem('cafe_menu'));
    if (!menu) {
        menu = defaultMenu;
        localStorage.setItem('cafe_menu', JSON.stringify(menu));
    }
    return menu;
}

function setMenu(menu) {
    // Try to use new storage service first
    if (typeof StorageService !== 'undefined' && StorageService.setProducts) {
        const products = menu.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            available: item.available,
            category: item.category || 'other',
            description: item.desc || '',
            imageUrl: item.img || '',
            vegetarian: item.vegetarian || false,
            preparationTime: item.prepTime || 0,
            archived: item.archived || false
        }));
        StorageService.setProducts(products);
    } else {
        // Fall back to old method
        localStorage.setItem('cafe_menu', JSON.stringify(menu));
    }
    window.dispatchEvent(new Event('menu_updated'));
}

function getOrders() {
    // Try to use new storage service first
    if (typeof StorageService !== 'undefined' && StorageService.getOrders) {
        const orders = StorageService.getOrders();
        // Convert to old format for compatibility
        return orders.map(o => ({
            id: o.id,
            table: o.tableId,
            orderType: o.orderType,
            status: o.status,
            waiter: o.waiterId,
            items: o.items.map(item => ({
                id: item.productId,
                name: item.productName,
                price: item.unitPrice,
                quantity: item.quantity,
                note: item.itemNote
            })),
            subtotal: o.subtotal,
            vat: o.VAT,
            serviceCharge: o.serviceCharge,
            discount: o.discount,
            tip: o.tip,
            total: o.total,
            note: o.notes,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            readyAt: o.statusHistory.find(h => h.status === 'ready')?.timestamp,
            completedAt: o.statusHistory.find(h => h.status === 'completed')?.timestamp,
            paidAt: o.statusHistory.find(h => h.status === 'paid')?.timestamp,
            cancelReason: o.statusHistory.find(h => h.status === 'cancelled')?.reason
        }));
    }
    
    // Fall back to old method
    return JSON.parse(localStorage.getItem('cafe_orders') || '[]');
}

function saveOrders(orders) {
    // Try to use new storage service first
    if (typeof StorageService !== 'undefined' && StorageService.setOrders) {
        const normalizedOrders = orders.map(order => {
            const existingOrder = StorageService.getOrder(order.id);
            return {
                id: order.id,
                orderNumber: order.orderNumber || order.id?.replace('o_', ''),
                businessDate: order.businessDate || new Date().toISOString().split('T')[0],
                tableId: order.table,
                orderType: order.orderType || 'dinein',
                status: order.status,
                waiterId: order.waiter,
                items: (order.items || []).map(item => ({
                    productId: item.id,
                    productName: item.name,
                    unitPrice: item.price,
                    quantity: item.quantity,
                    itemNote: item.note || '',
                    lineTotal: item.price * item.quantity
                })),
                subtotal: order.subtotal || 0,
                VAT: order.vat || 0,
                serviceCharge: order.serviceCharge || 0,
                discount: order.discount || 0,
                tip: order.tip || 0,
                total: order.total || 0,
                notes: order.note || '',
                createdAt: order.createdAt || new Date().toISOString(),
                updatedAt: order.updatedAt || new Date().toISOString(),
                statusHistory: existingOrder?.statusHistory || [{
                    status: order.status,
                    timestamp: new Date().toISOString(),
                    userId: order.waiter || 'system'
                }]
            };
        });
        StorageService.setOrders(normalizedOrders);
    } else {
        // Fall back to old method
        localStorage.setItem('cafe_orders', JSON.stringify(orders));
    }
    window.dispatchEvent(new Event('orders_updated'));
}

function addOrder(order) {
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
}

// Helper to get today's orders
function getTodaysOrders() {
    const today = new Date().toISOString().slice(0, 10);
    return getOrders().filter(o => o.createdAt && o.createdAt.startsWith(today));
}

function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = status;
        if(status === 'ready') orders[idx].readyAt = new Date().toISOString();
        if(status === 'completed') orders[idx].completedAt = new Date().toISOString();
        if(status === 'paid') orders[idx].paidAt = new Date().toISOString();
        saveOrders(orders);
        
        // Add audit log if available
        if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
            const session = getUser();
            StorageService.addAuditLog({
                userId: session.username || 'system',
                action: 'status_changed',
                entityType: 'order',
                entityId: orderId,
                description: `Order status changed to ${status}`
            });
        }
    }
}

function getUser() {
    // Try to use new storage service first
    if (typeof StorageService !== 'undefined' && StorageService.getSession) {
        return StorageService.getSession();
    }
    // Fall back to old method
    return JSON.parse(localStorage.getItem('cafe_session') || '{}');
}

function logout() {
    // Add audit log if available
    if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
        const session = getUser();
        StorageService.addAuditLog({
            userId: session.username || 'system',
            action: 'logout',
            entityType: 'session',
            entityId: session.username || 'system',
            description: 'User logged out'
        });
    }
    
    // Clear session
    if (typeof StorageService !== 'undefined' && StorageService.clearSession) {
        StorageService.clearSession();
    } else {
        localStorage.removeItem('cafe_session');
    }
    
    window.location.href = 'login.html';
}

// Route protection functions
function requireAuth() {
    const session = getUser();
    if (!session || !session.username || !session.role) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function requireRole(allowedRoles) {
    if (!requireAuth()) return false;
    
    const session = getUser();
    if (!allowedRoles.includes(session.role)) {
        // Redirect to appropriate page based on role
        if (session.role === 'waiter') {
            window.location.href = 'waiter.html';
        } else if (session.role === 'cook') {
            window.location.href = 'kitchen.html';
        } else if (session.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'login.html';
        }
        return false;
    }
    return true;
}
