// 1. Load .env file
require('dotenv').config();

// 2. Import express
const express = require('express');
const bodyParser = require('body-parser');
// 3. Create an app using express
const pfServer = express();
//const adminRoutes = require("./routes/adminRoutes");
// 4. Import cors
const cors = require('cors');
pfServer.use(cors());
pfServer.use(bodyParser.json()); // Parse JSON request body
pfServer.use(bodyParser.urlencoded({ extended: true }));
// 5. Middleware for JSON parsing
pfServer.use(express.json()); // Ensure this is before your routes
//pfServer.use("/api/admin", adminRoutes);
// 6. Import database connection
require('./DB/Connection');
//pfserver.use(applicationMiddlewares)
// 7. Import router
const router = require('./Router/router');


pfServer.use(router); // Use the router after defining JSON parsing middleware

// 8. Port creation
const PORT = process.env.PORT || 4001; // Fixed order to prefer environment variable over hardcoded value

// 9. App Listener
pfServer.listen(PORT, () => {
    console.log("pf Server listening on port", PORT); // Removed unnecessary + sign in console log
});





// 10. Route
pfServer.get('/', (req, res) => {
    res.send("Welcome to pfserver");
});
