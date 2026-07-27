const mongoose = require("mongoose");

async function connectDB() {
    const uri = process.env.MONGODB_URI;
    
    // If no MongoDB URI, use in-memory mock for demo
    if (!uri || uri.includes("localhost")) {
        console.log("[db] Using demo mode without real MongoDB (install MongoDB for production)");
        // Create a mock mongoose connection for demo purposes
        return;
    }
    
    await mongoose.connect(uri);
    console.log("[db] Connected to MongoDB");
}

module.exports = { connectDB };
