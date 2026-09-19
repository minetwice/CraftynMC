const mongoose = require("mongoose");

async function connectDB() {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fearlauncher";
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log("[db] Connected to MongoDB");
    } catch (err) {
        console.log("[db] MongoDB connection skipped/failed, fallback mode");
    }
}

module.exports = { connectDB };
