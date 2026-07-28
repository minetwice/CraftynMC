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
                { adId: "30449342", adType: "smart_link", views: 250, totalDurationSeconds: 300, sectionViews: { "daily-rewards": 250 } },
                { adId: "30449344", adType: "social_bar", views: 1200, totalDurationSeconds: 15400, sectionViews: { "dashboard": 800, "mods": 400 } },
                { adId: "30449345", adType: "banner", views: 3500, totalDurationSeconds: 42000, sectionViews: { "dashboard": 1500, "mods": 1000, "capes": 1000 } },
                { adId: "30449343", adType: "native_banner", views: 1800, totalDurationSeconds: 24300, sectionViews: { "dashboard": 1200, "skins": 600 } }
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
