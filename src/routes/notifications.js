const express = require("express");

const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// ---- my notifications (+ unread count) ----
router.get("/api/notifications", requireAuth, async (req, res) => {
    try {
        const me = req.user.username;
        const [list, unread] = await Promise.all([
            Notification.find({ user: me }).sort({ createdAt: -1 }).limit(40).lean(),
            Notification.countDocuments({ user: me, read: false }),
        ]);
        res.json({ success: true, unread, notifications: list });
    } catch (err) {
        res.status(500).json({ error: "Could not load notifications." });
    }
});

// ---- cheap poll for the bell badge ----
router.get("/api/notifications/count", requireAuth, async (req, res) => {
    try {
        const unread = await Notification.countDocuments({ user: req.user.username, read: false });
        res.json({ success: true, unread });
    } catch (err) {
        res.status(500).json({ error: "Could not count notifications." });
    }
});

// ---- mark read: one, or all ----
router.post("/api/notifications/read", requireAuth, async (req, res) => {
    try {
        const me = req.user.username;
        const id = req.body && req.body.id;
        if (id) await Notification.updateOne({ _id: id, user: me }, { $set: { read: true } });
        else await Notification.updateMany({ user: me, read: false }, { $set: { read: true } });
        const unread = await Notification.countDocuments({ user: me, read: false });
        res.json({ success: true, unread });
    } catch (err) {
        res.status(500).json({ error: "Could not update notifications." });
    }
});

// ---- clear them all ----
router.delete("/api/notifications", requireAuth, async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user.username });
        res.json({ success: true, unread: 0 });
    } catch (err) {
        res.status(500).json({ error: "Could not clear notifications." });
    }
});

module.exports = router;
