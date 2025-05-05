/**
 * @function
 * @description Handles the search functionality for recipes on the home page.
 * @event DOMContentLoaded - Initializes the search functionality when the DOM is fully loaded.
 * @returns {void}
 * @throws Will log an error if the fetch request fails or if there is an issue displaying recipes.
 */
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const queryInput = document.getElementById('query');
    const resultsContainer = document.getElementById('results');
    async function searchRecipes() {
        const query = queryInput.value.trim();
        if (!query) return;
        resultsContainer.innerHTML = '<p>Loading...</p>';
        try {
            const response = await fetch(`/api/recipes?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            displayRecipes(data.recipes);
        } catch (err) {
            console.error(err);
            resultsContainer.innerHTML = '<p>Failed to fetch recipes.</p>';
        }
    }

    /**
     * @function
     * @description Displays the list of recipes in the results container.
     * @param {Array} recipes - An array of recipe objects to display.
     * @returns {void}
     */
    function displayRecipes(recipes) {
        resultsContainer.innerHTML = '';
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.innerHTML = `
                <h3>${recipe.title}</h3>
                <img src="${recipe.image}" alt="${recipe.title}" width="200">
            `;
            recipeCard.onclick = () => {
                window.location.href = `recipe.html?id=${recipe.id}`;
            };
            resultsContainer.appendChild(recipeCard);
        });
    }
    searchBtn.addEventListener('click', searchRecipes);
    const greeting = document.getElementById('greeting');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const bookmarkBtn = document.getElementById('bookmark-btn');

    /**
     * @function
     * @description Fetches the current user's information and updates the greeting and button visibility.
     * @returns {void}
     * @throws Will log an error if the fetch request fails or if there is an issue with the response.
     */
    (async () => {
        try {
            const res = await fetch('/api/user');
            const data = await res.json();

            if (data.username) {
                greeting.textContent = `Hello, ${data.username}`;
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'inline-block';
                bookmarkBtn.style.display = 'inline-block';

                logoutBtn.addEventListener('click', async () => {
                    try {
                        const response = await fetch('/logout', { method: 'POST' });
                        if (response.ok) {
                            localStorage.removeItem('username');
                            greeting.textContent = 'Hello, Guest';
                            loginBtn.style.display = 'inline-block';
                            logoutBtn.style.display = 'none';
                            bookmarkBtn.style.display = 'none';
                            alert('You are now logged out.');
                            window.location.href = '/';
                        } else {
                            console.error('Logout failed');
                        }
                    } catch (error) {
                        console.error('Error during logout:', error);
                    }
                });
            } else {
                greeting.textContent = 'Hello, Guest';
                loginBtn.style.display = 'inline-block';
                logoutBtn.style.display = 'none';
                bookmarkBtn.style.display = 'none';
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            greeting.textContent = 'Hello, Guest';
        }
    })();
});
