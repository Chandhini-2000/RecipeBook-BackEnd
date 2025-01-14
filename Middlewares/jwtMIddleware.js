const jwt = require('jsonwebtoken');

const jwtMiddleware = (req, res, next) => {
    console.log("Inside jwt");
    try {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7); // Extract the token after 'Bearer '
            console.log(token);

            const jwtVerification = jwt.verify(token, process.env.jwtToken);
            console.log("code:",jwtVerification);

            req.payload = jwtVerification.userID;
            console.log(req.payload);

            next();
        } else {
            res.status(401).json("Please provide the token");
        }
    } catch (err) {
        res.status(404).json("Please login");
    }
};

module.exports = jwtMiddleware;
