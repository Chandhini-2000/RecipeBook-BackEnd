// src/Routes/router.js
const express = require('express');
const router = express.Router();

// Controllers
const userController = require('../Controllers/userController');
const recipeController = require('../Controllers/recipeController');
const commentController = require('../Controllers/commentController');
const adminController = require('../Controllers/adminController');

// Middlewares
const jwtMiddleware = require('../Middlewares/jwtMiddleware');
const multerMiddleware = require('../Middlewares/multerMiddleware');

// Models (if needed in routes, e.g., optional route)
const Recipe = require('../Models/recipeSchema');

// =======================
// AUTH ROUTES
// =======================
router.post('/api/register', userController.register);
router.post('/api/login', userController.login);

// =======================
// ADMIN ROUTES
// =======================
router.post('/api/admin/login', adminController.adminLogin);
router.get('/api/admin/users', jwtMiddleware, adminController.getUsers);
router.delete('/api/admin/users/:userID', jwtMiddleware, adminController.deleteUser);

// =======================
// RECIPE ROUTES
// =======================
// Create a new recipe
router.post(
  '/api/recipes',
  jwtMiddleware,
  multerMiddleware.single('recipeImg'),
  recipeController.addRecipe
);

// Get all recipes
router.get('/api/recipes', jwtMiddleware, recipeController.getAllRecipes);

// Edit a recipe by ID
router.put(
  '/api/recipes/:id',
  jwtMiddleware,
  multerMiddleware.single('recipeImg'),
  recipeController.editRecipe
);

// Delete a recipe by ID
router.delete('/api/recipes/:id', jwtMiddleware, recipeController.deleteRecipe);

// Generate PDF for a recipe
router.post('/api/recipes/:id/generatePdf', jwtMiddleware, recipeController.generatePDF);

// Share a recipe link
router.post('/api/recipes/:id/share', jwtMiddleware, recipeController.generateShareableLink);

// Optional: get recipes with user info (authenticated)
router.get('/api/recipes-with-users', jwtMiddleware, async (req, res) => {
  try {
    const recipesList = await Recipe.find().populate('userID', 'username email');
    res.status(200).json(recipesList);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// =======================
// COLLECTION ROUTES
// =======================
// Create a collection
router.post('/api/collections', jwtMiddleware, recipeController.createCollection);

// Get all collections for authenticated user
router.get('/api/collections', jwtMiddleware, recipeController.getUserCollections);

// Delete a collection by ID
router.delete('/api/collections/:id', jwtMiddleware, recipeController.deleteCollection);

// =======================
// COMMENT ROUTES
// =======================
// Add a comment to a recipe
router.post('/api/comments', jwtMiddleware, commentController.addComment);

// Get comments for a recipe
router.get('/api/comments/:recipeId', commentController.getCommentsByRecipe);

// Delete a comment by ID
router.delete('/api/comments/:commentId', jwtMiddleware, commentController.deleteComment);

module.exports = router;
