const mongoose = require("mongoose");

const UploadSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        videoLink: { type: String, trim: true, default: "" },
        thumbnailBase64: { type: String, default: null }, // user uploaded thumbnail or custom cover
        version: { type: String, required: true, trim: true }, // Minecraft version (e.g., 1.20.1)
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        feedback: { type: String, default: "" }, // Feedback from the admin/owner
        uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        uploaderUsername: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model("Upload", UploadSchema);
