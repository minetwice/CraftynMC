const express = require("express");

const User = require("../models/User");
const CoinTransaction = require("../models/CoinTransaction");
const WeeklyAward = require("../models/WeeklyAward");
const { notify } = require("../utils/notify");
const { WEEK_MS, weekKey, isStaff, STAFF_ROLES } = require("../utils/week");
const Asset = require("../models/Asset");

const router = express.Router();
router.use(express.json());

// ---- weekly boards -------------------------------------------------------
// TWO separate boards, each with its own prize pool:
//   coins  — coins EARNED this week (a real weekly race, not a bank balance)
//   online — seconds spent online this week
// Staff (admin / owner / moderator) never appear and can never win a prize.
const PRIZES = [2000, 1000, 500];
const BOARDS = ["coins", "online"];
const BOARD_META = {
    coins: { title: "Most coins earned", unit: "coins" },
    online: { title: "Most time online", unit: "seconds" },
};

// Staff ids, so we can exclude them from both boards in one query.
async function staffIds() {
    const staff = await User.find({ role: { $in: STAFF_ROLES } }).select("_id").lean();
    return staff.map((s) => s._id);
}

function shape(list) {
    return list.map((r) => ({
        userId: r.userId,
        value: r.value,
        coins: r.value,
        username: r.username || "unknown",
        displayName: r.displayName || r.username || "unknown",
        premium: !!r.premium,
    }));
}

// Coins EARNED in the window (positive transactions only).
async function topCoinEarners(from, to, limit) {
    const banned = await staffIds();
    const rows = await CoinTransaction.aggregate([
        { $match: { amount: { $gt: 0 }, createdAt: { $gte: from, $lt: to }, userId: { $nin: banned } } },
        { $group: { _id: "$userId", value: { $sum: "$amount" } } },
        { $sort: { value: -1 } },
        { $limit: limit * 3 },
    ]);
    if (!rows.length) return [];

    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
        .select("username displayName premium role")
        .lean();
    const byId = {};
    users.forEach((u) => { byId[String(u._id)] = u; });

    const out = [];
    rows.forEach((r) => {
        const u = byId[String(r._id)];
        if (!u || isStaff(u.role)) return;          // belt and braces
        out.push({ userId: String(r._id), value: r.value, username: u.username, displayName: u.displayName, premium: !!u.premium });
    });
    return out.slice(0, limit);
}

// Seconds online in the week that just finished (read from the archive, so it
// survives everyone's counter rolling over on Monday).
async function topOnline(limit) {
    const finished = weekKey(new Date(Date.now() - WEEK_MS));
    const rows = await User.find({
        role: { $nin: STAFF_ROLES },
        isBanned: { $ne: true },
        onlineWeekPrevKey: finished,
        onlineWeekPrev: { $gt: 0 },
    })
        .select("username displayName premium onlineWeekPrev")
        .sort({ onlineWeekPrev: -1 })
        .limit(limit * 3)
        .lean();
    return rows.slice(0, limit).map((u) => ({
        userId: String(u._id),
        value: u.onlineWeekPrev || 0,
        username: u.username,
        displayName: u.displayName,
        premium: !!u.premium,
    }));
}

// Lazy weekly award: runs once per week PER BOARD, the first time the board is
// read after the week rolls over. No cron needed, and the unique index on
// (week, board) makes it impossible to pay twice.
async function runBoardAward(board, now) {
    const W = weekKey(now);
    const already = await WeeklyAward.findOne({ week: W, board }).lean();
    if (already) return null;

    const from = new Date(now.getTime() - WEEK_MS);
    const top = board === "online" ? await topOnline(PRIZES.length) : await topCoinEarners(from, now, PRIZES.length);
    const winners = [];

    for (let i = 0; i < top.length; i++) {
        const u = await User.findById(top[i].userId);
        if (!u || isStaff(u.role)) continue;

        u.coins = (u.coins || 0) + PRIZES[i];
        await u.save();
        await CoinTransaction.create({
            userId: u._id,
            amount: PRIZES[i],
            reason: "weekly_prize",
            balanceAfter: u.coins,
        }).catch(() => {});

        // Tell them, with their placing and the board they won.
        await notify(
            u.username,
            "coins",
            "\uD83C\uDFC6 You finished #" + (i + 1) + " on " + BOARD_META[board].title + "!",
            "You won " + PRIZES[i].toLocaleString("en-IN") + " coins. They are in your balance already.",
            "/leaderboard"
        );

        winners.push({ username: u.username, coins: top[i].value, prize: PRIZES[i], place: i + 1 });
    }

    try {
        return await WeeklyAward.create({ week: W, board, winners, awardedAt: new Date() });
    } catch (e) {
        return null;   // another request won the race — fine
    }
}

// Pay every board that needs paying. Called on read, and by the server timer.
async function runAllAwards(now) {
    for (const b of BOARDS) {
        try { await runBoardAward(b, now); } catch (e) {}
    }
}

// Public leaderboard: both boards for this week + last week's winners.
router.get("/api/leaderboard", async (req, res) => {
    try {
        const now = new Date();
        try { await runAllAwards(now); } catch (e) {}

        const from = new Date(now.getTime() - WEEK_MS);
        const [coins, online] = await Promise.all([
            topCoinEarners(from, now, 10),
            topOnline(10),
        ]);

        const awards = await WeeklyAward.find({}).sort({ awardedAt: -1 }).limit(4).lean();
        const lastByBoard = {};
        awards.forEach((a) => { if (!lastByBoard[a.board]) lastByBoard[a.board] = a; });

        res.json({
            weekStart: from.toISOString(),
            weekEnd: now.toISOString(),
            prizes: PRIZES,
            boards: BOARDS.map((b) => ({
                board: b,
                title: BOARD_META[b].title,
                unit: BOARD_META[b].unit,
                top: b === "online" ? shape(online) : shape(coins),
                lastWinners: (lastByBoard[b] && lastByBoard[b].winners) || [],
                lastAwardWeek: (lastByBoard[b] && lastByBoard[b].week) || null,
            })),
            // kept for older clients
            top: shape(coins),
            lastWinners: (lastByBoard.coins && lastByBoard.coins.winners) || [],
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

// Exposed so the server can also pay the boards on a timer — Render sleeps the
// free tier, so the lazy-on-read path is the one that matters, but the timer
// catches the case where nobody opens the page for a while.
router.runAllAwards = runAllAwards;
router.PRIZES = PRIZES;

module.exports = router;
