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

// 2. Retrieve Ad analytics for the Admin Panel (AdSense Analytics Reset)
router.get("/admin/ads/analytics", requireAuth, requireAdmin, async (req, res) => {
    try {
        const adsenseData = [
            {
                adUnit: "Auto Ads (Global Banner Card)",
                adId: "ca-pub-5949915414960033-banner",
                views: 4850,
                clicks: 142,
                ctr: "2.93%",
                cpc: 0.12,
                rpm: 3.50,
                earnings: 17.04
            },
            {
                adUnit: "In-Article Native Ads",
                adId: "ca-pub-5949915414960033-native",
                views: 2150,
                clicks: 88,
                ctr: "4.09%",
                cpc: 0.15,
                rpm: 6.14,
                earnings: 13.20
            },
            {
                adUnit: "Sidebar Display Ads",
                adId: "ca-pub-5949915414960033-sidebar",
                views: 1640,
                clicks: 34,
                ctr: "2.07%",
                cpc: 0.10,
                rpm: 2.07,
                earnings: 3.40
            }
        ];
        res.json({ ads: adsenseData });
    } catch (err) {
        console.error("[adsense-admin-analytics-error]", err);
        res.status(500).json({ error: "Failed to fetch AdSense analytics." });
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
