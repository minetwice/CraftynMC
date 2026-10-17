const express = require("express");

const CoinTransaction = require("../models/CoinTransaction");
const Asset = require("../models/Asset");
const { requireAuth } = require("../middleware/requireAuth");
const { todayKey, dayKey } = require("../utils/dailyStats");
const { ensureCode } = require("../utils/refcode");

// Coin shop — the only things coins can be spent on (no cash, no payments).
const SHOP = {
    premium: { cost: 1000, label: "Premium Badge", desc: "A permanent crown badge next to your name." },
    feature: { cost: 500, label: "Feature a project (7 days)", desc: "Pin one of your projects to the top of its category for a week.", needsAsset: true },
    adfree: { cost: 300, label: "Ad-free pass (24 hours)", desc: "Skip the sponsored download gate for 24 hours." },
};

// Watching a sponsored ad is the ONLY way to earn extra coins (no payments).
const COINS_PER_AD = 50;
const MAX_AD_REWARDS_PER_DAY = 10;
const AD_COOLDOWN_SECONDS = 45;

const router = express.Router();
router.use(express.json());

// ---- Wallet ----
router.get("/api/coins", requireAuth, async (req, res) => {
    res.json({ coins: req.user.coins });
});

router.get("/api/coins/history", requireAuth, async (req, res) => {
    const history = await CoinTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(history);
});

// ---- Daily Reward ----
router.post("/api/daily-reward", requireAuth, async (req, res) => {
    const user = req.user;
    const now = new Date();
    const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

    if (user.lastDailyReward && now - new Date(user.lastDailyReward) < COOLDOWN_MS) {
        const nextClaim = new Date(new Date(user.lastDailyReward).getTime() + COOLDOWN_MS);
        const diffMs = nextClaim - now;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return res.status(400).json({
            error: `Reward already claimed! Next claim in ${hours}h ${minutes}m.`,
        });
    }

    const rewardAmount = 100;
    user.coins = (user.coins || 0) + rewardAmount;
    user.lastDailyReward = now;
    await user.save();

    await CoinTransaction.create({
        userId: user._id,
        amount: rewardAmount,
        reason: "daily_login",
        balanceAfter: user.coins,
    }).catch(() => {});

    res.json({
        success: true,
        reward: rewardAmount,
        newBalance: user.coins,
        message: "You claimed 100 bonus coins!",
    });
});

// ---- Watch a sponsored ad to earn coins (the coin faucet — no payments) ----
router.post("/api/coins/watch-ad", requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const now = Date.now();
        const today = todayKey();

        // New day -> reset the daily counter.
        if (user.adRewardsDate !== today) {
            user.adRewardsDate = today;
            user.adRewardsToday = 0;
        }

        // ---- Ad streak: consecutive days with at least one ad watched ----
        let streakBonus = 0;
        if (user.adStreakDate !== today) {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            user.adStreak = (user.adStreakDate === dayKey(y)) ? (user.adStreak || 0) + 1 : 1;
            user.adStreakDate = today;
            if (user.adStreak > 1) streakBonus = Math.min((user.adStreak - 1) * 25, 250);
        }

        if ((user.adRewardsToday || 0) >= MAX_AD_REWARDS_PER_DAY) {
            return res.status(429).json({
                error: `Daily limit reached (${MAX_AD_REWARDS_PER_DAY} ads). Come back tomorrow!`,
                watchedToday: user.adRewardsToday,
                dailyLimit: MAX_AD_REWARDS_PER_DAY,
            });
        }

        const last = user.lastAdRewardAt ? new Date(user.lastAdRewardAt).getTime() : 0;
        const waitMs = AD_COOLDOWN_SECONDS * 1000 - (now - last);
        if (last && waitMs > 0) {
            return res.status(429).json({
                error: `Please wait ${Math.ceil(waitMs / 1000)}s before the next ad.`,
                retryIn: Math.ceil(waitMs / 1000),
            });
        }

        const total = COINS_PER_AD + streakBonus;
        user.coins = (user.coins || 0) + total;
        user.lastAdRewardAt = new Date();
        user.adRewardsToday = (user.adRewardsToday || 0) + 1;
        await user.save();

        await CoinTransaction.create({
            userId: user._id,
            amount: total,
            reason: streakBonus ? "watch_ad+streak" : "watch_ad",
            balanceAfter: user.coins,
        }).catch(() => {});

        res.json({
            success: true,
            reward: total,
            streakBonus: streakBonus,
            adStreak: user.adStreak || 0,
            newBalance: user.coins,
            watchedToday: user.adRewardsToday,
            dailyLimit: MAX_AD_REWARDS_PER_DAY,
            cooldownSeconds: AD_COOLDOWN_SECONDS,
            message: streakBonus ? `+${total} coins (incl. +${streakBonus} streak bonus!)` : `+${total} coins!`,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to award coins." });
    }
});

// ---- Ad-earning status for the UI ----
router.get("/api/coins/ad-status", requireAuth, async (req, res) => {
    const user = req.user;
    const today = todayKey();
    const watchedToday = user.adRewardsDate === today ? (user.adRewardsToday || 0) : 0;
    const last = user.lastAdRewardAt ? new Date(user.lastAdRewardAt).getTime() : 0;
    const wait = last ? Math.max(0, Math.ceil((AD_COOLDOWN_SECONDS * 1000 - (Date.now() - last)) / 1000)) : 0;
    res.json({
        coins: user.coins || 0,
        coinsPerAd: COINS_PER_AD,
        watchedToday,
        dailyLimit: MAX_AD_REWARDS_PER_DAY,
        cooldownSeconds: wait,
        adStreak: user.adStreak || 0,
        premium: !!user.premium,
        adFree: !!(user.adFreeUntil && new Date(user.adFreeUntil) > new Date()),
        adFreeUntil: user.adFreeUntil || null,
    });
});

// ---- Referral: share your code, both sides earn coins ----
const REFERRAL_REWARD = 200;
router.get("/api/referral", requireAuth, async (req, res) => {
    try {
        const code = await ensureCode(req.user);
        const origin = (req.headers.origin && /^https?:/.test(req.headers.origin)) ? req.headers.origin : "";
        res.json({
            code: code,
            link: (origin || "") + "/?ref=" + code,
            referralCount: req.user.referralCount || 0,
            referredBy: req.user.referredBy || "",
            reward: REFERRAL_REWARD,
            coinsEarned: (req.user.referralCount || 0) * REFERRAL_REWARD,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load referral info." });
    }
});

// ---- Coin shop (the coin sinks) ----
router.get("/api/coins/shop", requireAuth, (req, res) => {
    res.json({
        coins: req.user.coins || 0,
        premium: !!req.user.premium,
        adFree: !!(req.user.adFreeUntil && new Date(req.user.adFreeUntil) > new Date()),
        items: Object.keys(SHOP).map((k) => ({ id: k, cost: SHOP[k].cost, label: SHOP[k].label, desc: SHOP[k].desc, needsAsset: !!SHOP[k].needsAsset })),
    });
});

router.post("/api/coins/shop/buy", requireAuth, async (req, res) => {
    try {
        const { item, assetId } = req.body || {};
        const def = SHOP[item];
        if (!def) return res.status(400).json({ error: "Unknown item." });

        const user = req.user;
        if (item === "premium" && user.premium) {
            return res.status(400).json({ error: "You already have the Premium badge." });
        }
        if ((user.coins || 0) < def.cost) {
            return res.status(400).json({ error: `Not enough coins — you need ${def.cost}, you have ${user.coins || 0}. Watch more ads to earn coins!` });
        }

        let asset = null;
        if (def.needsAsset) {
            if (!assetId) return res.status(400).json({ error: "Pick a project to feature." });
            asset = await Asset.findById(assetId);
            if (!asset) return res.status(404).json({ error: "Project not found." });
            const isOwner = String(asset.uploadedBy) === String(user.username);
            const isAdmin = user.role === "admin" || user.role === "superadmin";
            if (!isOwner && !isAdmin) return res.status(403).json({ error: "You can only feature your own projects." });
        }

        user.coins = (user.coins || 0) - def.cost;
        if (item === "premium") user.premium = true;
        if (item === "adfree") {
            const base = (user.adFreeUntil && new Date(user.adFreeUntil) > new Date()) ? new Date(user.adFreeUntil) : new Date();
            user.adFreeUntil = new Date(base.getTime() + 24 * 60 * 60 * 1000);
        }
        await user.save();

        let message = item === "adfree" ? "Ad-free for 24 hours — downloads skip the ad!" : `Bought ${def.label}!`;
        if (def.needsAsset) {
            const base = (asset.featuredUntil && new Date(asset.featuredUntil) > new Date()) ? new Date(asset.featuredUntil) : new Date();
            asset.featuredUntil = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
            await asset.save();
            message = `"${asset.name}" is now featured for 7 days!`;
        }

        await CoinTransaction.create({
            userId: user._id,
            amount: -def.cost,
            reason: "shop:" + item,
            balanceAfter: user.coins,
        }).catch(() => {});

        res.json({ success: true, message, newBalance: user.coins, premium: !!user.premium });
    } catch (err) {
        res.status(500).json({ error: "Purchase failed." });
    }
});

// ---- Cosmetics inventory (equip/unequip). Buying cosmetics with coins would plug in here
// ---- once you define a cosmetics catalog (id, name, price) - not built yet, this is the
// ---- foundation: storing what a player owns and which one is equipped. ----
router.get("/api/cosmetics", requireAuth, async (req, res) => {
    res.json({ cosmetics: req.user.cosmetics });
});

router.post("/api/cosmetics/:cosmeticId/equip", requireAuth, async (req, res) => {
    const { cosmeticId } = req.params;
    const owns = req.user.cosmetics.some((c) => c.cosmeticId === cosmeticId);
    if (!owns) return res.status(404).json({ error: "You don't own this cosmetic." });

    req.user.cosmetics.forEach((c) => {
        c.equipped = c.cosmeticId === cosmeticId;
    });
    await req.user.save();
    res.json({ success: true, cosmetics: req.user.cosmetics });
});

module.exports = router;
