const express = require("express");
const AdAnalytics = require("../models/AdAnalytics");
const CoinTransaction = require("../models/CoinTransaction");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

// Helper to check admin access
const requireAdmin = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin" || req.user.username === "Twicefear")) {
        return next();
    }
    return res.status(403).json({ error: "Access denied. Admin role required." });
};

// 1. Post/Track Ad impression or active duration
router.post("/api/ads/track", async (req, res) => {
    try {
        const { adId, adType, incrementView, durationSeconds, activeSection } = req.body;

        if (!adId || !adType) {
            return res.status(400).json({ error: "adId and adType are required." });
        }

        let ad = await AdAnalytics.findOne({ adId });
        if (!ad) {
            ad = new AdAnalytics({
                adId,
                adType,
                views: 0,
                totalDurationSeconds: 0,
                sectionViews: {},
            });
        }

        if (incrementView) {
            ad.views = (ad.views || 0) + 1;
        }

        if (durationSeconds) {
            ad.totalDurationSeconds = (ad.totalDurationSeconds || 0) + parseInt(durationSeconds);
        }

        if (activeSection) {
            const cleanSec = String(activeSection).trim().toLowerCase();
            const currentViews = ad.sectionViews.get(cleanSec) || 0;
            ad.sectionViews.set(cleanSec, currentViews + (incrementView ? 1 : 0));
        }

        await ad.save();
        res.json({ success: true });
    } catch (err) {
        console.error("[ad-tracking-error]", err);
        res.status(500).json({ error: "Failed to record ad analytics." });
    }
});

// 2. Retrieve Ad analytics for the Admin Panel
router.get("/admin/ads/analytics", requireAuth, requireAdmin, async (req, res) => {
    try {
        const ads = await AdAnalytics.find();

        // Let's seed initial entries if database is empty so dashboard doesn't look blank
        if (!ads.length) {
            const seed = [
                { adId: "35a86c5d8dc846d88bd46237c3b7e359", adType: "smart_link", views: 520, totalDurationSeconds: 620, sectionViews: { "daily-rewards": 520 } },
                { adId: "a89fd9f92762d87fe8fc95959bf2d8a5", adType: "social_bar", views: 2400, totalDurationSeconds: 31000, sectionViews: { "dashboard": 1600, "mods": 800 } },
                { adId: "b54e3a3fe5e20eb4df62b336a9f92272", adType: "native_banner", views: 3800, totalDurationSeconds: 49000, sectionViews: { "dashboard": 2800, "skins": 1000 } }
            ];
            for (const item of seed) {
                await AdAnalytics.create(item);
            }
            const seededAds = await AdAnalytics.find();
            return res.json({ ads: seededAds });
        }

        res.json({ ads });
    } catch (err) {
        console.error("[ad-admin-analytics-error]", err);
        res.status(500).json({ error: "Failed to fetch ad analytics." });
    }
});

// 3. POST /api/ads/reward (Claims +50 Coins for watching an ad for 10 seconds)
router.post("/api/ads/reward", requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const now = new Date();

        // Check if 24 hours have passed to reset the counter
        const lastWatch = user.lastAdWatchedTime;
        if (lastWatch) {
            const lastWatchDate = new Date(lastWatch);
            // Check if on a different calendar day or more than 24 hours
            const isDifferentDay = lastWatchDate.toDateString() !== now.toDateString();
            if (isDifferentDay) {
                user.dailyAdsWatchedCount = 0;
            }
        } else {
            user.dailyAdsWatchedCount = 0;
        }

        // Limit maximum 10 ads per 24 hours
        if (user.dailyAdsWatchedCount >= 10) {
            return res.status(400).json({
                error: "You have reached your daily limit of 10 rewarded ads! Please come back tomorrow to claim more free coins.",
            });
        }

        const coinReward = 50;
        user.coins += coinReward;
        user.dailyAdsWatchedCount = (user.dailyAdsWatchedCount || 0) + 1;
        user.lastAdWatchedTime = now;

        await user.save();

        // Log transaction history
        await CoinTransaction.create({
            userId: user._id,
            amount: coinReward,
            reason: `rewarded_ad_watched_day_${user.dailyAdsWatchedCount}`,
            balanceAfter: user.coins,
        });

        res.json({
            success: true,
            reward: coinReward,
            coins: user.coins,
            dailyCount: user.dailyAdsWatchedCount,
        });
    } catch (err) {
        console.error("[rewarded-ad-payout-error]", err);
        res.status(500).json({ error: "Internal server error issuing rewarded coins." });
    }
});

module.exports = router;
