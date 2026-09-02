require("dotenv").config();

const path = require("path");
const fs = require("fs");
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
    await connectDB();
    const keys = await loadOrCreateKeypair();

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const serverName = process.env.SERVER_NAME || "FearLauncher Network";

    const app = express();
    app.use(cors());

    const publicDir = path.join(__dirname, "..", "public");

    // Serve index.html with pointer-fix.js injected
    app.get("/", (req, res) => {
        let html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
        if (!html.includes("pointer-fix.js")) {
            html = html.replace("</body>", '<script src="/js/pointer-fix.js"></script>\n</body>');
        }
        res.send(html);
    });

    app.use(express.static(publicDir));

    app.use("/", authRoutes);
    app.use("/", skinRoutes);
    app.use("/", coinRoutes);
    app.use("/", adminRoutes);
    app.use("/", profileRoutes);
    app.use("/", assetRoutes);
    app.use("/", adsRoutes);

    app.use("/yggdrasil", buildYggdrasilRouter({ keys, publicBaseUrl, serverName }));

    app.get("/health", (req, res) => res.json({ ok: true }));

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`[server] Listening on port ${port}`);
        console.log(`[server] Public base URL: ${publicBaseUrl}`);
        console.log(`[server] authlib-injector URL to use in the app: ${publicBaseUrl}`);
    });
}

main().catch((err) => {
    console.error("[fatal] Server failed to start:", err);
    process.exit(1);
});