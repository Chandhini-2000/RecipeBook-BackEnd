// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },

});

module.exports = mongoose.model('Comment', commentSchema);
