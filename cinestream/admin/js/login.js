// CineStream - Admin Login Client Script

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('cinestream_token');
  if (token) {
    // Check if current token is valid, redirect if already logged in
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.href = 'index.html';
        }
      })
      .catch(() => {});
  }

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginAlert = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('submitBtn');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.style.display = 'none';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showAlert('Please enter both username and password.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('cinestream_token', data.token);
        if (data.admin) {
          localStorage.setItem('cinestream_admin', JSON.stringify(data.admin));
        }
        window.location.href = 'index.html';
      } else {
        showAlert(data.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showAlert('Network error connecting to server.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In to Admin Panel';
    }
  });

  function showAlert(msg) {
    loginAlert.textContent = msg;
    loginAlert.style.display = 'block';
  }
});
