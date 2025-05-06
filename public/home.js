/**
 * @function 
 * @description This script handles the search functionality and user authentication state on the home page.
 * It fetches recipes based on user input, displays them, and manages the login/logout state.
 * @event DOMContentLoaded
 * @returns {void}
 * @throws Will log an error if fetching recipes or user data fails.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const searchBtn = document.getElementById('search-btn');
    const queryInput = document.getElementById('query');
    const resultsContainer = document.getElementById('results');
    const greeting = document.getElementById('greeting');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const bookmarkBtn = document.getElementById('bookmark-btn');
    /**
     * @async
     * @function
     * @description Fetches recipes based on the user's search query and displays them.
     */
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
     * @description Displays the fetched recipes in the results container.
     * @param {Array} recipes - The array of recipe objects to display. 
     * @throws Will log an error if the recipes array is empty or undefined.
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
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/logout', { method: 'POST' });
            localStorage.clear();
            greeting.textContent = 'Hello, Guest';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            bookmarkBtn.style.display = 'none';
            alert('You are now logged out.');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    });
    try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data.username) {
            greeting.textContent = `Hello, ${data.username}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            bookmarkBtn.style.display = 'inline-block';
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
});
