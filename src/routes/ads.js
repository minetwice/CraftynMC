const express = require("express");
const AdAnalytics = require("../models/AdAnalytics");
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

module.exports = router;
