const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { offlineUUID } = require("../utils/uuid");

const router = express.Router();
router.use(express.json());

const USERNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;

router.post("/register", async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({ error: "Username must be 3-16 characters: letters, numbers, underscore only." });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken." });

    const passwordHash = await bcrypt.hash(password, 10);
    const uuid = offlineUUID(username);

    const user = await User.create({ username, uuid, passwordHash, coins: 100 }); // 100 free welcome coins

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({
        token,
        user: { username: user.username, uuid: user.uuid, coins: user.coins },
    });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    
    // Special handling for admin account Twicefear
    if (username === "Twicefear") {
        return res.status(403).json({ 
            error: "Admin account can only login via /admin/login endpoint with session lock protection." 
        });
    }
    
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid username or password." });
    }

    // Check if user is banned
    if (user.isBanned) {
        if (user.banExpiresAt && user.banExpiresAt > new Date()) {
            const hoursLeft = Math.ceil((user.banExpiresAt - new Date()) / (1000 * 60 * 60));
            return res.status(403).json({ 
                error: `Your account is temporarily banned for ${hoursLeft} more hour(s). Reason: ${user.banReason}` 
            });
        } else if (!user.banExpiresAt) {
            return res.status(403).json({ 
                error: `Your account is permanently banned. Reason: ${user.banReason}` 
            });
        }
        // Ban expired, auto-unban
        user.isBanned = false;
        user.bannedAt = null;
        user.bannedBy = null;
        user.banReason = null;
        user.banExpiresAt = null;
        await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    
    // Update login tracking
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
        token,
        user: { 
            username: user.username, 
            uuid: user.uuid, 
            coins: user.coins,
            role: user.role,
            permissions: user.permissions,
        },
    });
});

module.exports = router;
