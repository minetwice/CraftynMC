const express = require("express");

const User = require("../models/User");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

// A user counts as "online" if seen within this window.
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) return next();
    return res.status(403).json({ error: "Access denied. Admin role required." });
};

// Heartbeat: the website pings this so we know who is online and from where.
// source is "web" for the site; the launcher can send "launcher".
router.post("/api/presence", requireAuth, async (req, res) => {
    try {
        const source = String((req.body && req.body.source) || "web").slice(0, 16);
        req.user.lastSeen = new Date();
        req.user.lastSource = source;
        await req.user.save();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to record presence." });
    }
});

// Admin: who is online / offline, how long they have been on, and their coins.
router.get("/admin/presence", requireAuth, isAdmin, async (req, res) => {
    try {
        const now = Date.now();
        const users = await User.find({})
            .select("username displayName role coins lastSeen lastSource lastLogin isBanned")
            .lean();

        const online = [];
        const offline = [];

        users.forEach((u) => {
            const seen = u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
            const secs = seen ? Math.floor((now - seen) / 1000) : null;
            const row = {
                username: u.username,
                displayName: u.displayName || u.username,
                role: u.role || "user",
                coins: u.coins || 0,
                source: u.lastSource || "",
                lastSeen: u.lastSeen || null,
                lastLogin: u.lastLogin || null,
                onlineForSeconds: secs,
                isBanned: !!u.isBanned,
            };
            if (seen && now - seen <= ONLINE_WINDOW_MS) online.push(row);
            else offline.push(row);
        });

        online.sort((a, b) => (a.onlineForSeconds || 0) - (b.onlineForSeconds || 0));
        offline.sort((a, b) => {
            const at = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
            const bt = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
            return bt - at;
        });

        res.json({
            totalUsers: users.length,
            onlineCount: online.length,
            offlineCount: offline.length,
            webOnline: online.filter((r) => r.source !== "launcher").length,
            launcherOnline: online.filter((r) => r.source === "launcher").length,
            windowSeconds: ONLINE_WINDOW_MS / 1000,
            online,
            offline: offline.slice(0, 300),
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load presence." });
    }
});

module.exports = router;
