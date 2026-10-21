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

        isSuspended: { type: Boolean, default: false },
        suspendedAt: { type: Date, default: null },
        suspendedBy: { type: String, default: null },
        suspendReason: { type: String, default: null },
        suspendExpiresAt: { type: Date, default: null },

        lastLogin: { type: Date, default: null },
        lastSeen: { type: Date, default: null },
        lastSource: { type: String, default: "" }, // "web" | "launcher"
        sessionStart: { type: Date, default: null }, // when the current online session began
        onlineSeconds: { type: Number, default: 0 }, // total time online (web + launcher), for the leaderboard
        lastAdRewardAt: { type: Date, default: null }, // last "watch ad for coins" claim
        adRewardsToday: { type: Number, default: 0 },
        adRewardsDate: { type: String, default: "" }, // YYYY-MM-DD that adRewardsToday belongs to
        adStreak: { type: Number, default: 0 },       // consecutive days with at least one ad
        adStreakDate: { type: String, default: "" },  // last day the streak was extended
        premium: { type: Boolean, default: false },   // bought with coins (badge)
        adFreeUntil: { type: Date, default: null },   // bought with coins (ad-free pass)
        referralCode: { type: String, default: "", index: true },
        referredBy: { type: String, default: "" },
        referralCount: { type: Number, default: 0 },
        streakFreezes: { type: Number, default: 0 }, // bought with coins; saves a missed daily streak
        loginStreak: { type: Number, default: 0 },
        lastDailyReward: { type: Date, default: null },

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
