const express = require("express");

const Follow = require("../models/Follow");
const User = require("../models/User");
const { requireAuth } = require("../middleware/requireAuth");
const { notify } = require("../utils/notify");

const router = express.Router();

function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

async function findUser(username) {
    if (!username) return null;
    return User.findOne({ username: new RegExp("^" + esc(String(username).trim()) + "$", "i") })
        .select("username displayName followersCount followingCount")
        .lean();
}

// ---- Follow someone ----
router.post("/api/follow/:username", requireAuth, async (req, res) => {
    try {
        const me = req.user.username;
        const them = await findUser(req.params.username);
        if (!them) return res.status(404).json({ error: "Player not found." });
        if (them.username.toLowerCase() === String(me).toLowerCase()) {
            return res.status(400).json({ error: "You cannot follow yourself." });
        }

        const already = await Follow.findOne({ follower: me, following: them.username });
        if (!already) {
            await Follow.create({ follower: me, following: them.username });
            await User.updateOne({ username: them.username }, { $inc: { followersCount: 1 } });
            await User.updateOne({ username: me }, { $inc: { followingCount: 1 } });
            await notify(
                them.username,
                "follow",
                me + " started following you",
                "They will see your new projects and updates.",
                "/player/" + encodeURIComponent(me)
            );
        }

        const followersCount = await Follow.countDocuments({ following: them.username });
        res.json({ success: true, following: true, followersCount });
    } catch (err) {
        console.error("[follow]", err);
        res.status(500).json({ error: "Could not follow right now." });
    }
});

// ---- Unfollow ----
router.delete("/api/follow/:username", requireAuth, async (req, res) => {
    try {
        const me = req.user.username;
        const them = await findUser(req.params.username);
        if (!them) return res.status(404).json({ error: "Player not found." });

        const row = await Follow.findOneAndDelete({ follower: me, following: them.username });
        if (row) {
            await User.updateOne({ username: them.username }, { $inc: { followersCount: -1 } });
            await User.updateOne({ username: me }, { $inc: { followingCount: -1 } });
        }
        const followersCount = await Follow.countDocuments({ following: them.username });
        res.json({ success: true, following: false, followersCount });
    } catch (err) {
        console.error("[unfollow]", err);
        res.status(500).json({ error: "Could not unfollow right now." });
    }
});

// ---- Am I following them? (+ counts) ----
router.get("/api/follow/:username", async (req, res) => {
    try {
        const them = await findUser(req.params.username);
        if (!them) return res.status(404).json({ error: "Player not found." });

        let following = false;
        let token = req.headers.authorization || "";
        if (token.indexOf("Bearer ") === 0) {
            try {
                const jwt = require("jsonwebtoken");
                const me = jwt.verify(token.slice(7), process.env.JWT_SECRET);
                const row = await Follow.findOne({ follower: me.username, following: them.username }).lean();
                following = !!row;
            } catch (e) { /* not logged in — fine */ }
        }

        const [followersCount, followingCount] = await Promise.all([
            Follow.countDocuments({ following: them.username }),
            Follow.countDocuments({ follower: them.username }),
        ]);

        res.json({ success: true, following, followersCount, followingCount });
    } catch (err) {
        res.status(500).json({ error: "Could not load follow state." });
    }
});

// ---- Who follows them / who they follow ----
async function listOf(filter) {
    const rows = await Follow.find(filter).sort({ createdAt: -1 }).limit(60).lean();
    return rows.map((r) => (filter.following !== undefined ? r.follower : r.following));
}

router.get("/api/followers/:username", async (req, res) => {
    try {
        const them = await findUser(req.params.username);
        if (!them) return res.status(404).json({ error: "Player not found." });
        const names = await listOf({ following: them.username });
        const users = await User.find({ username: { $in: names } })
            .select("username displayName uuid role followersCount").lean();
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: "Could not load followers." });
    }
});

router.get("/api/following/:username", async (req, res) => {
    try {
        const them = await findUser(req.params.username);
        if (!them) return res.status(404).json({ error: "Player not found." });
        const names = await listOf({ follower: them.username });
        const users = await User.find({ username: { $in: names } })
            .select("username displayName uuid role followersCount").lean();
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: "Could not load following." });
    }
});

module.exports = router;
