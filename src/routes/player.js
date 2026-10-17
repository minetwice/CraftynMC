const express = require("express");

const User = require("../models/User");

const router = express.Router();

// Public player lookup: search a username, get their public profile + skin/cape.
router.get("/api/player/:username", async (req, res) => {
    try {
        const name = String(req.params.username || "").trim();
        // Strict allow-list: no regex injection, no crazy input.
        if (!name || name.length > 16 || !/^[A-Za-z0-9_]+$/.test(name)) {
            return res.status(400).json({ error: "Enter a valid username (letters, numbers, underscore)." });
        }

        const user = await User.findOne({ username: new RegExp("^" + name + "$", "i") })
            .select("username uuid displayName bio description skinPngBase64 skinModel capePngBase64 coins role premium cosmetics createdAt")
            .lean();
        if (!user) return res.status(404).json({ error: "No player found with that username." });

        const equipped = (user.cosmetics || []).filter((c) => c && c.equipped);

        res.json({
            username: user.username,
            displayName: user.displayName || user.username,
            uuid: user.uuid,
            bio: user.bio || "",
            description: user.description || "",
            role: user.role || "user",
            premium: !!user.premium,
            coins: user.coins || 0,
            createdAt: user.createdAt || null,
            skinModel: user.skinModel === "slim" ? "slim" : "classic",
            hasSkin: !!user.skinPngBase64,
            hasCape: !!user.capePngBase64,
            skinUrl: "/skins/" + user.uuid + ".png",
            capeUrl: "/skins/" + user.uuid + "_cape.png",
            cosmetics: equipped.map((c) => ({ name: c.name || "", cosmeticId: c.cosmeticId || "" })),
        });
    } catch (err) {
        res.status(500).json({ error: "Lookup failed." });
    }
});

module.exports = router;
