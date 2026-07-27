const mongoose = require("mongoose");

const CosmeticSchema = new mongoose.Schema(
    {
        cosmeticId: { type: String, required: true }, // e.g. "wings_angel", "hat_crown"
        name: { type: String, required: true },
        equipped: { type: Boolean, default: false },
        acquiredAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, index: true, trim: true },
        // Minecraft-compatible UUID (dashed), derived once at registration and never changed,
        // so the game and website always agree on who a player is.
        uuid: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },

        // Skin data. We store the PNG bytes directly in MongoDB (base64) so it survives
        // redeploys on free hosting tiers that wipe local disk on every restart.
        skinPngBase64: { type: String, default: null },
        skinModel: { type: String, enum: ["classic", "slim"], default: "classic" }, // classic = Steve, slim = Alex
        skinUpdatedAt: { type: Date, default: null },

        capePngBase64: { type: String, default: null },

        cosmetics: { type: [CosmeticSchema], default: [] },

        coins: { type: Number, default: 0 },

        // Admin & Role System
        role: { 
            type: String, 
            enum: ["user", "moderator", "admin", "superadmin"], 
            default: "user" 
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

        // Ban System
        isBanned: { type: Boolean, default: false },
        bannedAt: { type: Date, default: null },
        bannedBy: { type: String, default: null }, // admin username
        banReason: { type: String, default: null },
        banExpiresAt: { type: Date, default: null }, // null = permanent

        // Login tracking
        lastLogin: { type: Date, default: null },
        loginStreak: { type: Number, default: 0 },
        lastDailyReward: { type: Date, default: null },

        // Session lock for admin account
        activeSessionToken: { type: String, default: null },
        sessionLockedAt: { type: Date, default: null },

        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("User", UserSchema);
