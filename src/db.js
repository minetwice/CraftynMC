const mongoose = require("mongoose");

async function connectDB() {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fearlauncher";
    
    try {
        console.log("[db] Attempting to connect to MongoDB...");
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout
        });
        console.log("[db] Connected to MongoDB successfully!");
        return true;
    } catch (err) {
        console.error("[db] MongoDB connection error:", err.message || err);
        console.log("[db] ⚠️  Running in DEMO MODE - Database features disabled");
        console.log("[db] 💡 To enable full features, set up MongoDB Atlas:");
        console.log("[db]    1. Go to https://cloud.mongodb.com");
        console.log("[db]    2. Create a free cluster");
        console.log("[db]    3. Get your connection string");
        console.log("[db]    4. Set MONGODB_URI environment variable");
        return false;
    }
}

module.exports = { connectDB };
