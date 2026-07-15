// Kitchen page logic
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  Auth.requireAuth();

  const kitchenOrdersList = document.getElementById('kitchenOrdersList');
  const noteForm = document.getElementById('noteForm');
  const kitchenNoteInput = document.getElementById('kitchenNote');
  const latestNoteDiv = document.getElementById('latestNote');

  function renderKitchenOrders() {
    const orders = Orders.getActiveOrders();
    const menu = Menu.get();
    
    kitchenOrdersList.innerHTML = '';
    if (orders.length === 0) {
      kitchenOrdersList.innerHTML = '<em>No active orders.</em>';
      return;
    }
    
    orders.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-status status-' + order.status;
      
      const itemsHtml = order.items.map(item => {
        const menuItem = menu.find(m => m.id === item.id);
        let imgHtml = '';
        if (menuItem && menuItem.img) {
          if (menuItem.img.endsWith('.png') || menuItem.img.endsWith('.jpg')) {
            imgHtml = `<img src='${menuItem.img}' alt='' style='width:20px;height:20px;vertical-align:middle;margin-right:4px;'>`;
          } else {
            imgHtml = `<span style='font-size:1.1em;margin-right:4px;'>${menuItem.img}</span>`;
          }
        }
        return imgHtml + item.name;
      }).join(', ');
      
      div.innerHTML = `
        <div><strong>Table ${order.table}</strong> | ${order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</div>
        <div>Items: ${itemsHtml}</div>
        <div>Status: ${order.status}</div>
        ${order.note ? `<div><em>Note: ${order.note}</em></div>` : ''}
      `;
      
      if (order.status === 'preparing') {
        const btn = document.createElement('button');
        btn.textContent = 'Mark Ready';
        btn.onclick = () => Orders.updateStatus(order.id, 'ready');
        div.appendChild(document.createElement('br'));
        div.appendChild(btn);
      } else if (order.status === 'ready') {
        const btn = document.createElement('button');
        btn.textContent = 'Complete Order';
        btn.onclick = () => Orders.updateStatus(order.id, 'completed');
        div.appendChild(document.createElement('br'));
        div.appendChild(btn);
      }
      
      kitchenOrdersList.appendChild(div);
    });
  }

  function loadNote() {
    const note = KitchenNote.get();
    latestNoteDiv.textContent = note ? 'Chef says: ' + note : 'No note for waiter.';
    kitchenNoteInput.value = note;
  }

  function saveNote(e) {
    e.preventDefault();
    const note = kitchenNoteInput.value.trim();
    KitchenNote.set(note);
    loadNote();
    UI.showToast('Note saved successfully', 'success');
  }

  // Event listeners
  noteForm.addEventListener('submit', saveNote);
  window.addEventListener('orders_updated', renderKitchenOrders);
  document.getElementById('logoutBtn').addEventListener('click', Auth.logout);

  // Initial render
  renderKitchenOrders();
  loadNote();
});