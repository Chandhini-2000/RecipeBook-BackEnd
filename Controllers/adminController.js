const jwt = require("jsonwebtoken");
const users = require('../Models/userSchema');
const recipes = require('../Models/recipeSchema'); // Assuming recipeSchema is your mongoose model

// Dummy admin credentials
const adminCredentials = {
  username: "admin",
  password: "admin123",
};

exports.adminLogin = (req, res) => {
  const { username, password } = req.body;
console.log(req.body);

  if (
    username === adminCredentials.username &&
    password === adminCredentials.password
  ) {
    // Generate a JWT token for authentication
    const token = jwt.sign(
      { role: "admin", username },
      process.env.jwtToken,
      { expiresIn: "1h" }
    );
    return res.status(200).json({ message: "Login successful", token });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
};
// Get all users (Admin only)
exports.getUsers = async (req, res) => {
    try {
      const allUsers = await users.find(); // Fetch all users
      return res.status(200).json(allUsers); // Send the users list
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Error fetching users" });
    }
  };
 
// Get all user actions (e.g., added recipes)
exports.getActions = async (req, res) => {
    try {
      const actions = await recipes.find().populate('userID', 'username email'); // Populate user details
      return res.status(200).json(actions); // Send the list of recipes with user details
    } catch (error) {
      console.error("Error fetching actions:", error);
      return res.status(500).json({ message: "Error fetching actions" });
    }
  };

 // Delete a user by ID (admin only)
 exports.deleteUser = async (req, res) => {
  try {
    const { userID } = req.params; // Extract userID from the request parameters
    console.log("UserID to delete:", userID);

    const deletedUser = await users.findByIdAndDelete(userID); // Find and delete the user by ID

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", deletedUser });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
