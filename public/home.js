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
});

document.getElementById('query').addEventListener('click', async () => {
    const queryInput = document.getElementById('query').value.trim
    const response = await fetch(`/api/recipes?query=${encodeURIComponent(queryInput)}`);
    const data = await response.json();
    const results = document.getElementById('results');
    results.innerHTML = '';
    data.recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}">
            <h3>${recipe.title}</h3>
        `;
        card.addEventListener('click', () => {
            window.location.href = `recipe.html?id=${recipe.id}`;
        });
        results.appendChild(card);
    })
});

document.addEventListener('DOMContentLoaded', async () => {
    const greeting = document.getElementById('greeting');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const bookmarkBtn = document.getElementById('bookmark-btn');

    // Check if the user is logged in
    try {
        const res = await fetch('/api/user');
        const data = await res.json();

        if (data.username) {
            // User is logged in
            greeting.textContent = `Hello, ${data.username}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            
            bookmarkBtn.style.display = 'inline-block';
        
            // Logout functionality
            logoutBtn.addEventListener('click', async () => {
                await fetch('/logout', { method: 'POST' });
                greeting.textContent = 'Hello, Guest';
                loginBtn.style.display = 'inline-block';
                logoutBtn.style.display = 'none';
                alert('You are now logged out.');
            });
        } else {
            // User is not logged in
            greeting.textContent = 'Hello, Guest';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
        
    } catch (err) {
        console.error('Error fetching user:', err);
        greeting.textContent = 'Hello, Guest';
    }
});

