const express = require("express");

const CoinTransaction = require("../models/CoinTransaction");
const Settings = require("../models/Settings");
const { requireAuth } = require("../middleware/requireAuth");

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

// POST Daily login reward
router.post("/api/daily-reward", requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const now = new Date();
        const lastReward = user.lastDailyReward;

        // Check 24 hour cooldown
        if (lastReward) {
            const diffMs = now - new Date(lastReward);
            const hoursPassed = diffMs / (1000 * 60 * 60);
            if (hoursPassed < 24) {
                const hoursLeft = Math.ceil(24 - hoursPassed);
                return res.status(400).json({ error: `You have already claimed your daily reward! Please wait ${hoursLeft} more hours.` });
            }
        }

        // Fetch dynamic daily reward coins setting
        let settings = await Settings.findOne();
        const rewardAmount = settings ? settings.dailyRewardCoins : 100;

        user.coins += rewardAmount;
        user.lastDailyReward = now;

        // Update login streak
        if (lastReward) {
            const diffMs = now - new Date(lastReward);
            const hoursPassed = diffMs / (1000 * 60 * 60);
            if (hoursPassed < 48) {
                user.loginStreak = (user.loginStreak || 0) + 1;
            } else {
                user.loginStreak = 1;
            }
        } else {
            user.loginStreak = 1;
        }

        await user.save();

        // Create transaction history log
        await CoinTransaction.create({
            userId: user._id,
            amount: rewardAmount,
            type: "credit",
            reason: "daily_login",
        });

        res.json({ success: true, reward: rewardAmount, loginStreak: user.loginStreak, coins: user.coins });
    } catch (err) {
        console.error("[daily-reward]", err);
        res.status(500).json({ error: "Internal server error claiming daily reward." });
    }
});

module.exports = router;
