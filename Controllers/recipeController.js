const axios = require('axios');
//const Recipe = require('../Models/recipeSchema');
const recipes = require('../Models/recipeSchema'); // Adjust the path as necessary
const users = require('../Models/userSchema');
const jwt = require('jsonwebtoken'); 
const apiKey = 'ce1c20aa64ae41d5bbdfcfed99959c98';
const Collection = require('../Models/collectionSchema');

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



exports.addRecipe = async (req, res) => {
  const { name, ingredients, instructions } = req.body;
  console.log(req.body);
  
  const recipeImg = req.file ? req.file.filename : null; // Extract filename
  const userID = req.payload; // Get user ID from JWT

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





exports.getAllRecipes = async (req, res) => {
  try {
    const recipesList = await recipes.find();  // Fetch all recipes from the database
  console.log(recipesList);
  
    // Add full image URL to each recipe
    const recipesWithImageURL = recipesList.map(recipe => {
      console.log('Recipe Image Field:', recipe.recipeImg);  // Log the actual value of recipeImg
      return {
        ...recipe.toObject(),
        recipeImg: recipe.recipeImg ? `http://localhost:4001/uploads/${recipe.recipeImg}` : null,  // Use lowercase 'uploads'
      };
    });
    console.log(recipesWithImageURL);
    

    res.status(200).json(recipesWithImageURL);  // Return the updated recipes list with full image URL
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Error fetching recipes', error });
  }
};


//pdf download
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generatePDF = (req, res) => {
  const { name, ingredients, instructions } = req.body;

  if (!name || !ingredients || !instructions) {
    return res.status(400).json({ message: 'Incomplete recipe data' });
  }

  const doc = new PDFDocument();
  const pdfPath = path.join(__dirname, `${name.replace(/\s+/g, '_')}.pdf`);

  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  doc.fontSize(18).text(`Recipe: ${name}`, { underline: true });
  doc.moveDown();
  doc.fontSize(14).text('Ingredients:', { underline: true });
  doc.fontSize(12).text(ingredients);
  doc.moveDown();
  doc.fontSize(14).text('Instructions:', { underline: true });
  doc.fontSize(12).text(instructions);
  doc.end();

  writeStream.on('finish', () => {
    res.download(pdfPath, `${name.replace(/\s+/g, '_')}.pdf`, (err) => {
      if (err) {
        console.error('Error during PDF download:', err);
      }
      fs.unlinkSync(pdfPath);
    });
  });
};

//sharable link
// Function to generate shareable link for a recipe
exports.generateShareableLink = async (req, res) => {
  const { recipeId } = req.body;  // Expect recipeId from frontend
  console.log(req.body);

  try {
    // Find the recipe by ID
    const Recipe = await recipes.findById(recipeId);

    if (!Recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Generate a unique shareable URL (this is an example, can be customized)
    const shareableLink = `${req.protocol}://${req.get('host')}/recipes/${Recipe._id}`;  // Using Recipe._id to generate the link

    // Send the shareable link as a response
    return res.status(200).json({ link: shareableLink });
  } catch (error) {
    console.error('Error generating shareable link:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

//delete 
exports.deleteRecipe=async(req,res)=>{
  console.log("Inside delete");
  
  const {recipeId}= req.params
  console.log(recipeId);
  
  try{
    const response = await recipes.findByIdAndDelete(recipeId);

      res.status(200).json("Successfully Deleted")
  }
  catch(err){
      res.status(402).json("Error" +err)
  }
}

// Update a recipe
exports.editRecipe = async (req, res) => {
  try {
    const { name, ingredients, instructions } = req.body;
    const updatedData = {
       name,
      ingredients,
      instructions,
    };

    // If a new image is uploaded
    if (req.file) {
      updatedData.recipeImg = req.file.filename;
    }

    const recipe = await recipes.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ message: 'Recipe updated successfully', recipe });
  } catch (error) {
    res.status(500).json({ message: 'Error updating recipe', error });
  }
};


// Create a new collection
exports.createCollection = async (req, res) => {
  const { name, recipes } = req.body;
  console.log("data",req.body);
  const userID=req.payload;
  console.log("User found in",userID);
  


  try {
    // Validate input
    if (!name || !userID || !recipes || recipes.length === 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // Check if user exists
    const userExists = await users.findById(userID);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new collection
    const newCollection = new Collection({
      name,
      userID,
      recipes,
    });

    await newCollection.save();

    res.status(201).json({ message: 'Collection created successfully', collections: newCollection });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};


exports.getUserCollections = async (req, res) => {
  try {
    // Extract userID from the token payload
    const userID = req.payload; // Assuming JWT middleware attaches user info to `req.user`
    const collections = await Collection.find({ userID });

    res.status(200).json(collections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
};

exports.deleteCollection = async (req, res) => {
  const { collectionId } = req.params;
  const userId = req.payload;

  try {
    const result = await Collection.findByIdAndDelete(collectionId);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Collection not found or not authorized to delete.' });
    }
    res.status(200).json({ message: 'Collection deleted successfully.' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Server error, try again later.', error: error.message });
  }
  
};

// Backend: recipeController.js
const PdfDocument = require('pdfkit');

exports.generatePdf = async (req, res) => {
  const { name, ingredients = [], instructions } = req.body; // Default ingredients to an empty array
  console.log(req.body);

  try {
    const doc = new PdfDocument();  // Use PdfDocument here instead of PDFDocument

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

    // Write content to PDF
    doc.fontSize(20).text(`Recipe: ${name}`, { align: 'center' }).moveDown();
    doc.fontSize(16).text('Ingredients:', { underline: true }).moveDown();
    
    // Ensure ingredients is an array
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      ingredients.forEach((item) => {
        doc.fontSize(12).text(`- ${item}`);
      });
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
