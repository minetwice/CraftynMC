const express = require("express");

const User = require("../models/User");
const VisitLog = require("../models/VisitLog");
const { checkAdminPassword, signAdminToken, requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();
router.use(express.json());

// ---- Owner login: password only, no username. ----
router.post("/api/admin/login", (req, res) => {
    const { password } = req.body || {};
    if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Incorrect admin password." });
    }
    res.json({ token: signAdminToken() });
});

// ---- Everything below requires a valid admin token ----
router.use("/api/admin", requireAdmin);

// List users, newest first, with basic search + pagination.
router.get("/api/admin/users", async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
    const search = (req.query.search || "").trim();

    const filter = search ? { username: new RegExp(search, "i") } : {};

    const [users, total] = await Promise.all([
        User.find(filter)
            .select("username uuid coins country gender isAdmin banned banReason createdAt lastLoginAt lastLoginIp")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

router.post("/api/admin/users/:id/ban", async (req, res) => {
    const { reason } = req.body || {};
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { banned: true, banReason: reason || "No reason given", bannedAt: new Date() },
        { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, user });
});

router.post("/api/admin/users/:id/unban", async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { banned: false, banReason: null, bannedAt: null },
        { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, user });
});

// Promote/demote a user to admin (isAdmin flag). Handy so you don't have to
// keep editing the MongoDB Atlas dashboard by hand once this exists.
router.post("/api/admin/users/:id/set-admin", async (req, res) => {
    const { isAdmin } = req.body || {};
    const user = await User.findByIdAndUpdate(req.params.id, { isAdmin: !!isAdmin }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, user });
});

// ---- Site stats: total users, total visits, visits today, last 7 days trend ----
router.get("/api/admin/stats", async (req, res) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [totalUsers, bannedUsers, totalVisits, visitsToday, recentVisits] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ banned: true }),
        VisitLog.countDocuments({}),
        VisitLog.countDocuments({ createdAt: { $gte: startOfToday } }),
        VisitLog.find({ createdAt: { $gte: sevenDaysAgo } }).select("createdAt ipHash"),
    ]);

    // Build a simple per-day visit count for the last 7 days.
    const dayBuckets = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        dayBuckets[d.toISOString().slice(0, 10)] = 0;
    }
    const uniqueIpsSet = new Set();
    recentVisits.forEach((v) => {
        const key = v.createdAt.toISOString().slice(0, 10);
        if (key in dayBuckets) dayBuckets[key]++;
        uniqueIpsSet.add(v.ipHash);
    });

    res.json({
        totalUsers,
        bannedUsers,
        totalVisits,
        visitsToday,
        uniqueVisitorsLast7Days: uniqueIpsSet.size,
        last7Days: Object.entries(dayBuckets).map(([date, count]) => ({ date, count })),
    });
});

module.exports = router;
