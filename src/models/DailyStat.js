const mongoose = require("mongoose");

// One document per calendar day, used by the admin analytics panel.
const DailyStatSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
    logins: { type: [String], default: [] },      // usernames who logged in that day
    onlineUsers: { type: [String], default: [] }, // usernames seen online that day
    newUsers: { type: Number, default: 0 },       // registrations that day
});

module.exports = mongoose.model("DailyStat", DailyStatSchema);
