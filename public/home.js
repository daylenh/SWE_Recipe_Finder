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

