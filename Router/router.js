// 1. Import express
const express = require('express')
const { generatePDF } = require('../Controllers/recipeController');
const { generatePdf } = require('../Controllers/recipeController');
const { createCollection } = require('../Controllers/recipeController');
const { deleteCollection } = require('../Controllers/recipeController');
const commentController = require('../Controllers/commentController');
// 2. Create router from express
const router = express.Router()

// 3. Import controllers and middleware
const userController = require('../Controllers/userController')
//const recipeController = require('../Controllers/recipeController')
//const jwtMiddleware = require('../Middlewares/jwtMiddleware')
const multerMiddleware = require('../Middlewares/multerMiddleware') // Make sure this is imported correctly
const recipeController = require('../Controllers/recipeController');
const jwtMiddleware = require('../Middlewares/jwtMIddleware');
const adminController = require("../Controllers/adminController");
// 4. Create routes for each request
const users = require('../Models/userSchema'); // Adjust the path if necessary


const recipes = require('../Models/recipeSchema'); // Adjust the path if necessary

// 4.1 Register request: http://localhost:4000/api/register
router.post('/api/register', userController.register)

// 4.2 Login request: http://localhost:4000/api/login
router.post('/api/login', userController.login)

// Add a recipe to collection
// Define the route


router.post('/api/addRecipe', jwtMiddleware,  multerMiddleware.single('recipeImg'), recipeController.addRecipe);
router.get('/api/getAllRecipes', jwtMiddleware,  multerMiddleware.single('recipeImg'), recipeController.getAllRecipes);

// Get all recipes in the user's collection
//router.get('/get-collection', protect, recipeController.getCollection);



  
  //pdf
  router.post('/api/generate-pdf', generatePDF);
  router.post('/api/generate-Cpdf', generatePdf);

  //sharelink
  router.post('/api/share-recipe', jwtMiddleware,recipeController.generateShareableLink);

  router.delete('/api/deleteRecipe/:recipeId',jwtMiddleware, recipeController.deleteRecipe);
  router.put('/api/editRecipe/:recipeId', multerMiddleware.single('recipeImg'), recipeController.editRecipe);

 


// Route for getting all actions (user actions like adding recipes)
// Endpoint to get recipes with user details
router.get('/api/recipes-with-users', async (req, res) => {
  try {
    const Recipes = await recipes.find().populate('userID', 'username email');
    res.status(200).json(Recipes);
  } catch (err) {
    console.error('Error fetching recipes with users:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});


router.post('/api/admin/login', adminController.adminLogin);

// Route for getting all users (Admin only)
router.get('/api/recipe-with-users', adminController.getUsers);

router.delete('/api/deleteUser/:userID', jwtMiddleware, adminController.deleteUser);

router.post('/api/collections',jwtMiddleware,recipeController.createCollection);


// Route to fetch collections (userID is derived from token)
router.get('/api/get-collections', jwtMiddleware, recipeController.getUserCollections);

// Delete collection route
router.delete('/api/collections/:collectionId',jwtMiddleware, recipeController.deleteCollection);

// Route to add a comment
router.post('/api/addComment',jwtMiddleware,commentController.addComment);

// Route to get all comments for a specific recipe
router.get('/:recipeId', commentController.getCommentsByRecipe);

// Route to delete a comment
router.delete('/:commentId', commentController.deleteComment);


// Export the router
module.exports = router
