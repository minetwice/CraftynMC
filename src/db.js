const mongoose = require("mongoose");

/**
 * Connects to MongoDB.
 *
 * FIX: the previous version short-circuited with "demo mode" whenever the URI was
 * missing OR merely CONTAINED "localhost":
 *
 *     if (!uri || uri.includes("localhost")) { console.log("demo mode"); return; }
 *
 * That never called mongoose.connect(), so every query buffered for 10s and then
 * threw "Operation `users.findOne()` buffering timed out", which crashed the whole
 * Node process (see server.log). That is why login and /skins/... failed and no
 * skin ever reached the launcher. It also fired even when a local MongoDB WAS
 * running, because the check looked at the string, not the connection.
 *
 * This version actually connects, and fails loudly if it cannot.
 */
async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error("[db] MONGODB_URI is not set. Add it to your environment (.env) before starting.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log("[db] Connected to MongoDB");
    } catch (err) {
        console.error("[db] Failed to connect to MongoDB:", err.message);
        process.exit(1);
    }
}

module.exports = { connectDB };
