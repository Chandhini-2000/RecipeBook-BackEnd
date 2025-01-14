// controllers/commentController.js
const Comment = require('../Models/commentSchema');
const users = require('../Models/userSchema');
const jwt = require('jsonwebtoken'); 


exports.addComment = async (req, res) => {
  try {
    const { recipeId, text } = req.body;
    console.log("Request Body:", recipeId, text);

    // Check if the payload exists and contains a valid user ID
    const userId = req.payload;
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized request, user ID missing" });
    }

    // Validate input
    if (!recipeId || !text) {
      return res.status(400).json({ error: "Both recipeId and text are required" });
    }

    // Create a new comment
    const comment = new Comment({ recipeId, userId, text });
    await comment.save();

    res.status(201).json(comment); // Send back the created comment
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment", details: error.message });
  }
};


// Get all comments for a specific recipe
exports.getCommentsByRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const comments = await Comment.find({ recipeId }).populate('userId', 'username'); // Populates username field from User
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment', details: error.message });
  }
};
