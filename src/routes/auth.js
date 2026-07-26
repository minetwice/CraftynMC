const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { offlineUUID } = require("../utils/uuid");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

const USERNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;
const VALID_GENDERS = ["male", "female", "other"];

function getClientIp(req) {
    const fwd = req.headers["x-forwarded-for"];
    if (fwd) return fwd.split(",")[0].trim();
    return req.socket?.remoteAddress || "unknown";
}

router.post("/register", async (req, res) => {
    const { username, password, country, gender } = req.body || {};

    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({ error: "Username must be 3-16 characters: letters, numbers, underscore only." });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (!country || typeof country !== "string" || country.length > 56) {
        return res.status(400).json({ error: "Please select your country." });
    }
    if (!gender || !VALID_GENDERS.includes(gender)) {
        return res.status(400).json({ error: "Please select a gender option." });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken." });

    const passwordHash = await bcrypt.hash(password, 10);
    const uuid = offlineUUID(username);

    const user = await User.create({
        username,
        uuid,
        passwordHash,
        coins: 100, // welcome bonus
        country,
        gender,
        lastLoginAt: new Date(),
        lastLoginIp: getClientIp(req),
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({
        token,
        user: { username: user.username, uuid: user.uuid, coins: user.coins },
    });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid username or password." });
    }

    if (user.banned) {
        return res.status(403).json({ error: `This account is banned.${user.banReason ? " Reason: " + user.banReason : ""}` });
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = getClientIp(req);
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
        token,
        user: { username: user.username, uuid: user.uuid, coins: user.coins },
    });
});

router.get("/api/me", requireAuth, async (req, res) => {
    const u = req.user;
    res.json({
        username: u.username,
        uuid: u.uuid,
        coins: u.coins,
        isAdmin: u.isAdmin,
        hasSkin: !!u.skinPngBase64,
        hasCape: !!u.capePngBase64,
        skinModel: u.skinModel,
        dailyRewardStreak: u.dailyRewardStreak,
        lastDailyRewardAt: u.lastDailyRewardAt,
        country: u.country,
        gender: u.gender,
    });
});

// ---- Account edit: profile fields (country/gender). Username and email are
// ---- intentionally not editable here - the username is baked into the
// ---- player's Minecraft UUID, so changing it would break skin/session
// ---- continuity in-game. ----
router.put("/api/me/profile", requireAuth, async (req, res) => {
    const { country, gender } = req.body || {};
    if (country !== undefined) {
        if (typeof country !== "string" || country.length > 56) {
            return res.status(400).json({ error: "Invalid country." });
        }
        req.user.country = country;
    }
    if (gender !== undefined) {
        if (!VALID_GENDERS.includes(gender)) return res.status(400).json({ error: "Invalid gender option." });
        req.user.gender = gender;
    }
    await req.user.save();
    res.json({ success: true, country: req.user.country, gender: req.user.gender });
});

router.put("/api/me/password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Both current and new password are required." });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    const ok = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect." });

    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.json({ success: true });
});

module.exports = router;
