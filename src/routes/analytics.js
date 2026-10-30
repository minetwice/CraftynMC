const express = require("express");

const Asset = require("../models/Asset");
const User = require("../models/User");
const DailyStat = require("../models/DailyStat");
const { requireAuth } = require("../middleware/requireAuth");
const { todayKey } = require("../utils/dailyStats");

const router = express.Router();
router.use(express.json());

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) return next();
    return res.status(403).json({ error: "Access denied. Admin role required." });
};

// GET /admin/analytics — downloads per project, daily logins / online, totals.
router.get("/admin/analytics", requireAuth, isAdmin, async (req, res) => {
    try {
        const [assets, totalUsers, loggedInUsers, stats] = await Promise.all([
            Asset.find({}).select("name category downloadsCount views").lean(),
            User.countDocuments({}),
            User.countDocuments({ lastLogin: { $ne: null } }),
            DailyStat.find({}).sort({ date: -1 }).limit(14).lean(),
        ]);

        const projects = assets
            .map((a) => ({
                name: a.name,
                category: a.category,
                downloads: a.downloadsCount || 0,
                views: a.views || 0,
            }))
            .sort((x, y) => y.downloads - x.downloads || y.views - x.views);

        const totalDownloads = projects.reduce((s, p) => s + p.downloads, 0);
        const totalViews = projects.reduce((s, p) => s + p.views, 0);

        const days = stats.map((d) => ({
            date: d.date,
            logins: (d.logins || []).length,
            online: (d.onlineUsers || []).length,
            newUsers: d.newUsers || 0,
        }));

        const todayDoc = stats.find((d) => d.date === todayKey());
        const today = days.find((d) => d.date === todayKey()) ||
            { date: todayKey(), logins: 0, online: 0, newUsers: 0 };
        const todayPlayers = todayDoc ? (todayDoc.logins || []).slice().sort() : [];

        res.json({
            totals: {
                totalUsers,
                loggedInUsers,
                totalDownloads,
                totalViews,
                projects: projects.length,
            },
            today,
            todayPlayers,
            days,
            projects,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load analytics." });
    }
});


// GET /admin/analytics/daily — day by day: how many came, how many came BACK,
// and who spent the most time. This is what the admin panel shows.
router.get("/admin/analytics/daily", requireAuth, isAdmin, async (req, res) => {
    try {
        const days = Math.min(60, Math.max(3, parseInt(req.query.days, 10) || 14));
        const stats = await DailyStat.find({}).sort({ date: -1 }).limit(days).lean();

        const seenBefore = new Set();
        const rows = [];

        // walk oldest -> newest so "returning" means "we saw them on an earlier day"
        for (let i = stats.length - 1; i >= 0; i--) {
            const s = stats[i];
            const users = Array.isArray(s.onlineUsers) ? s.onlineUsers : [];
            const time = s.timeByUser || {};

            let returning = 0;
            users.forEach(function (u) { if (seenBefore.has(u)) returning++; });
            const fresh = Math.max(0, users.length - returning);

            let top = null;
            let total = 0;
            Object.keys(time).forEach(function (u) {
                const sec = Number(time[u]) || 0;
                total += sec;
                if (!top || sec > top.seconds) top = { username: u, seconds: sec };
            });

            rows.push({
                date: s.date,
                online: users.length,
                returning: returning,
                fresh: fresh,
                newUsers: s.newUsers || 0,
                repeatRate: users.length ? Math.round((returning / users.length) * 100) : 0,
                topUser: top,
                totalSeconds: total,
                avgSeconds: users.length ? Math.round(total / users.length) : 0,
            });

            users.forEach(function (u) { seenBefore.add(u); });
        }

        rows.reverse();   // newest first for the panel

        res.json({
            days: rows.length,
            rows: rows,
            totals: {
                uniqueEver: seenBefore.size,
                onlineToday: rows.length ? rows[0].online : 0,
                returningToday: rows.length ? rows[0].returning : 0,
                topToday: rows.length ? rows[0].topUser : null,
            },
        });
    } catch (err) {
        console.error("[analytics-daily]", err);
        res.status(500).json({ error: "Failed to load daily analytics." });
    }
});

module.exports = router;
