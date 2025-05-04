import express from 'express';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

const dbPromise = open({
    filename: './database/users.db',
    driver: sqlite3.Database
});

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
        console.log('Users table created or already exists.');
    } catch (err) {
        console.error('Error creating table:', err);
    }
})();

const SPOONACULAR_API_KEY = 'a1f25964afb54f2094847dea22a4b27f';

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

app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.json({ username: null });
    }
});

app.get('/', (req, res) => {
    const username = req.session.user || 'Guest';
    res.render('home', { username }); 
});

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.json({ username: null });
    }
});

  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.status(200).send('Logged out successfully');
    });
});

// Endpoint to fetch bookmarks for the logged-in user
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


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});