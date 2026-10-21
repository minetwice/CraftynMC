const mongoose = require("mongoose");

// One row per follow. follower -> following (both usernames).
const FollowSchema = new mongoose.Schema(
    {
        follower: { type: String, required: true, index: true },
        following: { type: String, required: true, index: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

// Nobody can follow the same person twice.
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model("Follow", FollowSchema);
