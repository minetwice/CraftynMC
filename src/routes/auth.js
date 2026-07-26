const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { offlineUUID } = require("../utils/uuid");
const { requireAuth } = require("../middleware/requireAuth");

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
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
        token,
        user: { username: user.username, uuid: user.uuid, coins: user.coins },
    });
});

// Full profile info for the logged-in user - used to render the dashboard/sidebar
// (coins, whether a skin/cape is set, admin status, daily reward streak, etc).
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
    });
});

module.exports = router;
