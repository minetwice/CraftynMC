require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db");
const { loadOrCreateKeypair } = require("./utils/keys");
const VisitLog = require("./models/VisitLog");

const authRoutes = require("./routes/auth");
const skinRoutes = require("./routes/skins");
const coinRoutes = require("./routes/coins");
const adminRoutes = require("./routes/admin");
const buildYggdrasilRouter = require("./routes/yggdrasil");

function hashIp(ip) {
    return crypto.createHash("sha256").update(String(ip) + (process.env.JWT_SECRET || "")).digest("hex").slice(0, 32);
}

async function main() {
    await connectDB();
    const keys = loadOrCreateKeypair();

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const serverName = process.env.SERVER_NAME || "FearLauncher Network";

    const app = express();
    app.set("trust proxy", true); // Render sits behind a proxy - needed so req.ip / x-forwarded-for are accurate
    app.use(cors());

    // ---- Lightweight visit tracking (homepage loads only, not every API ping) ----
    app.get("/", (req, res, next) => {
        const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
        VisitLog.create({
            path: "/",
            ipHash: hashIp(ip),
            userAgent: (req.headers["user-agent"] || "").slice(0, 200),
        }).catch((e) => console.warn("[visitlog] failed to record visit:", e.message));
        next();
    });

    // Simple static website (login/register/skin upload/admin pages) lives in /public
    app.use(express.static(path.join(__dirname, "..", "public")));

    // Website API (JWT-based)
    app.use("/", authRoutes);
    app.use("/", skinRoutes);
    app.use("/", coinRoutes);
    app.use("/", adminRoutes);

    // Everything the actual Minecraft game / authlib-injector talks to
    app.use("/", buildYggdrasilRouter({ keys, publicBaseUrl, serverName }));

    app.get("/health", (req, res) => res.json({ ok: true }));

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`[server] Listening on port ${port}`);
        console.log(`[server] Public base URL: ${publicBaseUrl}`);
        console.log(`[server] authlib-injector URL to use in the app: ${publicBaseUrl}`);
        if (!process.env.ADMIN_PASSWORD) {
            console.warn("[server] WARNING: ADMIN_PASSWORD is not set - the admin dashboard login will always fail until you set it.");
        }
    });
}

main().catch((err) => {
    console.error("[fatal] Server failed to start:", err);
    process.exit(1);
});
