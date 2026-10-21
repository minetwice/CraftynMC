const express = require("express");

const Review = require("../models/Review");
const Asset = require("../models/Asset");
const { requireAuth } = require("../middleware/requireAuth");
const { notify } = require("../utils/notify");

const router = express.Router();
router.use(express.json());

// Recompute a project's denormalised average + count after any change.
async function refreshAssetRating(assetId) {
    const rows = await Review.find({ assetId }).select("rating").lean();
    const count = rows.length;
    const avg = count ? Math.round((rows.reduce((s, r) => s + (r.rating || 0), 0) / count) * 10) / 10 : 0;
    await Asset.updateOne({ _id: assetId }, { $set: { ratingAvg: avg, ratingCount: count } }).catch(() => {});
    return { avg, count };
}

// Public: a project's reviews + its average.
router.get("/api/assets/:id/reviews", async (req, res) => {
    try {
        const [reviews, asset] = await Promise.all([
            Review.find({ assetId: req.params.id }).sort({ updatedAt: -1 }).limit(50).lean(),
            Asset.findById(req.params.id).select("ratingAvg ratingCount").lean(),
        ]);
        res.json({
            avg: asset ? (asset.ratingAvg || 0) : 0,
            count: asset ? (asset.ratingCount || 0) : 0,
            reviews: reviews.map((r) => ({
                username: r.username,
                rating: r.rating,
                text: r.text,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load reviews." });
    }
});

// Post / update YOUR review (one per project).
router.post("/api/assets/:id/reviews", requireAuth, async (req, res) => {
    try {
        const rating = Math.round(Number((req.body && req.body.rating) || 0));
        const text = String((req.body && req.body.text) || "").slice(0, 1000).trim();
        if (!(rating >= 1 && rating <= 5)) {
            return res.status(400).json({ error: "Pick a rating from 1 to 5 stars." });
        }
        const asset = await Asset.findById(req.params.id).select("_id name category uploadedBy");
        if (!asset) return res.status(404).json({ error: "Project not found." });

        await Review.findOneAndUpdate(
            { assetId: asset._id, userId: req.user._id },
            {
                $set: { rating, text, username: req.user.username, updatedAt: new Date() },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true, new: true }
        );

        const agg = await refreshAssetRating(asset._id);

        // Tell the creator (never notify someone about their own review).
        if (asset.uploadedBy && asset.uploadedBy !== req.user.username) {
            const cat = asset.category === "launcher" ? "fearlauncher" : asset.category;
            await notify(
                asset.uploadedBy,
                "review",
                req.user.username + " rated " + asset.name + " " + rating + "★",
                text ? text.slice(0, 140) : "No comment left.",
                "/" + cat + "/" + String(asset.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
            );
        }

        res.json({ success: true, avg: agg.avg, count: agg.count });
    } catch (err) {
        res.status(500).json({ error: "Failed to save your review." });
    }
});

// Delete YOUR review.
router.delete("/api/assets/:id/reviews", requireAuth, async (req, res) => {
    try {
        await Review.deleteOne({ assetId: req.params.id, userId: req.user._id });
        const agg = await refreshAssetRating(req.params.id);
        res.json({ success: true, avg: agg.avg, count: agg.count });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete the review." });
    }
});

module.exports = router;
