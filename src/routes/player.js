const express = require("express");

const User = require("../models/User");

const router = express.Router();

// Public player directory — every player, sorted + paginated (30/page by
// default). Powers the "All players" grid in Player Lookup.
router.get("/api/players", async (req, res) => {
    try {
        const sort = String(req.query.sort || "new");
        const perPage = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
        const wantPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const sortBy = sort === "coins" ? { coins: -1 }
            : sort === "online" ? { onlineSeconds: -1 }
            : sort === "name" ? { username: 1 }
            : { createdAt: -1 };

        const total = await User.countDocuments({});
        const pages = Math.max(Math.ceil(total / perPage), 1);
        const page = Math.min(wantPage, pages);

        const users = await User.find({})
            .select("username displayName role premium coins onlineSeconds uuid skinPngBase64 createdAt")
            .sort(sortBy)
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        res.json({
            count: users.length,
            total,
            page,
            pages,
            perPage,
            sort,
            players: users.map((u) => ({
                username: u.username,
                displayName: u.displayName || u.username,
                role: u.role || "user",
                premium: !!u.premium,
                coins: u.coins || 0,
                onlineSeconds: u.onlineSeconds || 0,
                hasSkin: !!u.skinPngBase64,
                skinUrl: "/skins/" + u.uuid + ".png",
                createdAt: u.createdAt || null,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: "Could not load players." });
    }
});

// Username autocomplete: as-you-type suggestions (prefix + contains).
router.get("/api/player/search", async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        if (!q || q.length > 16 || !/^[A-Za-z0-9_]+$/.test(q)) return res.json({ players: [] });

        // Prefix matches first, then anything containing the text.
        const [prefix, contains] = await Promise.all([
            User.find({ username: new RegExp("^" + q, "i") }).select("username displayName premium role").limit(8).lean(),
            User.find({ username: new RegExp(q, "i") }).select("username displayName premium role").limit(8).lean(),
        ]);

        const seen = {};
        const players = [];
        prefix.concat(contains).forEach((u) => {
            const key = String(u.username).toLowerCase();
            if (seen[key] || players.length >= 8) return;
            seen[key] = 1;
            players.push({
                username: u.username,
                displayName: u.displayName || u.username,
                premium: !!u.premium,
                role: u.role || "user",
            });
        });

        res.json({ players });
    } catch (err) {
        res.status(500).json({ error: "Search failed." });
    }
});

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
