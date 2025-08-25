// 1. Import express
const express = require('express');
const router = express.Router();

// 2. Import controllers
const userController = require('../Controllers/userController');
const recipeController = require('../Controllers/recipeController');
const commentController = require('../Controllers/commentController');
const adminController = require('../Controllers/adminController');

// 3. Import Middlewares
const jwtMiddleware = require('../Middlewares/jwtMiddleware'); // ⚠️ check spelling & case
const multerMiddleware = require('../Middlewares/multerMiddleware');

// 4. Models (for population if needed)
const recipes = require('../Models/recipeSchema');

// ======================= AUTH ROUTES =======================
router.post('/api/register', userController.register);
router.post('/api/login', userController.login);

// ======================= RECIPE ROUTES =======================

// Add recipe
router.post(
  '/api/addRecipe',
  jwtMiddleware,
  multerMiddleware.single('recipeImg'),
  recipeController.addRecipe
);

// Get all recipes
router.get('/api/getAllRecipes', jwtMiddleware, recipeController.getAllRecipes);

// Edit recipe
router.put(
  '/api/editRecipe/:recipeId',
  jwtMiddleware,
  multerMiddleware.single('recipeImg'),
  recipeController.editRecipe
);

// Delete recipe
router.delete('/api/deleteRecipe/:recipeId', jwtMiddleware, recipeController.deleteRecipe);

// Generate PDFs
router.post('/api/generate-pdf', recipeController.generatePDF);
router.post('/api/generate-Cpdf', recipeController.generatePdf);

// Share recipe link
router.post('/api/share-recipe', jwtMiddleware, recipeController.generateShareableLink);

// Recipes with user details
router.get('/api/recipes-with-users', async (req, res) => {
  try {
    const Recipes = await recipes.find().populate('userID', 'username email');
    res.status(200).json(Recipes);
  } catch (err) {
    console.error('Error fetching recipes with users:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// ======================= COLLECTION ROUTES =======================
router.post('/api/collections', jwtMiddleware, recipeController.createCollection);
router.get('/api/get-collections', jwtMiddleware, recipeController.getUserCollections);
router.delete('/api/collections/:collectionId', jwtMiddleware, recipeController.deleteCollection);

// ======================= COMMENT ROUTES =======================
router.post('/api/addComment', jwtMiddleware, commentController.addComment);
router.get('/api/comments/:recipeId', commentController.getCommentsByRecipe);
router.delete('/api/comments/:commentId', jwtMiddleware, commentController.deleteComment);

// ======================= ADMIN ROUTES =======================
router.post('/api/admin/login', adminController.adminLogin);
router.get('/api/recipe-with-users', adminController.getUsers);
router.delete('/api/deleteUser/:userID', jwtMiddleware, adminController.deleteUser);

// ======================= EXPORT =======================
module.exports = router;
