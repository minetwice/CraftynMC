const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Settings = require("../models/Settings");
const { offlineUUID } = require("../utils/uuid");

const router = express.Router();
router.use(express.json());

// Live Username Availability Check Endpoint
router.get('/api/check-username', async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) {
            return res.status(400).json({ error: "Username parameter is required." });
        }

        // Handle unconnected DB gracefully for local/sandbox testing
        if (mongoose.connection.readyState !== 1) {
            return res.json({ available: true, message: "Username is available! (Demo mode)" });
        }

        // Search database for an existing user with the same username (case-insensitive)
        const existingUser = await User.findOne({
            username: { $regex: new RegExp("^" + username + "$", "i") }
        });

        if (existingUser) {
            // Username is already registered and taken
            return res.json({ available: false, message: "Username is already taken." });
        } else {
            // Username is free and available to register
            return res.json({ available: true, message: "Username is available!" });
        }
    } catch (error) {
        console.error("Error in check-username:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

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
        country: user.country,
        pronouns: user.pronouns,
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

    // Fetch dynamic starting coins setting
    let settings = await Settings.findOne();
    const startCoins = settings ? settings.startingCoins : 100;

    const user = await User.create({
        username,
        uuid,
        passwordHash,
        coins: startCoins,
        displayName: username,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({
        token,
        user: userPayload(user),
    });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (username === "Twicefear") {
        return res.status(403).json({
            error: "Admin account can only login via /admin/login endpoint with session lock protection.",
        });
    }

    const user = await User.findOne({ username });
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    user.lastLogin = new Date();
    await user.save();

    res.json({
        token,
        user: userPayload(user),
    });
});

module.exports = router;
