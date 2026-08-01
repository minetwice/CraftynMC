const mongoose = require("mongoose");

// Single-document collection - there's only ever one keypair for this server.
const ServerKeypairSchema = new mongoose.Schema(
    {
        _id: { type: String, default: "singleton" },
        privateKey: { type: String, required: true },
        publicKey: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model("ServerKeypair", ServerKeypairSchema);

