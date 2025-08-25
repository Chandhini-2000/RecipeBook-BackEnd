// 1. Load .env file
require('dotenv').config();

// 2. Import express
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 3. Create an app using express
const pfServer = express();

// 4. Middleware
pfServer.use(cors());
pfServer.use(bodyParser.json()); 
pfServer.use(bodyParser.urlencoded({ extended: true }));
pfServer.use(express.json()); // Ensure JSON parsing before routes

// 5. Import database connection
require('./DB/Connection');

// 6. Import router
const router = require('./Router/router');
pfServer.use(router); // Use router

// 7. Port creation
const PORT = process.env.PORT || 4001;

// 8. App Listener
pfServer.listen(PORT, () => {
  console.log("PF Server listening on port", PORT);
});

// 9. Default Route
pfServer.get('/', (req, res) => {
  res.send("Welcome to PF Server");
});
