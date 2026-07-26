const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        accessToken: { type: String, required: true, unique: true, index: true },
        clientToken: { type: String, required: true },
        valid: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        // Set when a server the player joined needs to verify them (hasJoined flow)
        pendingServerId: { type: String, default: null },
        pendingServerJoinedAt: { type: Date, default: null },
    },
    { versionKey: false }
);

module.exports = mongoose.model("GameSession", GameSessionSchema);
