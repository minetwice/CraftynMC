const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Asset = require("../models/Asset");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

// Set up local fallback directory for zero-cost uploads
const UPLOADS_DIR = path.join(__dirname, "..", "..", "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Simple disk-storage for robust, cost-free local uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
});

// Admin check helper
const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin" || req.user.username === "Twicefear")) {
        return next();
    }
    return res.status(403).json({ error: "Access denied. Admin role required." });
};

// 1. Get all assets (public)
router.get("/api/assets", async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const assets = await Asset.find(filter).sort({ createdAt: -1 });
        res.json({ assets });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch assets" });
    }
});

const assetFieldsUpload = upload.fields([
    { name: "file", maxCount: 1 },
    { name: "icon", maxCount: 1 },
    { name: "preview", maxCount: 1 },
]);

// 2. Add an asset (Admin-only)
router.post("/admin/assets", requireAuth, isAdmin, assetFieldsUpload, async (req, res) => {
    try {
        const { name, description, category, version, supportedVersions, coinCost } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: "Name and Category are required." });
        }

        if (!["mods", "plugins", "resources", "shaders", "capes", "cosmetics"].includes(category)) {
            return res.status(400).json({ error: "Invalid category." });
        }

        const files = req.files || {};
        const assetFile = files.file ? files.file[0] : null;
        const iconFile = files.icon ? files.icon[0] : null;
        const previewFile = files.preview ? files.preview[0] : null;

        if (!assetFile && !["capes", "cosmetics"].includes(category)) {
            return res.status(400).json({ error: "Asset file is required." });
        }

        const downloadUrl = assetFile ? `/uploads/${assetFile.filename}` : (iconFile ? `/uploads/${iconFile.filename}` : "");
        const iconUrl = iconFile ? `/uploads/${iconFile.filename}` : "";
        const previewUrl = previewFile ? `/uploads/${previewFile.filename}` : "";

        let parsedVersions = ["1.20.1", "1.20.4", "1.19.4"];
        if (supportedVersions) {
            if (Array.isArray(supportedVersions)) {
                parsedVersions = supportedVersions;
            } else if (typeof supportedVersions === "string") {
                parsedVersions = supportedVersions.split(",").map((v) => v.trim()).filter(Boolean);
            }
        }

        const asset = await Asset.create({
            name,
            description: description || "",
            category,
            version: version || "1.0.0",
            supportedVersions: parsedVersions,
            downloadUrl,
            iconUrl,
            previewUrl,
            fileSize: assetFile ? assetFile.size : 0,
            coinCost: parseInt(coinCost) || 0,
            uploadedBy: req.user.username,
        });

        res.status(201).json({ success: true, asset });
    } catch (err) {
        console.error("[asset-upload]", err);
        res.status(500).json({ error: "Internal server error during asset creation." });
    }
});

// 3. Delete an asset (Admin-only)
router.delete("/admin/assets/:id", requireAuth, isAdmin, async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ error: "Asset not found." });
        }

        // Clean up locally stored file
        if (asset.downloadUrl.startsWith("/uploads/")) {
            const filename = asset.downloadUrl.replace("/uploads/", "");
            const filePath = path.join(UPLOADS_DIR, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Asset.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Asset deleted successfully." });
    } catch (err) {
        console.error("[asset-delete]", err);
        res.status(500).json({ error: "Failed to delete asset." });
    }
});

// 4. Download/Purchase asset endpoint for users
router.post("/api/assets/:id/download", requireAuth, async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ error: "Asset not found." });
        }

        // Check if there is a coin cost
        if (asset.coinCost > 0) {
            if (req.user.coins < asset.coinCost) {
                return res.status(402).json({ error: "Insufficient coins to purchase this asset." });
            }

            // Deduct coins from user balance
            req.user.coins -= asset.coinCost;
            await req.user.save();
        }

        asset.downloadsCount = (asset.downloadsCount || 0) + 1;
        await asset.save();

        res.json({ success: true, downloadUrl: asset.downloadUrl, downloadsCount: asset.downloadsCount, userCoins: req.user.coins });
    } catch (err) {
        console.error("[asset-purchase]", err);
        res.status(500).json({ error: "Failed to process download request." });
    }
});

module.exports = router;
