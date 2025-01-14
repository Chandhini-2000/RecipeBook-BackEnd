const multer = require('multer');

// Configure the storage for multer
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './Uploads'); // Directory where files will be stored
    },
    filename: (req, file, callback) => {
        callback(null, `image-${Date.now()}-${file.originalname}`); // Ensure unique filenames
    }
});

// Create multer instance with the configured storage
const multerMiddleware = multer({
    storage: storage
});

module.exports = multerMiddleware;
