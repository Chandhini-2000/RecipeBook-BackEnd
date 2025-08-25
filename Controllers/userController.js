const bcrypt = require('bcryptjs'); // Import bcrypt
const users = require('../Models/userSchema'); // Import user schema
const jwt = require('jsonwebtoken'); // Import jwt

// -------------------- REGISTER --------------------
exports.register = async (req, res) => {
    console.log("Inside register function");
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const userDetails = await users.findOne({ email });
        if (userDetails) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new users({ username, email, password: hashedPassword });
        await newUser.save();

        return res.status(201).json({ 
            message: "User registered successfully", 
            user: newUser 
        });
    } catch (error) {
        console.error("Error in register:", error);
        return res.status(500).json({ 
            message: "Server error. Please try again later." 
        });
    }
};

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
    console.log("Inside login function");
    const { email, password } = req.body;

    try {
        const userData = await users.findOne({ email });
        
        if (!userData) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare entered password with hashed password
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { userID: userData._id },
            process.env.JWT_SECRET,   // ✅ must match your .env key
            { expiresIn: "1h" }       // optional expiry
        );

        return res.status(200).json({ 
            message: "Login successful",
            user: userData, 
            token 
        });
    } catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({ 
            message: "Server error. Please try again later." 
        });
    }
};
