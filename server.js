import express from 'express';
import fetch from 'node-fetch';
import path from 'path';

const app = express();
const port = 3000;

const SPOONACULAR_API_KEY = 'a1f25964afb54f2094847dea22a4b27f';

app.use(express.static('public'));

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
    const recipeId = req.params.id; // This grabs the 'id' from the URL
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});