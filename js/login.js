// Login page logic
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorDiv = document.getElementById('error-msg');

  // Check if already logged in
  if (Auth.isLoggedIn()) {
    const user = Auth.getCurrentUser();
    Auth.redirectToRolePage(user.role);
  }

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    // Validation
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

    // Simple client-side authentication (replace with server auth in production)
    const validUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'waiter1', password: 'waiter123', role: 'waiter' },
      { username: 'cook1', password: 'cook123', role: 'cook' }
    ];

    const user = validUsers.find(
      u => u.username === username && u.password === password && u.role === role
    );

    if (user) {
      Auth.login(username, role);
      Auth.redirectToRolePage(role);
    } else {
      errorDiv.textContent = 'Invalid credentials.';
    }
  });
});