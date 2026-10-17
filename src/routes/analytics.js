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

module.exports = router;
