const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization header." });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.userId);
        if (!user) return res.status(401).json({ error: "Account no longer exists." });
        req.user = user;
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
}

module.exports = { requireAuth };
