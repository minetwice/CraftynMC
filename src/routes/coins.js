const express = require("express");

const User = require("../models/User");
const Upload = require("../models/Upload");
const CoinTransaction = require("../models/CoinTransaction");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

// ---- Wallet Balance ----
router.get("/api/coins", requireAuth, async (req, res) => {
    res.json({ coins: req.user.coins, lastClaimedReward: req.user.lastClaimedReward });
});

// ---- Wallet Transactions History ----
router.get("/api/coins/history", requireAuth, async (req, res) => {
    try {
        const history = await CoinTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: "Failed to load transaction history." });
    }
});

// ---- Daily Rewards System ----
router.post("/api/rewards/claim", requireAuth, async (req, res) => {
    try {
        const now = new Date();
        const lastClaimed = req.user.lastClaimedReward;

        if (lastClaimed) {
            const msSinceClaimed = now.getTime() - new Date(lastClaimed).getTime();
            const hoursSinceClaimed = msSinceClaimed / (1000 * 60 * 60);

            if (hoursSinceClaimed < 24) {
                const remainingHours = Math.ceil(24 - hoursSinceClaimed);
                return res.status(400).json({
                    error: `You have already claimed your daily reward. Try again in ${remainingHours} hours.`
                });
            }
        }

        const rewardAmount = 50; // 50 free coins daily
        req.user.coins += rewardAmount;
        req.user.lastClaimedReward = now;

        await CoinTransaction.create({
            userId: req.user._id,
            amount: rewardAmount,
            reason: "daily_login_reward",
            balanceAfter: req.user.coins
        });

        await req.user.save();

        res.json({
            success: true,
            coins: req.user.coins,
            lastClaimedReward: req.user.lastClaimedReward,
            message: "Success! You claimed 50 free coins."
        });
    } catch (e) {
        console.error("Daily claim error:", e);
        res.status(500).json({ error: "Failed to claim reward." });
    }
});

// ---- Premium Assets Purchase Endpoint ----
router.post("/api/uploads/:id/purchase", requireAuth, async (req, res) => {
    try {
        const asset = await Upload.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ error: "Asset not found." });
        }

        if (asset.accessType !== "premium") {
            return res.status(400).json({ error: "This asset is already free." });
        }

        // Check if user is the uploader
        if (asset.uploader.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: "You uploaded this asset, you already own it." });
        }

        // Check if already unlocked/purchased
        const alreadyUnlocked = req.user.unlockedAssets.some(
            (id) => id.toString() === asset._id.toString()
        );
        if (alreadyUnlocked) {
            return res.status(400).json({ error: "You already purchased this premium asset." });
        }

        // Check balance
        const price = asset.price || 0;
        if (req.user.coins < price) {
            return res.status(400).json({ error: `Insufficient coins balance. Requires ${price} coins.` });
        }

        // Process purchase
        req.user.coins -= price;
        req.user.unlockedAssets.push(asset._id);

        await CoinTransaction.create({
            userId: req.user._id,
            amount: -price,
            reason: `purchased_asset:${asset.title}`,
            balanceAfter: req.user.coins
        });

        await req.user.save();

        res.json({
            success: true,
            coins: req.user.coins,
            message: `Successfully purchased "${asset.title}" for ${price} coins!`
        });
    } catch (e) {
        console.error("Purchase error:", e);
        res.status(500).json({ error: "Failed to complete transaction." });
    }
});

// ---- Cosmetics inventory (equip/unequip) ----
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
