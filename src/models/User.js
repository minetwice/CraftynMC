const mongoose = require("mongoose");

const CosmeticSchema = new mongoose.Schema(
    {
        cosmeticId: { type: String, required: true },
        name: { type: String, required: true },
        equipped: { type: Boolean, default: false },
        acquiredAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, index: true, trim: true },
        uuid: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },

        skinPngBase64: { type: String, default: null },
        skinModel: { type: String, enum: ["classic", "slim"], default: "classic" },
        skinUpdatedAt: { type: Date, default: null },

        capePngBase64: { type: String, default: null },

        cosmetics: { type: [CosmeticSchema], default: [] },

        coins: { type: Number, default: 0 },

        lastDailyRewardAt: { type: Date, default: null },
        dailyRewardStreak: { type: Number, default: 0 },

        isAdmin: { type: Boolean, default: false },

        // ---- Profile info (added for the account edit + admin dashboard) ----
        country: { type: String, default: null }, // ISO country code, e.g. "IN", "US"
        gender: { type: String, enum: ["male", "female", "other", null], default: null },

        // ---- Moderation ----
        banned: { type: Boolean, default: false },
        banReason: { type: String, default: null },
        bannedAt: { type: Date, default: null },

        // ---- Activity tracking (shown on the admin dashboard) ----
        lastLoginAt: { type: Date, default: null },
        lastLoginIp: { type: String, default: null },

        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model("User", UserSchema);
