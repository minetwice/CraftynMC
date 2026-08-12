const mongoose = require("mongoose");

const LinkSchema = new mongoose.Schema(
    {
        label: { type: String, required: true },
        url: { type: String, required: true },
    },
    { _id: false }
);

const LauncherSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, default: "FearLauncher" },
        description: { type: String, default: "" }, // Supports code formatting / markdown
        imageUrl: { type: String, default: "" }, // Custom cover / description image
        downloadUrl: { type: String, required: true },
        links: { type: [LinkSchema], default: [] }, // Extra companion links (Discord, Java, etc.)
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

LauncherSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Launcher", LauncherSchema);
