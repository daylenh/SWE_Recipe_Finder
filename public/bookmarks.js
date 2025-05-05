/**
 * @function
 * @description Handles the display and management of bookmarked recipes.
 * This script fetches the user's bookmarks from the server and displays them on the page.
 * @event DOMContentLoaded - Initializes the bookmarks display when the DOM is fully loaded.
 * @returns {void}
 * @throws Will log an error if the session check fails or if fetching bookmarks fails.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const messageElement = document.getElementById('message');
    const bookmarkList = document.getElementById('bookmark-list');

    if (!messageElement || !bookmarkList) {
        console.error('Required DOM elements not found.');
        return;
    }

    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        const username = data.username;

        if (!username) {
            messageElement.textContent = 'You must sign in to view your bookmarked recipes.';
            bookmarkList.innerHTML = '';
            return;
        }

        messageElement.textContent = 'Your Bookmarked Recipes:';
        await fetchBookmarks(username);
    } catch (err) {
        console.error('Error checking session:', err);
        messageElement.textContent = 'Error checking login status.';
    }
});

/**
 * @function
 * @description Fetches the user's bookmarked recipes from the server.
 * @param {string} username - The username of the user whose bookmarks are to be fetched.
 * @returns {Promise<void>} - A promise that resolves when the bookmarks are fetched and displayed.
 * @throws Will log an error if the fetch request fails or if there is an issue with the response.
 */
async function fetchBookmarks(username) {
    const bookmarkList = document.getElementById('bookmark-list');
    const messageElement = document.getElementById('message');

    try {
        const response = await fetch(`/api/bookmarks?username=${encodeURIComponent(username)}`);
        const data = await response.json();

        if (data.bookmarks && data.bookmarks.length > 0) {
            messageElement.textContent = 'Your Bookmarked Recipes:';
            displayBookmarks(data.bookmarks);
        } else {
            bookmarkList.innerHTML = '';
            messageElement.textContent = 'No bookmarks found.';
            messageElement.style.textAlign = 'center';
            messageElement.style.fontSize = '1.5rem';
            messageElement.style.color = '#666';
        }
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        messageElement.textContent = 'Failed to load bookmarks. Try again later.';
    }
}

/**
 * @function
 * @description Displays the list of bookmarks on the page.
 * @param {Array} bookmarks - An array of bookmark objects to display.
 * @returns {void}
 * @throws Will log an error if there is an issue with the bookmark data.
 */
function displayBookmarks(bookmarks) {
    const bookmarkList = document.getElementById('bookmark-list');
    bookmarkList.innerHTML = ''; 

    bookmarks.forEach(bookmark => {
        const bookmarkCard = document.createElement('div');
        bookmarkCard.className = 'recipe-card';

        bookmarkCard.innerHTML = `
            <h3>${escapeHtml(bookmark.title)}</h3>
            <img src="${bookmark.image}" alt="${escapeHtml(bookmark.title)} image" onerror="this.src='placeholder.jpg'">
            <div>
                <button class="button view-recipe-btn" onclick="window.open('${bookmark.sourceUrl}', '_blank')">View Recipe</button>
                <button class="button remove-btn">Remove Bookmark</button>
            </div>
        `;

        const removeBtn = bookmarkCard.querySelector('.remove-btn');
        removeBtn.addEventListener('click', async () => {
            const confirmDelete = confirm(`Remove "${bookmark.title}" from bookmarks?`);
            if (!confirmDelete) return;

            try {
                const response = await fetch('/api/bookmarks', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: localStorage.getItem('username'),
                        title: bookmark.title,
                        sourceUrl: bookmark.sourceUrl
                    }),
                });

                if (response.ok) {
                    alert('Bookmark removed.');
                    bookmarkCard.remove(); 
                } else {
                    alert('Failed to remove bookmark.');
                }
            } catch (err) {
                console.error('Error removing bookmark:', err);
                alert('An error occurred.');
            }
        });

        bookmarkList.appendChild(bookmarkCard);
    });
}

/**
 * @function
 * @description Escapes HTML special characters in a string to prevent XSS attacks.
 * @param {string} text - The text to escape for HTML.
 * @returns {string} - The escaped HTML string.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
