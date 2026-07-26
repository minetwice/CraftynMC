const express = require("express");
const multer = require("multer");

const User = require("../models/User");
const Upload = require("../models/Upload");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(express.json());

// Max size for thumbnail uploads (e.g. 1MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

// Helper to check if a buffer is PNG or JPG/JPEG
function isImage(buffer) {
    if (!buffer || buffer.length < 4) return false;
    // PNG sig: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
    // JPEG sig: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    return false;
}

// 1. GET /api/uploads - Public approved list
router.get("/api/uploads", async (req, res) => {
    try {
        const approvedList = await Upload.find({ status: "approved" }).sort({ createdAt: -1 });
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
router.post("/api/uploads", requireAuth, upload.single("thumbnail"), async (req, res) => {
    try {
        const { title, description, videoLink, version } = req.body || {};

        if (!title || !title.trim()) {
            return res.status(400).json({ error: "Title is required." });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ error: "Description is required." });
        }
        if (!version || !version.trim()) {
            return res.status(400).json({ error: "Minecraft version selection is required." });
        }

        let thumbnailBase64 = null;
        if (req.file) {
            if (!isImage(req.file.buffer)) {
                return res.status(400).json({ error: "Thumbnail must be a valid PNG or JPG/JPEG image." });
            }
            thumbnailBase64 = req.file.buffer.toString("base64");
        }

        const newUpload = await Upload.create({
            title: title.trim(),
            description: description.trim(),
            videoLink: (videoLink || "").trim(),
            version: version.trim(),
            thumbnailBase64,
            status: "pending", // starts as draft/pending
            uploader: req.user._id,
            uploaderUsername: req.user.username,
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

module.exports = router;
