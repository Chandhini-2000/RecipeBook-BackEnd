const axios = require('axios');
const recipes = require('../Models/recipeSchema');
const users = require('../Models/userSchema');
const jwt = require('jsonwebtoken'); 
const Collection = require('../Models/collectionSchema');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const apiKey = 'ce1c20aa64ae41d5bbdfcfed99959c98';

// ===============================
// Spoonacular API Fetch
// ===============================
const fetchRecipeDetails = async (query) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=1&apiKey=${apiKey}`
    );

    if (response.data.results && response.data.results.length > 0) {
      const recipeId = response.data.results[0].id;
      const detailsResponse = await axios.get(
        `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`
      );
      return detailsResponse.data;
    } else {
      throw new Error('No recipes found for the given query');
    }
  } catch (error) {
    console.error('Error in fetchRecipeDetails:', error.message);
    throw new Error('Failed to fetch recipe details');
  }
};

// ===============================
// Add Recipe
// ===============================
exports.addRecipe = async (req, res) => {
  const { name, ingredients, instructions } = req.body;
  const recipeImg = req.file?.filename || null; // Safe optional chaining
  const userID = req.payload; // from JWT

  if (!recipeImg) {
    return res.status(400).json({ message: 'Image is required' });
  }

  try {
    const existingRecipe = await recipes.findOne({ name });
    if (existingRecipe) {
      return res.status(409).json({ message: 'Recipe already exists' });
    }

    const newRecipe = new recipes({
      userID,
      name,
      ingredients,
      instructions,
      recipeImg,
    });

    await newRecipe.save();
    res.status(201).json({ message: 'Recipe added successfully', recipes: newRecipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Error: ${err.message}` });
  }
};

// ===============================
// Get All Recipes
// ===============================
exports.getAllRecipes = async (req, res) => {
  try {
    const recipesList = await recipes.find();

    const recipesWithImageURL = recipesList.map(recipe => ({
      ...recipe.toObject(),
      recipeImg: recipe.recipeImg ? `http://localhost:4001/uploads/${recipe.recipeImg}` : null,
    }));

    res.status(200).json(recipesWithImageURL);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Error fetching recipes', error });
  }
};

// ===============================
// PDF Download
// ===============================
exports.generatePdf = async (req, res) => {
  const { name, ingredients = [], instructions } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Recipe name is required' });
  }

  try {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${name.replace(/\s+/g, '_')}.pdf`,
      });
      res.send(pdfBuffer);
    });

    // Write PDF content
    doc.fontSize(20).text(`Recipe: ${name}`, { align: 'center' }).moveDown();
    doc.fontSize(16).text('Ingredients:', { underline: true }).moveDown();

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      ingredients.forEach((item) => doc.fontSize(12).text(`- ${item}`));
    } else {
      doc.fontSize(12).text('No ingredients provided.');
    }

    doc.moveDown();
    doc.fontSize(16).text('Instructions:', { underline: true }).moveDown();
    doc.fontSize(12).text(instructions || 'No instructions provided.');

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
};

// ===============================
// Shareable Link
// ===============================
exports.generateShareableLink = async (req, res) => {
  const { recipeId } = req.body;

  try {
    const Recipe = await recipes.findById(recipeId);
    if (!Recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const shareableLink = `${req.protocol}://${req.get('host')}/recipes/${Recipe._id}`;
    return res.status(200).json({ link: shareableLink });
  } catch (error) {
    console.error('Error generating shareable link:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ===============================
// Delete Recipe
// ===============================
exports.deleteRecipe = async (req, res) => {
  const { recipeId } = req.params;

  try {
    const response = await recipes.findByIdAndDelete(recipeId);
    if (!response) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.status(200).json("Successfully Deleted");
  } catch (err) {
    res.status(500).json({ message: "Error deleting recipe", error: err.message });
  }
};

// ===============================
// Update Recipe
// ===============================
exports.editRecipe = async (req, res) => {
  try {
    const { name, ingredients, instructions } = req.body;
    const updatedData = { name, ingredients, instructions };

    if (req.file) {
      updatedData.recipeImg = req.file.filename;
    }

    const recipe = await recipes.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ message: 'Recipe updated successfully', recipe });
  } catch (error) {
    res.status(500).json({ message: 'Error updating recipe', error });
  }
};

// ===============================
// Create Collection
// ===============================
exports.createCollection = async (req, res) => {
  const { name, recipes: recipeList } = req.body;
  const userID = req.payload;

  try {
    if (!name || !userID || !Array.isArray(recipeList) || recipeList.length === 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const userExists = await users.findById(userID);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newCollection = new Collection({ name, userID, recipes: recipeList });
    await newCollection.save();

    res.status(201).json({ message: 'Collection created successfully', collections: newCollection });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// ===============================
// Get User Collections
// ===============================
exports.getUserCollections = async (req, res) => {
  try {
    const userID = req.payload;
    const collections = await Collection.find({ userID });
    res.status(200).json(collections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
};

// ===============================
// Delete Collection
// ===============================
exports.deleteCollection = async (req, res) => {
  const { collectionId } = req.params;

  try {
    const result = await Collection.findByIdAndDelete(collectionId);

    if (!result) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.status(200).json({ message: 'Collection deleted successfully.' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Server error, try again later.', error: error.message });
  }
};
