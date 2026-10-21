const express = require("express");

const User = require("../models/User");
const CoinTransaction = require("../models/CoinTransaction");
const WeeklyAward = require("../models/WeeklyAward");
const Asset = require("../models/Asset");

const router = express.Router();
router.use(express.json());

// Top 3 each week earn bonus coins. Coins EARNED (positive transactions) are
// what counts, so watching ads is the way up the board.
const PRIZES = [500, 300, 150];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Monday-based week key, e.g. "2026-10-12".
function weekKey(d) {
    const x = new Date(d);
    const day = (x.getUTCDay() + 6) % 7; // Mon = 0
    x.setUTCDate(x.getUTCDate() - day);
    const p = (n) => String(n).padStart(2, "0");
    return x.getUTCFullYear() + "-" + p(x.getUTCMonth() + 1) + "-" + p(x.getUTCDate());
}

async function topEarners(from, to, limit) {
    const rows = await CoinTransaction.aggregate([
        { $match: { amount: { $gt: 0 }, createdAt: { $gte: from, $lt: to } } },
        { $group: { _id: "$userId", coins: { $sum: "$amount" } } },
        { $sort: { coins: -1 } },
        { $limit: limit },
    ]);
    if (!rows.length) return [];

    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
        .select("username displayName premium")
        .lean();
    const byId = {};
    users.forEach((u) => { byId[String(u._id)] = u; });

    return rows.map((r) => {
        const u = byId[String(r._id)] || {};
        return {
            userId: String(r._id),
            coins: r.coins,
            username: u.username || "unknown",
            displayName: u.displayName || u.username || "unknown",
            premium: !!u.premium,
        };
    });
}

// Lazy weekly award: runs once per week, the first time the board is read
// after the week rolls over. No cron needed.
async function runWeeklyAward(now) {
    const W = weekKey(now);
    const last = await WeeklyAward.findOne({}).sort({ awardedAt: -1 });
    if (last && last.week === W) return null;

    const from = new Date(now.getTime() - WEEK_MS);
    const top = await topEarners(from, now, PRIZES.length);
    const winners = [];

    for (let i = 0; i < top.length; i++) {
        const u = await User.findById(top[i].userId);
        if (!u) continue;
        u.coins = (u.coins || 0) + PRIZES[i];
        await u.save();
        await CoinTransaction.create({
            userId: u._id,
            amount: PRIZES[i],
            reason: "weekly_prize",
            balanceAfter: u.coins,
        }).catch(() => {});
        winners.push({ username: u.username, coins: top[i].coins, prize: PRIZES[i] });
    }

    return WeeklyAward.create({ week: W, winners, awardedAt: new Date() });
}

// Public leaderboard: this week's top earners + last week's winners.
router.get("/api/leaderboard", async (req, res) => {
    try {
        const now = new Date();
        try { await runWeeklyAward(now); } catch (e) {}
        const top = await topEarners(new Date(now.getTime() - WEEK_MS), now, 10);
        const lastAward = await WeeklyAward.findOne({}).sort({ awardedAt: -1 }).lean();
        res.json({
            weekStart: new Date(now.getTime() - WEEK_MS).toISOString(),
            prizes: PRIZES,
            top,
            lastWinners: lastAward ? lastAward.winners : [],
            lastAwardWeek: lastAward ? lastAward.week : null,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load the leaderboard." });
    }
});

/* ---------- separate boards, one per stat ---------- */
const BOARD_SELECT = "username displayName role premium coins onlineSeconds uuid";

function userRows(users, valueFn) {
    return users.map((u, i) => ({
        rank: i + 1,
        username: u.username,
        displayName: u.displayName || u.username,
        role: u.role || "user",
        premium: !!u.premium,
        value: valueFn(u),
        skinUrl: u.uuid ? "/skins/" + u.uuid + ".png" : "",
    }));
}

// Public boards: coins, online time, projects uploaded, downloads earned.
router.get("/api/leaderboards", async (req, res) => {
    try {
        const N = 20;
        const [byCoins, byOnline, projAgg, dlAgg] = await Promise.all([
            User.find({}).select(BOARD_SELECT).sort({ coins: -1 }).limit(N).lean(),
            User.find({}).select(BOARD_SELECT).sort({ onlineSeconds: -1 }).limit(N).lean(),
            Asset.aggregate([
                { $group: { _id: "$uploadedBy", projects: { $sum: 1 } } },
                { $sort: { projects: -1 } },
                { $limit: N },
            ]),
            Asset.aggregate([
                { $group: { _id: "$uploadedBy", downloads: { $sum: "$downloadsCount" }, projects: { $sum: 1 } } },
                { $sort: { downloads: -1 } },
                { $limit: N },
            ]),
        ]);

        const names = projAgg.concat(dlAgg).map((r) => r._id).filter(Boolean);
        const owners = names.length
            ? await User.find({ username: { $in: names } }).select(BOARD_SELECT).lean()
            : [];
        const byName = {};
        owners.forEach((u) => { byName[String(u.username).toLowerCase()] = u; });

        const fromAgg = (rows, key) => rows.map((r, i) => {
            const u = byName[String(r._id || "").toLowerCase()] || {};
            return {
                rank: i + 1,
                username: r._id || "unknown",
                displayName: u.displayName || r._id || "unknown",
                role: u.role || "user",
                premium: !!u.premium,
                value: r[key] || 0,
                skinUrl: u.uuid ? "/skins/" + u.uuid + ".png" : "",
            };
        });

        res.json({
            boards: {
                coins: userRows(byCoins, (u) => u.coins || 0),
                online: userRows(byOnline, (u) => u.onlineSeconds || 0),
                projects: fromAgg(projAgg, "projects"),
                downloads: fromAgg(dlAgg, "downloads"),
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load the leaderboards." });
    }
});

module.exports = router;
