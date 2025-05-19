/**
 * @file server.js Recipe search and bookmark express server
 * @description This server handles user registration, login, recipe search, and bookmarking functionality.
 *             It uses SQLite for user and bookmark storage and Spoonacular API for recipe data.
 */
import express from 'express';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';

const app = express();
const port = 3000;
const SPOONACULAR_API_KEY = '0dc9b19d5d3a4a28a9e2f880dff28268';

//middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

/**
 * SQL database connection
 */
const dbPromise = open({
    filename: './database/users.db',
    driver: sqlite3.Database
});

/**
 * table creation 
 */
(async () => {
    try {
        const db = await dbPromise;
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                title TEXT NOT NULL,
                image TEXT NOT NULL,
                sourceUrl TEXT NOT NULL
            );
        `);

        console.log('Users table created or already exists.');
    } catch (err) {
        console.error('Error creating table:', err);
    }
})();

/**
 * @route GET /api/recipes
 * @description Fetches recipes from the Spoonacular API based on a search query.
 * @param {string} query - The search query for recipes.
 * @returns {object} - An object containing an array of recipes.
 * @throws {Error} - If the Spoonacular API request fails or if no recipes are found.
 */
app.get('/api/recipes', async (req, res) => {
    const query = req.query.query || ''; 
    const encodedQuery = encodeURIComponent(query); 
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodedQuery}&number=10&addRecipeInformation=true&apiKey=${SPOONACULAR_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results) {
            const recipes = data.results.map(recipe => ({
                id: recipe.id,
                title: recipe.title,
                instructions: recipe.instructions || 'Instructions not available',
                image: recipe.image
            }));
            res.json({ recipes });
        } else {
            res.status(500).json({ error: 'Failed to fetch recipes or no recipes found.' });
        }
    } catch (err) {
        console.error('Error fetching from Spoonacular:', err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

/**
 * @route GET /api/recipe/:id
 * @description Fetches detailed information about a specific recipe from the Spoonacular API.
 * @param {string} id - The ID of the recipe to fetch.
 * @returns {object} - An object containing detailed information about the recipe.
 * @throws {Error} - If the Spoonacular API request fails or if the recipe is not found.
 */
app.get('/api/recipe/:id', async (req, res) => {
    const recipeId = req.params.id;
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const ingredients = data.extendedIngredients.map(i => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit
        }));
        res.json({
            id: data.id,
            title: data.title,
            image: data.image,
            instructions: data.instructions,
            ingredients: ingredients
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recipe details' });
    }
});

/**
 * @route POST /api/register
 * @description Registers a new user by inserting their username and password into the database.
 * @param {string} username - The username of the new user.
 * @param {string} password - The password of the new user.
 * @returns {object} - A success message or an error message if the registration fails.
 * @throws {Error} - If the username is already taken or if there is a server error.
 */
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = await dbPromise;
        await db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, password]
        );
        res.json({ success: true, message: `Hello ${username}, you just registered.` });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Username already taken' });
        }
        console.error("Error inserting user:", err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

/**
 * @route POST /api/login
 * @description Authenticates a user by checking their username and password against the database.
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {object} - A success message with the username or an error message if authentication fails.
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await dbPromise;
    const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (user) {
        req.session.user = user.username;
        res.status(200).json({ success: true, username: user.username });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

/**
 * @route GET /api/check-session
 * @description Checks if a user is logged in by verifying the session.
 * @param {string} username - The username of the user.
 * @returns {object} - An object containing the username if logged in, or null if not.
 */
app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.json({ username: null });
    }
});

/**
 * @route GET /
 * @description Renders the home page.
 * @param {string} username - The username of the logged-in user.
 * @returns {object} - The rendered home page with the username.
 */
app.get('/', (req, res) => {
    const username = req.session.user || 'Guest';
    res.render('home', { username }); 
});

/**
 * @route GET /api/user
 * @description Fetches the current logged-in user from the session.
 * @returns {object} - An object containing the username if logged in, or null if not.
 */
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.json({ username: null });
    }
});

/**
 * @route POST /logout
 * @description Logs out the user by destroying the session.
 * @returns {object} - A success message or an error message if logout fails.
 */
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.status(200).send('Logged out successfully');
    });
});

/**
 * @route GET /api/bookmarks
 * @description Fetches bookmarks for a specific user from the database.
 * @param {string} username - The username of the user whose bookmarks to fetch.
 * @returns {object} - An object containing an array of bookmarks for the user.
 * @throws {Error} - If the username is not provided or if there is a server error.
 */
app.get('/api/bookmarks', async (req, res) => {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    try {
      const db = await dbPromise;
      const bookmarks = await db.all('SELECT * FROM bookmarks WHERE username = ?', [username]);
      res.json({ bookmarks });
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
});

/**
 * @route POST /api/bookmarks
 * @description Saves a new bookmark for a user in the database.
 * @param {string} username - The username of the user.
 * @param {string} title - The title of the bookmark.
 * @param {string} image - The image URL of the bookmark.
 * @param {string} sourceUrl - The source URL of the bookmark.
 * @returns {object} - A success message or an error message if saving fails.
 * @throws {Error} - If any required fields are missing or if there is a server error.
 */
app.post('/api/bookmarks', async (req, res) => {
    const { username, title, image, sourceUrl } = req.body;
    if (!username || !title || !image || !sourceUrl) {
        return res.status(400).json({ message: 'Missing fields' });
    }
    try {
        const db = await dbPromise;
        await db.run(
            `INSERT INTO bookmarks (username, title, image, sourceUrl) VALUES (?, ?, ?, ?)`,
            [username, title, image, sourceUrl]
        );
        res.status(201).json({ message: 'Bookmark saved' });
    } catch (error) {
        console.error('Failed to save bookmark:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route GET /api/bookmarks/:username
 * @description Fetches bookmarks for a specific user from the database.
 * @param {string} username - The username of the user whose bookmarks to fetch.
 * @returns {object} - An object containing an array of bookmarks for the user.
 * @throws {Error} - If the username is not provided or if there is a server error.
 */
app.get('/api/bookmarks/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const bookmarks = await db.all(
            `SELECT id, title, image, sourceUrl FROM bookmarks WHERE username = ?`,
            [username]
        );
        res.json({ bookmarks });
    } catch (error) {
        console.error('Failed to fetch bookmarks:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route DELETE /api/bookmarks
 * @description Deletes a bookmark for a user from the database.
 * @param {string} username - The username of the user.
 * @param {string} sourceUrl - The source URL of the bookmark to delete.
 * @returns {object} - A success message or an error message if deletion fails.
 * @throws {Error} - If any required fields are missing or if there is a server error.
 */
app.delete('/api/bookmarks', async (req, res) => {
    const { username, sourceUrl } = req.body;
    if (!username || !sourceUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM bookmarks WHERE username = ? AND sourceUrl = ?', [username, sourceUrl]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting bookmark:', err);
        res.status(500).json({ error: 'Failed to delete bookmark' });
    }
});

/**
 * @route GET /api/logout
 * @description Logs out the user by destroying the session.
 * @returns {object} - A success message or an error message if logout fails.
 */
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
