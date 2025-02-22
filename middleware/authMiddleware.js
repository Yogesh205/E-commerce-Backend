const jwt = require("jsonwebtoken");

const ensureAuthenticated = (req, res, next) => {
    // ✅ Try to get token from Cookie or Authorization Header
    let token = req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized - No Token Found" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ Attach user data to request
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized - Invalid or Expired Token" });
    }
};

module.exports = ensureAuthenticated;
