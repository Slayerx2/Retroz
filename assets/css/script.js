// ---------- AUTH & ROLE SETUP ----------
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

document.getElementById('user-role').innerText = `${user.username} (${user.role})`;
document.querySelectorAll('.role-section').forEach(section => (section.style.display = 'none'));

if (user.role === 'waiter') document.getElementById('waiter-section').style.display = 'block';
if (user.role === 'cook') document.getElementById('cook-section').style.display = 'block';
if (user.role === 'admin') document.getElementById('admin-section').style.display = 'block';

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// ---------- ORDER UTILS ----------
function getOrders() {
  return JSON.parse(localStorage.getItem('orders') || '[]');
}

function saveOrders(orders) {
  localStorage.setItem('orders', JSON.stringify(orders));
}

// ---------- MENU SETUP ----------
const menu = ['Veg Momo', 'Chicken Momo', 'Latte', 'Black Coffee', 'Burger', 'Pasta'];
const selectedItems = [];

function renderMenu() {
  const menuContainer = document.getElementById('menu-items');
  if (!menuContainer) return;

  menu.forEach(item => {
    const btn = document.createElement('button');
    btn.innerText = item;
    btn.className = 'menu-item-btn';
    btn.onclick = () => {
      selectedItems.push(item);
      updateSelectedItems();
    };
    menuContainer.appendChild(btn);
  });
}

function updateSelectedItems() {
  const list = document.getElementById('selected-items-list');
  list.innerHTML = '';
  selectedItems.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerText = `${item} `;
    const remove = document.createElement('button');
    remove.innerText = '✖';
    remove.onclick = () => {
      selectedItems.splice(i, 1);
      updateSelectedItems();
    };
    li.appendChild(remove);
    list.appendChild(li);
  });
}

// ---------- WAITER: PLACE ORDER ----------
const orderForm = document.getElementById('order-form');
if (orderForm) {
  renderMenu();
  orderForm.addEventListener('submit', e => {
    e.preventDefault();
    const table = document.getElementById('table').value;

    if (selectedItems.length === 0) {
      alert('Select at least one item.');
      return;
    }

    const orders = getOrders();
    orders.push({
      id: Date.now(),
      table,
      items: [...selectedItems],
      status: 'pending',
      timestamp: new Date().toLocaleString(),
    });

    saveOrders(orders);
    alert('Order placed!');
    orderForm.reset();
    selectedItems.length = 0;
    updateSelectedItems();
    renderKitchenOrders();
    renderAdminStats();
  });
}

// ---------- COOK: KITCHEN VIEW ----------
function renderKitchenOrders() {
  const orders = getOrders().filter(o => o.status !== 'ready');
  const container = document.getElementById('kitchen-orders');
  if (!container) return;

  container.innerHTML = '';
  orders.forEach(order => {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `
      <h3>Table ${order.table}</h3>
      <p>Items: ${order.items.join(', ')}</p>
      <p>Status: ${order.status}</p>
      <small>${order.timestamp}</small>
      <div>
        <button onclick="updateStatus(${order.id}, 'preparing')">Preparing</button>
        <button onclick="updateStatus(${order.id}, 'ready')">Ready</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function updateStatus(orderId, newStatus) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    saveOrders(orders);
    renderKitchenOrders();
    renderAdminStats();
  }
}

// ---------- ADMIN: ORDER STATS ----------
function renderAdminStats() {
  const orders = getOrders();
  const total = orders.length;
  const preparing = orders.filter(o => o.status === 'preparing').length;
  const ready = orders.filter(o => o.status === 'ready').length;
  const pending = orders.filter(o => o.status === 'pending').length;

  const container = document.getElementById('order-stats');
  if (!container) return;

  container.innerHTML = `
    <p>Total Orders: ${total}</p>
    <p>Pending: ${pending}</p>
    <p>Preparing: ${preparing}</p>
    <p>Ready: ${ready}</p>
  `;
}

// ---------- INITIALIZE ----------
renderKitchenOrders();
renderAdminStats();
