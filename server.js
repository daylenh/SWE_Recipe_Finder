/**
 * @fileoverview Server-side code for a recipe application using Express.js.
 */
import express from 'express';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import session from 'express-session';

const app = express();
const port = 3000;
const SPOONACULAR_API_KEY = '0dc9b19d5d3a4a28a9e2f880dff28268';

//Middleware to serve static files and parse JSON and URL-encoded data
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Configure session management
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

//Database setup using SQLite
const dbPromise = open({
    filename: './database/users.db',
    driver: sqlite3.Database
});

//Create tables for users and bookmarks if they do not exist
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

        console.log('Tables created or already exists.');
    } catch (err) {
        console.error('Error creating table:', err);
    }
})();

/**
 * API endpoint to search for recipes using the Spoonacular API.
 * 
 * @param {string} query - The search term for recipes.
 * @returns {Object} - A JSON object containing an array of recipes.
 * @throws {Error} - If the Spoonacular API request fails or returns no results.
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
 * API endpoint to fetch detailed information about a specific recipe by its ID.
 * 
 * @param {string} id - The ID of the recipe to fetch.
 * @returns {Object} - A JSON object containing detailed information about the recipe.
 * @throws {Error} - If the Spoonacular API request fails or returns an error.
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
 * API endpoint to register a new user.
 * 
 * @param {Object} req.body - The username and password for the new user.
 * @returns {Object} - A JSON object indicating success or failure of the registration.
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
 * API endpoint to log in a user.
 * 
 * @param {Object} req.body - The username and password for the user.
 * @returns {Object} - A JSON object indicating success or failure of the login.
 * @throws {Error} - If the credentials are invalid or if there is a server error.
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
 * API endpoint to check if a user session is active.
 * 
 * @peturns {Object} - A JSON object containing the username if logged in, or null if not.
 * @throws {Error} - If there is an error checking the session.
 */
app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.json({ username: null });
    }
});

/**
 * Serves the home page of the application. to the user 
 * @param {Object} req - The request object containing session information.
 * @param {Object} res - The response object to send the home.html file.
 * @returns {Object} - the home.html file to user 
 */
app.get('/', (req, res) => {
    const username = req.session.user || 'Guest';
    res.sendFile(path.join(process.cwd(), 'public', 'home.html'));  
});

/**
 * API endpoint to get the current logged-in user.
 * @param {Object} req - The request object containing session information.
 * @param {Object} res - The response object to send the username.
 * @return {Object} - A JSON object containing the username if logged in, or null if not.
 */
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.json({ username: null });
    }
});

/**
 * API endpoint for logging out a user.
 * @param {Object} req - The request object containing session information.
 * @param {Object} res - The response object to send the logout status.
 * @return {Object} - A JSON object indicating success or failure of the logout.
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
 * API endpoint fetching bookmarks for the logged-in user.
 * @param {Object} req - The request object containing session information.
 * @param {Object} res - The response object to send the bookmarks.
 * @return {Object} - A JSON object containing an array of bookmarks for the user.
 * @throws {Error} - If the user is not logged in or if there is a server error.
 */
app.get('/api/bookmarks', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const username = req.session.user;
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
 * API endpoint to add a bookmark for a recipe.
 * @param {Object} req.body - The bookmark data including username, title, image, and sourceUrl.
 * @return {Object} - A JSON object indicating success or failure of the bookmark addition.
 * @throws {Error} - If the user is not logged in, or if there is a server error.
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
 * API endpoint to delete a  bookmark.
 * @param {Object} req.body - The bookmark data including username and sourceUrl.
 * @return {Object} - A JSON object indicating success or failure of the bookmark deletion.
 * @throws {Error} - If the required fields are missing or if there is a server error.
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
 * Starts the Express server and listens on the specified port.
 * @param {number} port - The port number on which the server will listen.
 */
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});