const mongoose = require("mongoose");

// One review per user per project (rating 1-5 + optional text).
const ReviewSchema = new mongoose.Schema(
    {
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        username: { type: String, default: "" },
        rating: { type: Number, min: 1, max: 5, required: true },
        text: { type: String, default: "", maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

ReviewSchema.index({ assetId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
