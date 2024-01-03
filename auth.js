const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET || "sikretSusi"; 
module.exports.createAccessToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
    };
    return jwt.sign(payload, secret, {});
};

module.exports.verify = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({ auth: "Failed. No Token" });
    }
    token = token.slice(7); 

    jwt.verify(token, secret, (err, decodedToken) => {
        if (err) {
            return res.status(403).send({ auth: "Failed", message: err.message });
        }

        if (decodedToken.someUserData !== req.someUserData) {
            return res.status(403).send({ auth: "Failed", message: "Invalid session data" });
        }

        req.user = decodedToken;
        next();
    });
};

module.exports.verifyAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).send({ auth: "Failed", message: "Action Forbidden" });
    }
};

module.exports.isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).send({ auth: "Failed", message: "Not Logged In" });
    }
};
