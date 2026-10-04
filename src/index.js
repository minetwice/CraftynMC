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
const buildYggdrasilRouter = require("./routes/yggdrasil");

/**
 * Resolves the public base URL used to build skin texture URLs and skinDomains.
 *
 * FIX: this used to trust PUBLIC_BASE_URL verbatim, so a leftover
 * "http://localhost:3000" (or no value at all) produced texture URLs that no
 * client can reach. The live profile response was handing out
 * "http://localhost:3000/skins/<uuid>.png", which resolves to the phone itself,
 * so the skin silently failed to load and the player stayed on the default skin.
 *
 * Prefer an explicit non-local URL, then Render's own RENDER_EXTERNAL_URL (set
 * automatically on Render), and only fall back to localhost for local dev.
 */
function resolvePublicBaseUrl() {
    const explicit = process.env.PUBLIC_BASE_URL;
    if (explicit && !/localhost|127\.0\.0\.1/i.test(explicit)) {
        return explicit.replace(/\/+$/, "");
    }
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, "");
    }
    return `http://localhost:${process.env.PORT || 3000}`;
}

async function main() {
    await connectDB();
    const keys = loadOrCreateKeypair();

    const publicBaseUrl = resolvePublicBaseUrl();
    const serverName = process.env.SERVER_NAME || "FearLauncher Network";

    const app = express();
    app.use(cors());

    const yggdrasilRouter = buildYggdrasilRouter({ keys, publicBaseUrl, serverName });

    // Handle Yggdrasil root metadata request before express.static if JSON is requested or user-agent is authlib-injector
    app.get("/", (req, res, next) => {
        const accept = req.headers.accept || "";
        const ua = req.headers["user-agent"] || "";
        if (accept.includes("application/json") || ua.includes("authlib-injector") || req.query.json === "true") {
            return yggdrasilRouter(req, res, next);
        }
        next();
    });

    app.use(express.static(path.join(__dirname, "..", "public")));

    app.use("/", authRoutes);
    app.use("/", skinRoutes);
    app.use("/", coinRoutes);
    app.use("/", adminRoutes);
    app.use("/", profileRoutes);
    app.use("/", assetRoutes);

    app.use("/", yggdrasilRouter);

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
