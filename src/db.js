const mongoose = require("mongoose");

let demoMode = false;

async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn("[db] MONGODB_URI is not set — running in demo mode. Set MONGODB_URI in env for production.");
        demoMode = true;
        return;
    }
    mongoose.set("strictQuery", true);
    try {
        console.log("[db] Attempting to connect to MongoDB...");
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 2000,
        });
        console.log("[db] Connected to MongoDB");
    } catch (err) {
        console.warn("[db] MongoDB connection failed, falling back to demo mode:", err.message || err);
        console.warn("[db] Falling back to unconnected/demo mode (install/run MongoDB for production features)");
        demoMode = true;
    }
}

function isDemoMode() {
    return demoMode;
}

module.exports = { connectDB, isDemoMode };
