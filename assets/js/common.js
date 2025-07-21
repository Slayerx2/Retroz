// Shared logic for order storage and syncing (localStorage-based mock)

const ORDER_KEY = 'cafe_orders';
const MENU_KEY = 'cafe_menu';
const USER_KEY = 'cafe_user';

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

function getMenu() {
    let menu = JSON.parse(localStorage.getItem(MENU_KEY));
    if (!menu) {
        menu = defaultMenu;
        localStorage.setItem(MENU_KEY, JSON.stringify(menu));
    }
    return menu;
}

function setMenu(menu) {
    localStorage.setItem(MENU_KEY, JSON.stringify(menu));
    window.dispatchEvent(new Event('menu_updated'));
}

function getOrders() {
    return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
}

function saveOrders(orders) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
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
        saveOrders(orders);
    }
}

function getUser() {
    return JSON.parse(localStorage.getItem(USER_KEY) || '{}');
}

function logout() {
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
}
