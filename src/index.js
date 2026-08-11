require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db");
const { loadOrCreateKeypair } = require("./utils/keys");

const authRoutes = require("./routes/auth");
const skinRoutes = require("./routes/skins");
const coinRoutes = require("./routes/coins");
const adminRoutes = require("./routes/admin");
const profileRoutes = require("./routes/profile");
const assetRoutes = require("./routes/assets");
const adsRoutes = require("./routes/ads");
const buildYggdrasilRouter = require("./routes/yggdrasil");

async function main() {
    const dbConnected = await connectDB();
    const keys = await loadOrCreateKeypair();

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const serverName = process.env.SERVER_NAME || "FearLauncher Network";

    const app = express();
    app.use(cors());

    app.use(express.static(path.join(__dirname, "..", "public")));

    // Pass database connection status to routes
    const routeOptions = { dbConnected };
    
    app.use("/", authRoutes(routeOptions));
    app.use("/", skinRoutes(routeOptions));
    app.use("/", coinRoutes(routeOptions));
    app.use("/", adminRoutes(routeOptions));
    app.use("/", profileRoutes(routeOptions));
    app.use("/", assetRoutes(routeOptions));
    app.use("/", adsRoutes(routeOptions));

    app.use("/yggdrasil", buildYggdrasilRouter({ keys, publicBaseUrl, serverName }));

    app.get("/health", (req, res) => res.json({ ok: true, dbConnected }));

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`[server] Listening on port ${port}`);
        console.log(`[server] Public base URL: ${publicBaseUrl}`);
        console.log(`[server] authlib-injector URL to use in the app: ${publicBaseUrl}`);
        if (!dbConnected) {
            console.log("[server] ⚠️  Running in demo mode - some features may be limited");
        }
    });
}

main().catch((err) => {
    console.error("[fatal] Server failed to start:", err);
    process.exit(1);
});
