const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { offlineUUID } = require("../utils/uuid");
const { recordLogin, recordNewUser } = require("../utils/dailyStats");

const router = express.Router();
router.use(express.json());

const USERNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;

function userPayload(user) {
    return {
        username: user.username,
        uuid: user.uuid,
        coins: user.coins,
        role: user.role,
        permissions: user.permissions,
        displayName: user.displayName || user.username,
        bio: user.bio || "",
        description: user.description || "",
        skinModel: user.skinModel || "classic",
        hasSkin: !!user.skinPngBase64,
        hasLogo: !!user.logoPngBase64,
    };
}

router.post("/register", async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({
            error: "Username must be 3-16 characters: letters, numbers, underscore only.",
        });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken." });

    const passwordHash = await bcrypt.hash(password, 10);
    const uuid = offlineUUID(username);

    const user = await User.create({
        username,
        uuid,
        passwordHash,
        coins: 100,
        displayName: username,
    });
    recordNewUser();
    recordLogin(username);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({
        token,
        user: userPayload(user),
    });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};

    let user = await User.findOne({ username });

    // (The old hardcoded "Twicefear" backdoor was removed: it auto-created a
    //  superadmin account with a default password for anyone who typed that
    //  username. Admins now log in normally + pass the security code.)
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid username or password." });
    }

    if (user.isBanned) {
        if (user.banExpiresAt && user.banExpiresAt > new Date()) {
            const hoursLeft = Math.ceil((user.banExpiresAt - new Date()) / (1000 * 60 * 60));
            return res.status(403).json({
                error: `Your account is temporarily banned for ${hoursLeft} more hour(s). Reason: ${user.banReason}`,
            });
        } else if (!user.banExpiresAt) {
            return res.status(403).json({
                error: `Your account is permanently banned. Reason: ${user.banReason}`,
            });
        }
        user.isBanned = false;
        user.bannedAt = null;
        user.bannedBy = null;
        user.banReason = null;
        user.banExpiresAt = null;
        await user.save();
    }

    // Admin accounts need an extra security code, verified SERVER-side against
    // the ADMIN_SECURITY_CODE environment variable. No code -> no admin session.
    const isAdminRole = user.role === "admin" || user.role === "superadmin";
    if (isAdminRole) {
        const expected = process.env.ADMIN_SECURITY_CODE || "";
        const provided = String((req.body && req.body.securityCode) || "");
        if (!expected) {
            return res.status(403).json({ error: "Admin security code is not configured on the server." });
        }
        if (!provided) {
            return res.status(403).json({ codeRequired: true, error: "Security code required." });
        }
        if (provided !== expected) {
            return res.status(403).json({ codeRequired: true, error: "Invalid security code." });
        }
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    // The launcher signs in with a native HTTP client (HttpURLConnection) — it sends
    // no Origin/Referer, unlike the browser. Mark those sessions as "launcher" so
    // they show up in the admin presence panel.
    const fromLauncher = !req.headers.origin && !req.headers.referer;
    user.lastLogin = new Date();
    user.lastSeen = new Date();
    user.lastSource = fromLauncher ? "launcher" : "web";
    if (fromLauncher) user.sessionStart = new Date();
    await user.save();
    recordLogin(user.username);

    res.json({
        token,
        user: userPayload(user),
    });
});

module.exports = router;
