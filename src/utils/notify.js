const Notification = require("../models/Notification");

/**
 * Drop a notification in someone's bell. Never throws — a failed notification
 * must never break the action that caused it (following, reviewing, ...).
 */
async function notify(user, type, title, body, link) {
    try {
        if (!user || !title) return null;
        return await Notification.create({
            user: String(user),
            type: type || "system",
            title: String(title).slice(0, 120),
            body: String(body || "").slice(0, 300),
            link: String(link || "").slice(0, 200),
        });
    } catch (e) {
        return null;
    }
}

module.exports = { notify };
