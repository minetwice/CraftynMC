const mongoose = require("mongoose");

const CoinTransactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        amount: { type: Number, required: true }, // positive = credit, negative = debit
        reason: { type: String, required: true }, // e.g. "daily_login", "cosmetic_purchase:wings_angel"
        balanceAfter: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model("CoinTransaction", CoinTransactionSchema);
