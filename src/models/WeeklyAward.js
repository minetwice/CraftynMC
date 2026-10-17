const mongoose = require("mongoose");

// Records the weekly leaderboard prize that was handed out, so the lazy
// award runs exactly once per week rollover.
const WeeklyAwardSchema = new mongoose.Schema({
    week: { type: String, required: true, index: true }, // YYYY-MM-DD (Monday of the awarded week)
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

module.exports = mongoose.model("WeeklyAward", WeeklyAwardSchema);
