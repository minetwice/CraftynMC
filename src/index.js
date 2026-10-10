require("dotenv").config();

const fs = require("fs");
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

// Injects our frontend enhancements into the dashboard HTML at serve time,
// without touching index.html:
//   - the ad slot markup (parsed inline so the ad network's script runs the
//     normal way, whether it uses document.write or DOM insertion)
//   - rich-desc-editor.js : admin description editor (Write/Code/Preview + JSON)
//     and the upload-type tray.
//   - asset-hub.js        : public Modrinth-style storefront (cards + detail
//     dashboard with version/loader selection) and the admin loader picker.
//   - site-ads.js         : responsive placement of the ad slot.
//   - download-gate.js    : sponsored gate before an asset download.
//   - Social Bar (Adsterra): floating video/animated ads, site-wide.
const SOCIAL_BAR =
    '<script src="https://pl30828916.profitableratecpmnetwork.com/27/7c/24/277c24f34e9713fbe2c9a411c4063044.js"></script>';
const AD_MARKUP =
    '<div id="flAdSlot" class="fl-ad-slot" aria-label="Advertisement">' +
    `<script type="text/javascript">atOptions = {'key' : '852200953b95086c64ca6cba17c409fc','format' : 'iframe','height' : 300,'width' : 160,'params' : {}};</script>` +
    '<script src="https://www.highrevenueformat.com/852200953b95086c64ca6cba17c409fc/invoke.js"></script>' +
    "</div>";
const FRONTEND_SCRIPTS =
    SOCIAL_BAR + "\n" +
    AD_MARKUP + "\n" +
    '<script src="/js/upload-guard.js" defer></script>\n' +
    '<script src="/js/rich-desc-editor.js" defer></script>\n' +
    '<script src="/js/asset-hub.js" defer></script>\n' +
    '<script src="/js/site-ads.js" defer></script>\n' +
    '<script src="/js/drive-link.js" defer></script>\n' +
    '<script src="/js/download-gate.js" defer></script>';
const INDEX_HTML_PATH = path.join(__dirname, "..", "public", "index.html");
let patchedIndexHtml = null;

function getPatchedIndexHtml() {
    if (patchedIndexHtml !== null) return patchedIndexHtml;
    try {
        const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
        patchedIndexHtml = html.includes("flAdSlot")
            ? html
            : html.replace(/<\/body>/i, FRONTEND_SCRIPTS + "\n</body>");
    } catch (err) {
        console.error("[server] Could not read index.html:", err.message);
        patchedIndexHtml = "";
    }
    return patchedIndexHtml;
}

async function main() {
    await connectDB();
    const keys = loadOrCreateKeypair();

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
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

    // Serve the dashboard with our frontend scripts + ad slot injected before </body>.
    app.get("/", (req, res, next) => {
        const html = getPatchedIndexHtml();
        if (!html) return next();
        res.type("html").send(html);
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
