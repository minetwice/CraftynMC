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

        isAdmin: { type: Boolean, default: false },

        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model("User", UserSchema);
