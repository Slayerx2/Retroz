// Temporary client-side authentication for testing without server
// Replace this with the server version once Node.js is installed

document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;
  const errorDiv = document.getElementById('error-msg');

  if (!username) {
    errorDiv.textContent = 'Please enter your username.';
    document.getElementById('username').focus();
    return;
  }
  if (!password) {
    errorDiv.textContent = 'Please enter your password.';
    document.getElementById('password').focus();
    return;
  }
  if (!role) {
    errorDiv.textContent = 'Please select a role.';
    document.getElementById('role').focus();
    return;
  }

  // Temporary validation (credentials are still visible in code)
  const validUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'waiter1', password: 'waiter123', role: 'waiter' },
    { username: 'cook1', password: 'cook123', role: 'cook' }
  ];

  const user = validUsers.find(
    u => u.username === username && u.password === password && u.role === role
  );

  if (user) {
    localStorage.setItem('user', JSON.stringify({ username, role }));
    
    if (role === 'waiter') {
      window.location.href = 'waiter.html';
    } else if (role === 'cook') {
      window.location.href = 'cook.html';
    } else if (role === 'admin') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'index.html';
    }
  } else {
    errorDiv.textContent = 'Invalid credentials.';
  }
});
