const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * The owner/admin password lives only in Render's environment variables
 * (ADMIN_PASSWORD) - never in source code - the same way MONGODB_URI and
 * JWT_SECRET are handled. This compares in constant time to avoid leaking
 * timing information about how much of the password matched.
 */
function checkAdminPassword(candidate) {
    const real = process.env.ADMIN_PASSWORD || "";
    if (!real) return false;

    const a = Buffer.from(String(candidate || ""));
    const b = Buffer.from(real);
    if (a.length !== b.length) {
        // still run a comparison so failure timing doesn't depend on length
        crypto.timingSafeEqual(Buffer.alloc(b.length), Buffer.alloc(b.length));
        return false;
    }
    return crypto.timingSafeEqual(a, b);
}

function signAdminToken() {
    return jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "12h" });
}

/** Express middleware protecting every /api/admin/* route. */
function requireAdmin(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing admin token." });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role !== "admin") return res.status(403).json({ error: "Not an admin token." });
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid or expired admin session." });
    }
}

module.exports = { checkAdminPassword, signAdminToken, requireAdmin };
