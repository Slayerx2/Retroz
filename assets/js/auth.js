document.getElementById('login-form').addEventListener('submit', async function (e) {
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

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
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
      errorDiv.textContent = data.error || 'Invalid credentials.';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = 'Network error. Please try again.';
  }
});