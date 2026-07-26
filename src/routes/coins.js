const express = require("express");

const CoinTransaction = require("../models/CoinTransaction");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

// ---- Wallet ----
router.get("/api/coins", requireAuth, async (req, res) => {
    res.json({ coins: req.user.coins });
});

router.get("/api/coins/history", requireAuth, async (req, res) => {
    const history = await CoinTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(history);
});

// ---- Cosmetics inventory (equip/unequip). Buying cosmetics with coins would plug in here
// ---- once you define a cosmetics catalog (id, name, price) - not built yet, this is the
// ---- foundation: storing what a player owns and which one is equipped. ----
router.get("/api/cosmetics", requireAuth, async (req, res) => {
    res.json({ cosmetics: req.user.cosmetics });
});

router.post("/api/cosmetics/:cosmeticId/equip", requireAuth, async (req, res) => {
    const { cosmeticId } = req.params;
    const owns = req.user.cosmetics.some((c) => c.cosmeticId === cosmeticId);
    if (!owns) return res.status(404).json({ error: "You don't own this cosmetic." });

    req.user.cosmetics.forEach((c) => {
        c.equipped = c.cosmeticId === cosmeticId;
    });
    await req.user.save();
    res.json({ success: true, cosmetics: req.user.cosmetics });
});

module.exports = router;
