const urlParams = new URLSearchParams(window.location.search);
const recipeId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');  
    if (!recipeId) {
        console.error('No recipe ID provided.');
        return;
    }
    const recipeUrl = `/api/recipe/${recipeId}`;
    try {
        const response = await fetch(recipeUrl);
        const data = await response.json();
        document.getElementById('recipe-title').innerText = data.title;
        document.getElementById('recipe-image').src = data.image;
        document.getElementById('recipe-instructions').innerHTML = data.instructions; 
        const ingredientsList = document.getElementById('recipe-ingredients');
        ingredientsList.innerHTML = '';
        data.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.innerText = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
            ingredientsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        document.getElementById('recipe-title').innerText = 'Failed to load recipe details.';
    }
});
