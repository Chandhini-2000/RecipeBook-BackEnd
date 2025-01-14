const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipes: [
    {
      type: Number, // Assuming recipe IDs are numeric
      required: true,
    },
  ]
});

const collections = mongoose.model('collections', collectionSchema);

module.exports=collections