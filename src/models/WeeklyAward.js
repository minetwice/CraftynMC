const mongoose = require("mongoose");

// Records the weekly leaderboard prize that was handed out, so the lazy
// award runs exactly once per week rollover.
const WeeklyAwardSchema = new mongoose.Schema({
    week: { type: String, required: true, index: true }, // YYYY-MM-DD (Monday of the awarded week)
    board: { type: String, default: "coins", index: true }, // "coins" | "online"
    winners: {
        type: [
            {
                username: String,
                coins: Number,
                prize: Number,
                _id: false,
            },
        ],
        default: [],
    },
    awardedAt: { type: Date, default: Date.now },
});

// One award per week per board — this is what makes the payout idempotent.
WeeklyAwardSchema.index({ week: 1, board: 1 }, { unique: true });

module.exports = mongoose.model("WeeklyAward", WeeklyAwardSchema);
