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
//   - site-banners.js     : dashboard leaderboard + native banner blocks.
//   - live-stats.js       : real dashboard counters (the page uses random ones).
//   - edit-assets.js      : admin can edit an uploaded asset (title, description...).
//   - click-guard.js      : blocks popunder click-hijack, keeps site clicks.
//   - Social Bar (Adsterra): floating video/animated ads, site-wide.
//   - Popunder (Adsterra)  : high-revenue full-page ads, in <head>.
// Social Bar + Popunder are DISABLED on purpose: these two Adsterra formats
// are the ones that most often serve adult / aggressive creatives, which is
// unacceptable for a Minecraft audience (many users are minors). To bring them
// back, just append SOCIAL_BAR / POPUNDER to the strings below again.
const SOCIAL_BAR =
    '<script src="https://pl30828916.profitableratecpmnetwork.com/27/7c/24/277c24f34e9713fbe2c9a411c4063044.js"></script>';
const POPUNDER =
    '<script src="https://pl30828914.profitableratecpmnetwork.com/e0/a1/54/e0a1542773817d2a6b61363582656b15.js"></script>';
const CLICK_GUARD = '<script src="/js/click-guard.js"></script>';
// HilltopAds domain-ownership verification tag (must sit before </head>).
const SITE_VERIFY = '<meta name="a463f835504346d220c283a4e3e7b951db7a8266" content="a463f835504346d220c283a4e3e7b951db7a8266" />';
// Filled per-request: og:image / og:url need absolute URLs.
const META_PLACEHOLDER = "<!--FL_META-->";
const HEAD_SCRIPTS = CLICK_GUARD + "\n" + SITE_VERIFY + "\n" + META_PLACEHOLDER;
const AD_MARKUP =
    '<div id="flAdSlot" class="fl-ad-slot" aria-label="Advertisement">' +
    `<script type="text/javascript">atOptions = {'key' : '852200953b95086c64ca6cba17c409fc','format' : 'iframe','height' : 300,'width' : 160,'params' : {}};</script>` +
    '<script src="https://www.highrevenueformat.com/852200953b95086c64ca6cba17c409fc/invoke.js"></script>' +
    "</div>";
const FRONTEND_SCRIPTS =
    AD_MARKUP + "\n" +
    '<script src="/js/upload-guard.js" defer></script>\n' +
    '<script src="/js/rich-desc-editor.js" defer></script>\n' +
    '<script src="/js/asset-hub.js" defer></script>\n' +
    '<script src="/js/site-ads.js" defer></script>\n' +
    '<script src="/js/drive-link.js" defer></script>\n' +
    '<script src="/js/site-banners.js" defer></script>\n' +
    '<script src="/js/live-stats.js" defer></script>\n' +
    '<script src="/js/edit-assets.js" defer></script>\n' +
    '<script src="/js/download-gate.js" defer></script>';
const INDEX_HTML_PATH = path.join(__dirname, "..", "public", "index.html");
let patchedIndexHtml = null;

const SITE_TITLE = "CraftynMC - Customize Your Launcher Profile";
const SITE_DESC =
    "Customize your launcher profile, download Minecraft mods, plugins, resource packs and shaders, and manage your skins — all from one dashboard.";

// Favicon + social/link-preview tags (Open Graph / Twitter). Absolute URLs
// are derived from the incoming request so previews work on any domain.
function buildMeta(req) {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
    const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").split(",")[0].trim();
    const base = host ? proto + "://" + host : "";
    const img = base + "/og-image.png";
    return [
        '<meta name="description" content="' + SITE_DESC + '">',
        '<link rel="icon" type="image/png" sizes="512x512" href="/logo.png">',
        '<link rel="shortcut icon" href="/favicon.ico">',
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="CraftynMC">',
        '<meta property="og:title" content="' + SITE_TITLE + '">',
        '<meta property="og:description" content="' + SITE_DESC + '">',
        '<meta property="og:image" content="' + img + '">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:url" content="' + base + '/">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="' + SITE_TITLE + '">',
        '<meta name="twitter:description" content="' + SITE_DESC + '">',
        '<meta name="twitter:image" content="' + img + '">'
    ].join("\n");
}

// Swap the page <title> without a regex (avoids escaping surprises).
function replaceTitle(html, title) {
    const open = html.indexOf("<title>");
    if (open === -1) return html;
    const close = html.indexOf("</title>", open);
    if (close === -1) return html;
    return html.slice(0, open) + "<title>" + title + "</title>" + html.slice(close + 8);
}

function getPatchedIndexHtml() {
    if (patchedIndexHtml !== null) return patchedIndexHtml;
    try {
        const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
        patchedIndexHtml = html.includes("flAdSlot")
            ? html
            : replaceTitle(
                html
                    .replace(/<\/head>/i, HEAD_SCRIPTS + "\n</head>")
                    .replace(/<\/body>/i, FRONTEND_SCRIPTS + "\n</body>"),
                SITE_TITLE
            );
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
        res.type("html").send(html.replace(META_PLACEHOLDER, buildMeta(req)));
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
