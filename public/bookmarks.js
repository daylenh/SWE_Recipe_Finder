document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/check-session');
    const data = await response.json();
    const username = data.username;
    const messageElement = document.getElementById('message');
    const bookmarkList = document.getElementById('bookmark-list');
    if (!username) {
      messageElement.textContent = 'You must sign in to view your bookmarked recipes.';
      bookmarkList.innerHTML = ''; 
      return;
    }
    messageElement.textContent = 'Your Bookmarked Recipes:';
    fetchBookmarks(username);
});
  
async function fetchBookmarks(username) {
    try {
      const response = await fetch(`/api/bookmarks?username=${username}`);
      const data = await response.json();
      if (data.bookmarks && data.bookmarks.length > 0) {
        displayBookmarks(data.bookmarks);
      } else {
        document.getElementById('bookmark-list').innerHTML = '<p>No bookmarks found.</p>';
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      document.getElementById('bookmark-list').innerHTML = '<p>Failed to load bookmarks. Try again later.</p>';
    }
}
  
function displayBookmarks(bookmarks) {
    const bookmarkList = document.getElementById('bookmark-list');
    bookmarkList.innerHTML = '';
    bookmarks.forEach(bookmark => {
      const bookmarkCard = document.createElement('div');
      bookmarkCard.className = 'recipe-card';
      bookmarkCard.innerHTML = `
        <h3>${bookmark.title}</h3>
        <img src="${bookmark.image}" alt="${bookmark.title}">
        <p><a href="recipe.html?id=${bookmark.id}">View Recipe</a></p>
      `;
      bookmarkList.appendChild(bookmarkCard);
    });
}
