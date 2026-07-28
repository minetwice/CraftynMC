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

        // Profile customization
        displayName: { type: String, default: null, maxlength: 32 },
        bio: { type: String, default: "", maxlength: 160 },
        description: { type: String, default: "", maxlength: 500 },
        logoPngBase64: { type: String, default: null },

        // Skin data
        skinPngBase64: { type: String, default: null },
        skinModel: { type: String, enum: ["classic", "slim"], default: "classic" },
        skinUpdatedAt: { type: Date, default: null },

        capePngBase64: { type: String, default: null },

        cosmetics: { type: [CosmeticSchema], default: [] },

        coins: { type: Number, default: 0 },

        role: {
            type: String,
            enum: ["user", "moderator", "admin", "superadmin"],
            default: "user",
        },
        permissions: {
            canUploadSkins: { type: Boolean, default: true },
            canUploadCapes: { type: Boolean, default: false },
            canAccessPremiumMods: { type: Boolean, default: false },
            canAccessPremiumPlugins: { type: Boolean, default: false },
            canGiftCoins: { type: Boolean, default: false },
            canBanUsers: { type: Boolean, default: false },
            canEditUsers: { type: Boolean, default: false },
        },

        isBanned: { type: Boolean, default: false },
        bannedAt: { type: Date, default: null },
        bannedBy: { type: String, default: null },
        banReason: { type: String, default: null },
        banExpiresAt: { type: Date, default: null },

        lastLogin: { type: Date, default: null },
        loginStreak: { type: Number, default: 0 },
        lastDailyReward: { type: Date, default: null },

        // Rewarded Ads tracking
        dailyAdsWatchedCount: { type: Number, default: 0 },
        lastAdWatchedTime: { type: Date, default: null },

        activeSessionToken: { type: String, default: null },
        sessionLockedAt: { type: Date, default: null },

        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

UserSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("User", UserSchema);
