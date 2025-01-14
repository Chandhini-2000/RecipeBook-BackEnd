const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "users", 
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  ingredients: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  recipeImg: {
    type: String, 
    required: true
},
});

const recipes = mongoose.model('recipes', recipeSchema);
module.exports = recipes;


