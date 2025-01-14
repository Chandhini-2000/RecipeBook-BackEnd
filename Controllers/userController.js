const bcrypt = require('bcrypt'); // Import bcrypt
const users = require('../Models/userSchema'); // Import user schema
const jwt = require('jsonwebtoken'); // Ensure jwt is imported

exports.register = async (req, res) => {
    console.log("Inside register function");
    const { username, email, password } = req.body;

    try {
        const userDetails = await users.findOne({ email });
        if (userDetails) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new users({ username, email, password: hashedPassword });
        await newUser.save();

        return res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Error in register:", error);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
};

exports.login = async (req, res) => {
    console.log("Inside login function");
    const { email, password } = req.body;

    try {
        const userData = await users.findOne({email})
        if(userData){
            //token generate
            const token = jwt.sign({userID:userData._id}, process.env.jwtToken)

            res.status(200).json({user:userData,token})
        }
        else{
            res.status(401).json("Invalid Email or password")
        }
    } 
    
    catch (error) {
        res.status(406).json(err)
    }

};
