const mongoose = require("mongoose");

const SkinSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        skinPngBase64: { type: String, default: null }, // Direct Base64 storage
        filePath: { type: String, default: null },       // Local storage path if any
        variant: { type: String, enum: ["classic", "slim"], default: "classic" },
        checksum: { type: String, default: null },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

SkinSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Skin", SkinSchema);
