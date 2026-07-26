const mongoose = require("mongoose");

const UploadSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        videoLink: { type: String, trim: true, default: "" },
        thumbnailBase64: { type: String, default: null }, // user uploaded thumbnail or custom cover
        version: { type: String, required: true, trim: true }, // Minecraft version (e.g., 1.20.1)
        assetType: { type: String, enum: ["mod", "resourcepack", "plugin"], default: "mod" },
        accessType: { type: String, enum: ["free", "premium"], default: "free" },
        price: { type: Number, default: 0 }, // price in coins if premium
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        feedback: { type: String, default: "" }, // Feedback from the admin/owner
        uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        uploaderUsername: { type: String, required: true },
        fileName: { type: String, default: "" },
        filePath: { type: String, default: "" },
        fileSize: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model("Upload", UploadSchema);
