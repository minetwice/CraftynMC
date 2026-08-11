const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const User = require("../models/User");
const { requireAuth } = require("../middleware/requireAuth");

module.exports = function(options = {}) {
    const router = express.Router();
    router.use(express.json());
    
    const { dbConnected = true } = options;
    
    // Helper function to check DB connection
    function requireDB(req, res, next) {
        if (!dbConnected || mongoose.connection.readyState !== 1) {
            return res.status(503).json({ 
                error: "Database not connected. Running in demo mode.",
                demoMode: true 
            });
        }
        next();
    }
    
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 512 * 1024 },
    });

function isPng(buffer) {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return buffer.length > 8 && buffer.subarray(0, 8).equals(sig);
}

function profilePayload(user) {
    return {
        username: user.username,
        uuid: user.uuid,
        displayName: user.displayName || user.username,
        bio: user.bio || "",
        description: user.description || "",
        coins: user.coins,
        role: user.role,
        skinModel: user.skinModel || "classic",
        hasSkin: !!user.skinPngBase64,
        hasLogo: !!user.logoPngBase64,
        hasCape: !!user.capePngBase64,
        logoUrl: user.logoPngBase64 ? `/logos/${user.uuid}.png` : null,
        skinUrl: user.skinPngBase64 ? `/skins/${user.uuid}.png` : null,
        loginStreak: user.loginStreak || 0,
        lastDailyReward: user.lastDailyReward,
        createdAt: user.createdAt,
        country: user.country,
        pronouns: user.pronouns,
    };
}

// Get own profile
router.get("/api/profile", requireAuth, async (req, res) => {
    res.json({ profile: profilePayload(req.user) });
});

// Submit country & pronouns during onboarding
router.post("/api/profile/onboarding", requireAuth, async (req, res) => {
    const { country, pronouns } = req.body || {};

    if (!country || !pronouns) {
        return res.status(400).json({ error: "Both Country and Pronouns are required for onboarding." });
    }

    req.user.country = String(country).trim();
    req.user.pronouns = String(pronouns).trim();

    await req.user.save();
    res.json({ success: true, profile: profilePayload(req.user) });
});

// Public profile by username
router.get("/api/profile/:username", async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).select(
        "-passwordHash -activeSessionToken"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ profile: profilePayload(user) });
});

// Update profile text fields
router.put("/api/profile", requireAuth, async (req, res) => {
    const { displayName, bio, description } = req.body || {};

    if (displayName !== undefined) {
        const name = String(displayName).trim().slice(0, 32);
        if (name.length > 0 && name.length < 2) {
            return res.status(400).json({ error: "Display name must be at least 2 characters." });
        }
        req.user.displayName = name || null;
    }

    if (bio !== undefined) {
        req.user.bio = String(bio).slice(0, 160);
    }

    if (description !== undefined) {
        req.user.description = String(description).slice(0, 500);
    }

    await req.user.save();
    res.json({ success: true, profile: profilePayload(req.user) });
});

// Upload logo / avatar (PNG)
router.post("/api/profile/logo", requireAuth, upload.single("logo"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded under field name 'logo'." });
    if (!isPng(req.file.buffer)) return res.status(400).json({ error: "File must be a valid PNG." });

    req.user.logoPngBase64 = req.file.buffer.toString("base64");
    await req.user.save();

    res.json({
        success: true,
        logoUrl: `/logos/${req.user.uuid}.png`,
        profile: profilePayload(req.user),
    });
});

// Remove logo
router.delete("/api/profile/logo", requireAuth, async (req, res) => {
    req.user.logoPngBase64 = null;
    await req.user.save();
    res.json({ success: true, profile: profilePayload(req.user) });
});

// Serve logo PNG publicly
router.get("/logos/:file", async (req, res) => {
    const uuid = req.params.file.replace(/\.png$/, "");
    const user = await User.findOne({ uuid });
    if (!user || !user.logoPngBase64) return res.status(404).end();

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=60");
    res.send(Buffer.from(user.logoPngBase64, "base64"));
});

    return router;
};
