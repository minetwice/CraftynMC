const mongoose = require("mongoose");

async function connectDB() {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fearlauncher";
    
    try {
        console.log("[db] Attempting to connect to MongoDB...");
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 2000 // 2 seconds timeout for fast failover/fallback
        });
        console.log("[db] Connected to MongoDB");
        return true;
    } catch (err) {
        console.error("[db] MongoDB connection error:", err.message || err);
        console.log("[db] Falling back to unconnected/demo mode (install/run MongoDB for production features)");
        return false;
    }
}

module.exports = { connectDB };
