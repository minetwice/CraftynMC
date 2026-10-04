const express = require("express");
const multer = require("multer");

const User = require("../models/User");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// Skins are small (64x64 or 64x32 PNGs, usually a few KB), so an in-memory
// multer buffer capped at 512KB is more than enough and avoids touching disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 512 * 1024 } });

function isPng(buffer) {
    // PNG magic number check: 89 50 4E 47 0D 0A 1A 0A
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return buffer.length > 8 && buffer.subarray(0, 8).equals(sig);
}

// ---- Upload a new skin (requires website login) ----
router.post("/api/skin", requireAuth, upload.single("skin"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded under field name 'skin'." });
    if (!isPng(req.file.buffer)) return res.status(400).json({ error: "File must be a valid PNG." });

    const model = req.body.model === "slim" ? "slim" : "classic";

    req.user.skinPngBase64 = req.file.buffer.toString("base64");
    req.user.skinModel = model;
    req.user.skinUpdatedAt = new Date();
    await req.user.save();

    res.json({ success: true, skinModel: model, skinUpdatedAt: req.user.skinUpdatedAt });
});

// ---- Upload a cape (optional, same idea) ----
router.post("/api/cape", requireAuth, upload.single("cape"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded under field name 'cape'." });
    if (!isPng(req.file.buffer)) return res.status(400).json({ error: "File must be a valid PNG." });

    req.user.capePngBase64 = req.file.buffer.toString("base64");
    await req.user.save();

    res.json({ success: true });
});

// ---- Remove active skin (reverts to default Steve/Alex) ----
router.delete("/api/skin", requireAuth, async (req, res) => {
    req.user.skinPngBase64 = null;
    req.user.skinUpdatedAt = new Date();
    await req.user.save();
    res.json({ success: true });
});

// ---- Remove active cape ----
router.delete("/api/cape", requireAuth, async (req, res) => {
    req.user.capePngBase64 = null;
    await req.user.save();
    res.json({ success: true });
});

// ---- Public, unauthenticated PNG serving. This is the URL the game itself downloads from. ----
// FIX: the launcher asks for BOTH /skins/<uuid>.png and /skins/<username>.png (its account
// list and its "other players" path build the URL from the username). The old handler only
// looked the value up as a UUID, so every username URL 404'd. It now accepts a dashed UUID,
// an undashed UUID, or a username.
function toDashed(key) {
    const undashed = key.replace(/-/g, "").toLowerCase();
    if (undashed.length !== 32) return null;
    return [
        undashed.substring(0, 8),
        undashed.substring(8, 12),
        undashed.substring(12, 16),
        undashed.substring(16, 20),
        undashed.substring(20, 32),
    ].join("-");
}

router.get("/skins/:file", async (req, res) => {
    const isCape = req.params.file.endsWith("_cape.png");
    const key = req.params.file.replace(/_cape\.png$/, "").replace(/\.png$/, "");
    const undashed = key.replace(/-/g, "").toLowerCase();
    const dashed = toDashed(key);

    let user = null;
    if (dashed) user = await User.findOne({ uuid: dashed });
    if (!user) user = await User.findOne({ uuid: undashed });
    if (!user) user = await User.findOne({ username: key });
    if (!user) return res.status(404).end();

    const base64 = isCape ? user.capePngBase64 : user.skinPngBase64;
    if (!base64) return res.status(404).end();

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=60"); // short cache, skins can change
    res.send(Buffer.from(base64, "base64"));
});

// ---- Same thing, but explicitly keyed by username. ----
router.get("/skins/name/:username.png", async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user || !user.skinPngBase64) return res.status(404).end();

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=60");
    res.send(Buffer.from(user.skinPngBase64, "base64"));
});

module.exports = router;
