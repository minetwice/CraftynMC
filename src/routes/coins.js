const express = require("express");

const CoinTransaction = require("../models/CoinTransaction");
const { requireAuth } = require("../middleware/requireAuth");
const { todayKey } = require("../utils/dailyStats");

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

        user.coins = (user.coins || 0) + COINS_PER_AD;
        user.lastAdRewardAt = new Date();
        user.adRewardsToday = (user.adRewardsToday || 0) + 1;
        await user.save();

        await CoinTransaction.create({
            userId: user._id,
            amount: COINS_PER_AD,
            reason: "watch_ad",
            balanceAfter: user.coins,
        }).catch(() => {});

        res.json({
            success: true,
            reward: COINS_PER_AD,
            newBalance: user.coins,
            watchedToday: user.adRewardsToday,
            dailyLimit: MAX_AD_REWARDS_PER_DAY,
            cooldownSeconds: AD_COOLDOWN_SECONDS,
            message: `+${COINS_PER_AD} coins!`,
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
    });
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
