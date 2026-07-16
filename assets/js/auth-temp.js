// ============================================================================
// TEMPORARY CLIENT-SIDE AUTHENTICATION FOR PROTOTYPE ONLY
// ============================================================================
// WARNING: This frontend-only authentication is NOT secure enough for production.
// It must be replaced with proper backend authentication with:
// - Secure password hashing (bcrypt, argon2, etc.)
// - Session management with HTTP-only cookies
// - CSRF protection
// - Rate limiting
// - Secure HTTPS connections
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
  // Load remembered username on page load
  const rememberedUsername = localStorage.getItem('remembered_username');
  if (rememberedUsername) {
    document.getElementById('username').value = rememberedUsername;
    document.getElementById('remember-username').checked = true;
  }

  // Password visibility toggle
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');

  togglePasswordBtn.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
    togglePasswordBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
  });

  // Allow keyboard toggle for accessibility
  togglePasswordBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePasswordBtn.click();
    }
  });

  // Login form submission
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberUsername = document.getElementById('remember-username').checked;
    const errorDiv = document.getElementById('error-msg');
    const loginBtn = document.getElementById('login-btn');

    // Clear previous errors
    errorDiv.textContent = '';

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

    // Set loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Predefined user records with roles
    let validUsers = [];
    if (typeof StorageService !== 'undefined' && StorageService.getUsers) {
        validUsers = StorageService.getUsers();
    }
    
    // Fall back to hardcoded users if storage service not available or empty
    if (validUsers.length === 0) {
        validUsers = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'waiter1', password: 'waiter123', role: 'waiter' },
            { username: 'waiter2', password: 'waiter123', role: 'waiter' },
            { username: 'cook1', password: 'cook123', role: 'cook' },
            { username: 'cook2', password: 'cook123', role: 'cook' }
        ];
    }

    // Find user by username and password (role is determined from user record)
    const user = validUsers.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      // Store only session info (no plaintext passwords)
      const session = {
        username: user.username,
        role: user.role,
        loginTime: new Date().toISOString()
      };
      
      // Use storage service if available
      if (typeof StorageService !== 'undefined' && StorageService.setSession) {
        StorageService.setSession(session);
      } else {
        localStorage.setItem('cafe_session', JSON.stringify(session));
      }

      // Handle remember username
      if (rememberUsername) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      // Add audit log
      if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
        StorageService.addAuditLog({
          userId: username,
          action: 'login',
          entityType: 'session',
          entityId: username,
          description: 'User logged in successfully'
        });
      }

      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'waiter') {
          window.location.href = 'waiter.html';
        } else if (user.role === 'cook') {
          window.location.href = 'kitchen.html';
        } else if (user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'login.html';
        }
      }, 300);
    } else {
      errorDiv.textContent = 'Invalid username or password.';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
      document.getElementById('password').focus();
    }
  });
});
