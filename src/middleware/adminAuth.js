const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * Admin credentials live only in environment variables (ADMIN_USERNAME /
 * ADMIN_PASSWORD) — never in source code — the same way MONGODB_URI and
 * JWT_SECRET are handled.
 *
 * Defaults: username "Twicefear". Password must be set in env or login fails.
 * Password compare is constant-time to avoid leaking timing info.
 */
function checkAdminCredentials(username, password) {
    const realUser = (process.env.ADMIN_USERNAME || "Twicefear").trim();
    const realPass = process.env.ADMIN_PASSWORD || "";

    if (!realPass) return false;

    const userOk =
        typeof username === "string" &&
        username.trim().toLowerCase() === realUser.toLowerCase();

    const a = Buffer.from(String(password || ""));
    const b = Buffer.from(realPass);
    let passOk = false;
    if (a.length === b.length) {
        passOk = crypto.timingSafeEqual(a, b);
    } else {
        // still run a comparison so failure timing doesn't depend on length
        crypto.timingSafeEqual(Buffer.alloc(b.length), Buffer.alloc(b.length));
        passOk = false;
    }

    return userOk && passOk;
}

/** @deprecated use checkAdminCredentials — kept for any leftover callers */
function checkAdminPassword(candidate) {
    return checkAdminCredentials(process.env.ADMIN_USERNAME || "Twicefear", candidate);
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

module.exports = { checkAdminCredentials, checkAdminPassword, signAdminToken, requireAdmin };
