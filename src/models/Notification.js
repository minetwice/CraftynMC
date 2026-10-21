const mongoose = require("mongoose");

// A single notification for one player.
//   type: follow | review | coins | featured | system
const NotificationSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, index: true },   // recipient username
        type: { type: String, default: "system" },
        title: { type: String, required: true, maxlength: 120 },
        body: { type: String, default: "", maxlength: 300 },
        link: { type: String, default: "" },                    // e.g. /player/name
        read: { type: Boolean, default: false, index: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
