const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        category: {
            type: String,
            required: true,
            enum: ["mods", "plugins", "resources", "shaders", "capes", "cosmetics"],
            index: true,
        },
        version: { type: String, default: "1.0.0" },
        supportedVersions: { type: [String], default: ["1.20.1", "1.20.4", "1.19.4"] },
        downloadUrl: { type: String, required: true },
        iconUrl: { type: String, default: "" },
        previewUrl: { type: String, default: "" },
        downloadsCount: { type: Number, default: 0 },
        fileSize: { type: Number, default: 0 }, // in bytes
        coinCost: { type: Number, default: 0 }, // price in coins, 0 for free
        uploadedBy: { type: String, default: "System" },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

AssetSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Asset", AssetSchema);
