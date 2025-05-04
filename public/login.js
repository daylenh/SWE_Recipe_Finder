document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    const messageBox = document.getElementById('registerMessage');
    messageBox.textContent = data.success ? data.message : data.error;
    messageBox.style.color = data.success ? 'green' : 'red';
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    const messageBox = document.getElementById('loginMessage');
    if (res.ok && data.success) {
        messageBox.textContent = 'Logged in!';
        messageBox.style.color = 'green';
        window.location.href = '/home.html'; 
    } else {
        messageBox.textContent = data.message || 'Login failed.';
        messageBox.style.color = 'red';
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('username', username);
      window.location.href = '/';
    } else {
      alert(data.message || 'Login failed.');
    }
  });
  