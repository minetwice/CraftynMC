const mongoose = require("mongoose");

const VisitLogSchema = new mongoose.Schema(
    {
        path: { type: String, required: true },
        // Hashed, not the raw IP - enough to estimate "unique" visits without storing raw PII.
        ipHash: { type: String, required: true, index: true },
        userAgent: { type: String, default: "" },
        // Set if the visit happened while logged in.
        username: { type: String, default: null },
        createdAt: { type: Date, default: Date.now, index: true },
    },
    { versionKey: false }
);

module.exports = mongoose.model("VisitLog", VisitLogSchema);
