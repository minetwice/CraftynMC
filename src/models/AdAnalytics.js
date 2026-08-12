const mongoose = require("mongoose");

const AdAnalyticsSchema = new mongoose.Schema(
    {
        adId: { type: String, required: true, unique: true, index: true },
        adType: { type: String, required: true },
        views: { type: Number, default: 0 },
        totalDurationSeconds: { type: Number, default: 0 },
        sectionViews: { type: Map, of: Number, default: {} },
    },
    { versionKey: false }
);

module.exports = mongoose.model("AdAnalytics", AdAnalyticsSchema);
