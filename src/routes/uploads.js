const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const User = require("../models/User");
const Upload = require("../models/Upload");
const CoinTransaction = require("../models/CoinTransaction");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

const fs = require("fs");
const path = require("path");

// Ensure public/files directory exists
const filesDir = path.join(__dirname, "..", "..", "public", "files");
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}

// Support both thumbnail and assetFile
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // Max 100MB
});
const fieldsUpload = upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "assetFile", maxCount: 1 }
]);

// Helper to check if a buffer is PNG or JPG/JPEG
function isImage(buffer) {
    if (!buffer || buffer.length < 4) return false;
    // PNG sig: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
    // JPEG sig: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    return false;
}

// 1. GET /api/uploads - Public approved list (with optional ?type=mod|resourcepack|plugin filter)
router.get("/api/uploads", async (req, res) => {
    try {
        const query = { status: "approved" };
        if (req.query.type && ["mod", "resourcepack", "plugin"].includes(req.query.type)) {
            query.assetType = req.query.type;
        }
        const approvedList = await Upload.find(query).sort({ createdAt: -1 });
        res.json(approvedList);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch uploads." });
    }
});

// 2. GET /api/uploads/my - Logged-in user's uploads
router.get("/api/uploads/my", requireAuth, async (req, res) => {
    try {
        const myList = await Upload.find({ uploader: req.user._id }).sort({ createdAt: -1 });
        res.json(myList);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch your uploads." });
    }
});

// 3. GET /api/uploads/admin - Admin view of all uploads
router.get("/api/uploads/admin", requireAuth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const allList = await Upload.find({}).sort({ createdAt: -1 });
        res.json(allList);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch uploads." });
    }
});

// 4. POST /api/uploads - Create a new upload (Draft style, defaults to pending)
router.post("/api/uploads", requireAuth, fieldsUpload, async (req, res) => {
    try {
        const { title, description, videoLink, version, assetType, accessType, price } = req.body || {};

        if (!title || !title.trim()) {
            return res.status(400).json({ error: "Title is required." });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ error: "Description is required." });
        }
        if (!version || !version.trim()) {
            return res.status(400).json({ error: "Minecraft version selection is required." });
        }

        const typeSelected = ["mod", "resourcepack", "plugin"].includes(assetType) ? assetType : "mod";
        const accessSelected = ["free", "premium"].includes(accessType) ? accessType : "free";
        const coinPrice = accessSelected === "premium" ? Math.max(0, parseInt(price, 10) || 0) : 0;

        let thumbnailBase64 = null;
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            const thumb = req.files.thumbnail[0];
            if (!isImage(thumb.buffer)) {
                return res.status(400).json({ error: "Thumbnail must be a valid PNG or JPG/JPEG image." });
            }
            thumbnailBase64 = thumb.buffer.toString("base64");
        }

        let fileName = "";
        let filePath = "";
        let fileSize = 0;

        if (req.files && req.files.assetFile && req.files.assetFile[0]) {
            const asset = req.files.assetFile[0];
            const uniqueName = Date.now() + "_" + asset.originalname.replace(/[^a-zA-Z0-9._-]/g, "");
            fs.writeFileSync(path.join(filesDir, uniqueName), asset.buffer);
            fileName = asset.originalname;
            filePath = "/files/" + uniqueName;
            fileSize = asset.buffer.length;
        }

        const newUpload = await Upload.create({
            title: title.trim(),
            description: description.trim(),
            videoLink: (videoLink || "").trim(),
            version: version.trim(),
            assetType: typeSelected,
            accessType: accessSelected,
            price: coinPrice,
            thumbnailBase64,
            status: "pending", // starts as draft/pending
            uploader: req.user._id,
            uploaderUsername: req.user.username,
            fileName,
            filePath,
            fileSize
        });

        res.status(201).json({ success: true, upload: newUpload });
    } catch (e) {
        console.error("Error creating upload:", e);
        res.status(500).json({ error: "Failed to create upload." });
    }
});

// 5. POST /api/uploads/:id/approve - Approve an upload
router.post("/api/uploads/:id/approve", requireAuth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const uploadItem = await Upload.findById(req.params.id);
        if (!uploadItem) {
            return res.status(404).json({ error: "Upload not found." });
        }

        uploadItem.status = "approved";
        uploadItem.feedback = ""; // clear feedback on approval
        await uploadItem.save();

        res.json({ success: true, upload: uploadItem });
    } catch (e) {
        res.status(500).json({ error: "Failed to approve upload." });
    }
});

// 6. POST /api/uploads/:id/reject - Reject or give feedback
router.post("/api/uploads/:id/reject", requireAuth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const { feedback } = req.body || {};
        const uploadItem = await Upload.findById(req.params.id);
        if (!uploadItem) {
            return res.status(404).json({ error: "Upload not found." });
        }

        uploadItem.status = "rejected";
        uploadItem.feedback = feedback || "Contains errors or does not match standards.";
        await uploadItem.save();

        res.json({ success: true, upload: uploadItem });
    } catch (e) {
        res.status(500).json({ error: "Failed to reject upload." });
    }
});

// 7. DELETE /api/uploads/:id - Delete an upload
router.delete("/api/uploads/:id", requireAuth, async (req, res) => {
    try {
        const uploadItem = await Upload.findById(req.params.id);
        if (!uploadItem) {
            return res.status(404).json({ error: "Upload not found." });
        }

        // Only uploader themselves or an Admin can delete
        if (!req.user.isAdmin && uploadItem.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Access denied. You cannot delete this upload." });
        }

        await Upload.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete upload." });
    }
});

// 8. GET /api/admin/stats - Admin system status metrics
router.get("/api/admin/stats", requireAuth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const totalUsers = await User.countDocuments({});
        const totalUploads = await Upload.countDocuments({});
        const pendingDrafts = await Upload.countDocuments({ status: "pending" });
        const approvedUploads = await Upload.countDocuments({ status: "approved" });
        const totalTransactions = await CoinTransaction.countDocuments({});

        // Calculate storage
        const uploads = await Upload.find({});
        let totalStorageBytes = 0;
        uploads.forEach(u => {
            totalStorageBytes += (u.fileSize || 0);
        });

        const memory = process.memoryUsage();
        const uptime = process.uptime();

        res.json({
            totalUsers,
            totalUploads,
            pendingDrafts,
            approvedUploads,
            totalTransactions,
            totalStorageBytes,
            dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
            memoryUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
            uptimeSeconds: Math.round(uptime)
        });
    } catch (e) {
        console.error("Stats fetch error:", e);
        res.status(500).json({ error: "Failed to load admin stats." });
    }
});

// 9. GET /api/admin/users - User search list for Admins
router.get("/api/admin/users", requireAuth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const query = {};
        if (req.query.search) {
            query.username = { $regex: req.query.search, $options: "i" };
        }
        const users = await User.find(query).select("-passwordHash").sort({ username: 1 }).limit(100);
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: "Failed to search users." });
    }
});

// 10. POST /api/admin/users/:id/update - Update role / coins / ban status for a user
router.post("/api/admin/users/:id/update", requireAuth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const { isAdmin, coins, isBanned } = req.body || {};
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ error: "User not found." });
        }

        if (typeof isAdmin === "boolean") {
            targetUser.isAdmin = isAdmin;
        }
        if (typeof isBanned === "boolean") {
            targetUser.isBanned = isBanned;
        }
        if (typeof coins === "number" || typeof coins === "string") {
            const parsedCoins = parseInt(coins, 10);
            if (!isNaN(parsedCoins)) {
                targetUser.coins = parsedCoins;
            }
        }

        await targetUser.save();
        res.json({
            success: true,
            user: {
                _id: targetUser._id,
                username: targetUser.username,
                isAdmin: targetUser.isAdmin,
                isBanned: targetUser.isBanned,
                coins: targetUser.coins
            }
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to update user." });
    }
});

module.exports = router;
