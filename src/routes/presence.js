const express = require("express");

const User = require("../models/User");
const { requireAuth } = require("../middleware/requireAuth");
const { recordOnline } = require("../utils/dailyStats");

const router = express.Router();
router.use(express.json());

// A user counts as "online" if seen within this window. The launcher talks to
// us less often than the website (only on Yggdrasil auth/join), so it gets a
// wider window.
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const LAUNCHER_WINDOW_MS = 10 * 60 * 1000;

function windowFor(source) {
    return source === "launcher" ? LAUNCHER_WINDOW_MS : ONLINE_WINDOW_MS;
}

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) return next();
    return res.status(403).json({ error: "Access denied. Admin role required." });
};

// Heartbeat: the website pings this so we know who is online and from where.
// source is "web" for the site; the launcher can send "launcher".
router.post("/api/presence", requireAuth, async (req, res) => {
    try {
        const source = String((req.body && req.body.source) || "web").slice(0, 16);
        const now = Date.now();
        const prev = req.user.lastSeen ? new Date(req.user.lastSeen).getTime() : 0;
        // A brand-new session starts when the previous ping was outside the window.
        if (!prev || now - prev > windowFor(req.user.lastSource)) req.user.sessionStart = new Date();
        req.user.lastSeen = new Date();
        req.user.lastSource = source;
        await req.user.save();
        recordOnline(req.user.username);
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
            .select("username displayName role coins lastSeen lastSource sessionStart lastLogin isBanned")
            .lean();

        const online = [];
        const offline = [];

        users.forEach((u) => {
            const seen = u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
            const isOn = !!seen && now - seen <= windowFor(u.lastSource);
            const start = u.sessionStart ? new Date(u.sessionStart).getTime() : seen;
            const secs = isOn ? Math.floor((now - start) / 1000) : null;
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
            if (isOn) online.push(row);
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
