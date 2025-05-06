/**
 * @function
 * @description Handles the login and registration process for the user.
 * It listens for form submissions, sends the data to the server, and handles the response.
 * @event DOMContentLoaded
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
 * @description Handles the login process for the user.
 * It listens for form submissions, sends the data to the server, and handles the response.
 * @event DOMContentLoaded
 * @returns {void}
 * @throws Will log an error if the login fails or if the server response is not as expected.
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
