const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
    {
        serverName: { type: String, default: "CraftynMC Network" },
        startingCoins: { type: Number, default: 100 },
        dailyRewardCoins: { type: Number, default: 100 },
    },
    { versionKey: false }
);

module.exports = mongoose.model("Settings", SettingsSchema);
