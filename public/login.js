/**
 * @function
 * @descroption Handles user registration and login.
 * This script listens for form submissions for both registration and login.
 * It sends the form data to the server and displays success or error messages based on the response.
 * @event submit - Handles form submission for registration and login.
 * @param {Event} e - The event object for the form submission.
 * @returns {void}
 */
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

/**
 * @function
 * @description Handles user login.
 * This script listens for the login form submission, sends the credentials to the server,
 * and displays a success or error message based on the response.
 * @event submit - Handles form submission for login.
 * @param {Event} e - The event object for the form submission.
 * @returns {void}
 */
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
        localStorage.setItem('username', data.username);
        messageBox.textContent = 'Logged in!';
        messageBox.style.color = 'green';
        window.location.href = '/home.html'; 
    } else {
        messageBox.textContent = data.message || 'Login failed.';
        messageBox.style.color = 'red';
    }
});
