const axios = require("axios");
const recipes = require("../Models/recipeSchema");
const users = require("../Models/userSchema");
const Collection = require("../Models/collectionSchema");
const PDFDocument = require("pdfkit");

const apiKey = process.env.SPOONACULAR_API_KEY || "ce1c20aa64ae41d5bbdfcfed99959c98";

// ===============================
// Fetch Recipe Details from Spoonacular
// ===============================
exports.fetchRecipeDetails = async (query) => {
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
      throw new Error("No recipes found for the given query");
    }
  } catch (error) {
    console.error("Error in fetchRecipeDetails:", error.message);
    throw new Error("Failed to fetch recipe details");
  }
};

// ===============================
// Add Recipe
// ===============================
exports.addRecipe = async (req, res) => {
  const { name, ingredients, instructions } = req.body;
  const recipeImg = req.file?.filename || null;
  const userID = req.user?.id; // <-- corrected

  if (!userID) return res.status(401).json({ message: "Please login" });
  if (!recipeImg) return res.status(400).json({ message: "Image is required" });

  try {
    const existingRecipe = await recipes.findOne({ name });
    if (existingRecipe)
      return res.status(409).json({ message: "Recipe already exists" });

    const newRecipe = new recipes({ userID, name, ingredients, instructions, recipeImg });
    await newRecipe.save();

    res.status(201).json({ message: "Recipe added successfully", recipe: newRecipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding recipe", error: err.message });
  }
};

// ===============================
// Get All Recipes
// ===============================
exports.getAllRecipes = async (req, res) => {
  try {
    const recipesList = await recipes.find();
    const recipesWithImageURL = recipesList.map((recipe) => ({
      ...recipe.toObject(),
      recipeImg: recipe.recipeImg
        ? `${req.protocol}://${req.get("host")}/uploads/${recipe.recipeImg}`
        : null,
    }));

    res.status(200).json(recipesWithImageURL);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Error fetching recipes", error: error.message });
  }
};

// ===============================
// Generate PDF
// ===============================
exports.generatePDF = async (req, res) => {
  const { name, ingredients = [], instructions } = req.body;

  if (!name) return res.status(400).json({ message: "Recipe name is required" });

  try {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${name.replace(/\s+/g, "_")}.pdf`,
      });
      res.send(pdfBuffer);
    });

    doc.fontSize(20).text(`Recipe: ${name}`, { align: "center" }).moveDown();
    doc.fontSize(16).text("Ingredients:", { underline: true }).moveDown();

    if (ingredients.length > 0) ingredients.forEach((item) => doc.fontSize(12).text(`- ${item}`));
    else doc.fontSize(12).text("No ingredients provided.");

    doc.moveDown();
    doc.fontSize(16).text("Instructions:", { underline: true }).moveDown();
    doc.fontSize(12).text(instructions || "No instructions provided.");

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF", error: error.message });
  }
};

// ===============================
// Shareable Link
// ===============================
exports.generateShareableLink = async (req, res) => {
  const { recipeId } = req.body;

  try {
    const recipe = await recipes.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const shareableLink = `${req.protocol}://${req.get("host")}/recipes/${recipe._id}`;
    res.status(200).json({ link: shareableLink });
  } catch (error) {
    console.error("Error generating shareable link:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===============================
// Edit Recipe
// ===============================
exports.editRecipe = async (req, res) => {
  try {
    const { name, ingredients, instructions } = req.body;
    const updatedData = { name, ingredients, instructions };
    if (req.file) updatedData.recipeImg = req.file.filename;

    const recipe = await recipes.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    res.status(200).json({ message: "Recipe updated successfully", recipe });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ message: "Error updating recipe", error: error.message });
  }
};

// ===============================
// Delete Recipe
// ===============================
exports.deleteRecipe = async (req, res) => {
  const { recipeId } = req.params;

  try {
    const deleted = await recipes.findByIdAndDelete(recipeId);
    if (!deleted) return res.status(404).json({ message: "Recipe not found" });

    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ message: "Error deleting recipe", error: error.message });
  }
};

// ===============================
// Create Collection
// ===============================
exports.createCollection = async (req, res) => {
  const { name, recipes: recipeList = [] } = req.body;
  const userID = req.user?.id; // <-- corrected

  if (!userID) return res.status(401).json({ message: "Please login" });
  if (!name) return res.status(400).json({ message: "Collection name is required" });

  try {
    const userExists = await users.findById(userID);
    if (!userExists) return res.status(404).json({ message: "User not found" });

    const newCollection = new Collection({ name, userID, recipes: recipeList });
    await newCollection.save();

    res.status(201).json({ message: "Collection created successfully", collection: newCollection });
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ===============================
// Get User Collections
// ===============================
exports.getUserCollections = async (req, res) => {
  const userID = req.user?.id; // <-- corrected

  if (!userID) return res.status(401).json({ message: "Please login" });

  try {
    const collections = await Collection.find({ userID });
    res.status(200).json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ message: "Failed to fetch collections", error: error.message });
  }
};

// ===============================
// Delete Collection
// ===============================
exports.deleteCollection = async (req, res) => {
  const { id } = req.params;
  const userID = req.user?.id; // <-- corrected

  if (!userID) return res.status(401).json({ message: "Please login" });

  try {
    const deleted = await Collection.findOneAndDelete({ _id: id, userID });
    if (!deleted) return res.status(404).json({ message: "Collection not found" });

    res.status(200).json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
