/**
 * @function 
 * @description Fetches recipe details from the server and displays them on the page.
 *             It also handles bookmarking functionality for the recipe.
 * @event DOMContentLoaded
 * @returns {void}
 * @throws Will log an error if the recipe ID is not provided or if fetching fails.
 */
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
        const titleElem = document.getElementById('recipe-title');
        const imageElem = document.getElementById('recipe-image');
        const instructionsElem = document.getElementById('recipe-instructions');
        const ingredientsList = document.getElementById('recipe-ingredients');
        const bookmarkBtn = document.getElementById('bookmark-button'); 
        if (!titleElem || !imageElem || !instructionsElem || !ingredientsList || !bookmarkBtn) {
            console.error('Missing DOM elements for recipe display.');
            return;
        }
        titleElem.innerText = escapeHtml(data.title);
        imageElem.src = data.image || 'placeholder.jpg';
        imageElem.alt = `${escapeHtml(data.title)} image`;
        instructionsElem.innerHTML = data.instructions || '<p>No instructions available.</p>';
        ingredientsList.innerHTML = '';
        data.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.innerText = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
            ingredientsList.appendChild(li);
        });
        const username = localStorage.getItem('username');
        if (!username) {
            alert('Please sign in to bookmark this recipe.');
            return;
        }
        const checkBookmarksUrl = `/api/bookmarks?username=${encodeURIComponent(username)}`;
        const bookmarkResponse = await fetch(checkBookmarksUrl);
        const bookmarkData = await bookmarkResponse.json();
        const isBookmarked = bookmarkData.bookmarks.some(bookmark => bookmark.sourceUrl === data.sourceUrl);
        if (isBookmarked) {
            bookmarkBtn.disabled = true;
            bookmarkBtn.innerText = 'Already Bookmarked';
        }
        bookmarkBtn.addEventListener('click', async () => {
            const bookmarkData = {
                username,
                title: data.title,
                image: data.image,
                sourceUrl: data.sourceUrl || window.location.href,
            };
            try {
                const bookmarkResponse = await fetch('/api/bookmarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookmarkData),
                });
                if (bookmarkResponse.ok) {
                    alert('Recipe bookmarked successfully!');
                    bookmarkBtn.disabled = true;
                    bookmarkBtn.innerText = 'Already Bookmarked';
                } else {
                    alert('Failed to bookmark recipe.');
                }
            } catch (error) {
                console.error('Error bookmarking recipe:', error);
                alert('An error occurred while bookmarking.');
            }
        });
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        const titleElem = document.getElementById('recipe-title');
        if (titleElem) {
            titleElem.innerText = 'Failed to load recipe details.';
        }
    }
});

/**
 * @function 
 * @description Escapes HTML special characters in a string to prevent XSS attacks.
  This function creates a temporary DOM element, sets its text content, and retrieves the inner HTML.
  It is used to safely display user-generated content on the page.
 * @param {string} text - The text to escape.
 * @returns {string} The escaped HTML string.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
