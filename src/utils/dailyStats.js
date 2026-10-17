const DailyStat = require("../models/DailyStat");

function dayKey(d) {
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function todayKey() {
    return dayKey(new Date());
}

// All three are best-effort: analytics must never break login / presence.
async function recordLogin(username) {
    if (!username) return;
    try {
        await DailyStat.updateOne({ date: todayKey() }, { $addToSet: { logins: String(username) } }, { upsert: true });
    } catch (e) {}
}

async function recordOnline(username) {
    if (!username) return;
    try {
        await DailyStat.updateOne({ date: todayKey() }, { $addToSet: { onlineUsers: String(username) } }, { upsert: true });
    } catch (e) {}
}

async function recordNewUser() {
    try {
        await DailyStat.updateOne({ date: todayKey() }, { $inc: { newUsers: 1 } }, { upsert: true });
    } catch (e) {}
}

module.exports = { todayKey, dayKey, recordLogin, recordOnline, recordNewUser };
