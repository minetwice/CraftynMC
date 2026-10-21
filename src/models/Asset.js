const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        category: {
            type: String,
            required: true,
            enum: ["mods", "plugins", "resources", "shaders", "capes", "cosmetics", "launcher"],
            index: true,
        },
        version: { type: String, default: "1.0.0" },
        lore: { type: String, default: "" },
        supportedVersions: { type: [String], default: ["1.20.1", "1.20.4", "1.19.4"] },
        loaders: { type: [String], default: [] },
        licence: { type: String, default: "" },      // e.g. "MIT", "All Rights Reserved" (see /legal/licence)
        environment: { type: String, default: "" },   // "client" | "server" | "both" | "" (Modrinth-style)
        links: { type: [String], default: [] },       // "Label|https://..." rows shown on the project page
        driveUrl: { type: String, default: "" },
        downloadUrl: { type: String, required: true },
        iconUrl: { type: String, default: "" },
        previewUrl: { type: String, default: "" },
        downloadsCount: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        featuredUntil: { type: Date, default: null }, // pinned to the top of its category while in the future
        ratingAvg: { type: Number, default: 0 },      // denormalised review average (1-5)
        ratingCount: { type: Number, default: 0 },
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
