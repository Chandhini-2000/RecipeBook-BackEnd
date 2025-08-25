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

// Models
const Recipe = require('../Models/recipeSchema');

// =======================
// AUTH ROUTES
// =======================
router.post('/api/register', userController.register);
router.post('/api/login', userController.login);

// =======================
// RECIPE ROUTES
// =======================
router.post(
  '/api/addRecipe',
  jwtMiddleware,
  multerMiddleware.single('recipeImg'),
  recipeController.addRecipe
);

router.get('/api/getAllRecipes', jwtMiddleware, recipeController.getAllRecipes);

router.put(
  '/api/editRecipe/:id',
  jwtMiddleware,
  multerMiddleware.single('recipeImg'),
  recipeController.editRecipe
);

router.delete('/api/deleteRecipe/:recipeId', jwtMiddleware, recipeController.deleteRecipe);

router.post('/api/generate-pdf', recipeController.generatePDF);

router.post('/api/share-recipe', jwtMiddleware, recipeController.generateShareableLink);

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
router.post('/api/collections', jwtMiddleware, recipeController.createCollection);
router.get('/api/get-collections', jwtMiddleware, recipeController.getUserCollections);
router.delete('/api/collections/:id', jwtMiddleware, recipeController.deleteCollection);

// =======================
// COMMENT ROUTES
// =======================
router.post('/api/addComment', jwtMiddleware, commentController.addComment);
router.get('/api/comments/:recipeId', commentController.getCommentsByRecipe);
router.delete('/api/comments/:commentId', jwtMiddleware, commentController.deleteComment);

// =======================
// ADMIN ROUTES
// =======================
router.post('/api/admin/login', adminController.adminLogin);
router.get('/api/recipe-with-users', adminController.getUsers);
router.delete('/api/deleteUser/:userID', jwtMiddleware, adminController.deleteUser);

module.exports = router;
