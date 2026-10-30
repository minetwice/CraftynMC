require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db");
const { loadOrCreateKeypair } = require("./utils/keys");
const User = require("./models/User");
const Asset = require("./models/Asset");

const authRoutes = require("./routes/auth");
const skinRoutes = require("./routes/skins");
const coinRoutes = require("./routes/coins");
const adminRoutes = require("./routes/admin");
const profileRoutes = require("./routes/profile");
const assetRoutes = require("./routes/assets");
const presenceRoutes = require("./routes/presence");
const analyticsRoutes = require("./routes/analytics");
const leaderboardRoutes = require("./routes/leaderboard");
const followRoutes = require("./routes/follow");
const notificationRoutes = require("./routes/notifications");
const reviewRoutes = require("./routes/reviews");
const playerRoutes = require("./routes/player");
const { securityHeaders, rateLimiter, noSqlGuard, corsOptions } = require("./middleware/security");
const buildYggdrasilRouter = require("./routes/yggdrasil");

// Injects our frontend enhancements into the dashboard HTML at serve time,
// without touching index.html:
//   - rich-desc-editor.js : admin description editor (Write/Code/Preview + JSON)
//     and the upload-type tray.
//   - asset-hub.js        : public Modrinth-style storefront (cards + detail
//     dashboard with version/loader selection) and the admin loader picker.
//   - monetag.js          : Monetag in-page push — ad Network B, alongside HilltopAds.
//   - monetag-multi.js    : Monetag Multitag — Network B, second zone.
//   - download-gate.js    : sponsored gate before an asset download (Video VAST).
//   - live-stats.js       : real dashboard counters (the page uses random ones).
//   - presence.js         : website heartbeat -> who is online.
//   - admin-presence.js   : live online/offline + coins panel on the admin dashboard.
//   - admin-analytics.js  : "Analytics" admin section (downloads, logins, online).
//   - earn-coins.js       : "Earn Coins" section — watch an ad to earn coins.
//   - coin-shop.js        : "Coin Shop" section — spend coins (premium badge, featured project).
//   - referral.js         : referral code field on register + ?ref= links (both sides earn coins).
//   - weekly-board.js     : the two weekly prize boards (most online / most coins).
//   - leaderboard.js      : "Leaderboard" section — weekly top coin earners + prizes.
//   - daily-streak.js     : streak strip on the Daily Rewards section (10-day ladder + freezes).
//   - skin-head.js        : draws a player's Minecraft head (face + hat) from their skin PNG.
//   - player-lookup.js    : "Player Lookup" section — search + all-players directory, 3D character.
//   - cosmetics-park.js   : hides + empties the Cosmetics section while it is reworked.
//   - features-tour.js    : video-style walkthrough of every player-facing feature.
//   - change-password.js  : "Change password" card on the Profile page (old password required).
//   - modrinth-ui.js      : Modrinth-style theme — palette, Inter, top navbar, motion.
//   - deep-links.js       : every page gets a shareable #link + a "copy link" button.
//   - site-footer.js      : footer with the legal links (Privacy, Terms, Rules, Licensing).
//   - asset-extras.js     : licence / environment / links fields on the upload form.
//   - project-page.js     : Modrinth-style full project page (sidebar + tabs).
//   - store.js            : Modrinth-style browse — search, sort, filters, pagination, cards.
//   - home.js             : dashboard "Discover" block (hero, featured, popular, recent).
//   - profile-projects.js : "Projects by this player" on a Player Lookup profile.
//   - follow.js           : Follow / Following buttons with live counts.
//   - notifications.js    : the bell in the top bar + its dropdown panel.
//   - edit-assets.js      : admin can edit an uploaded asset (title, description...).
//   - admin-login-guard.js : hides the Admin Portal button; admin logins need a
//     server-verified security code (ADMIN_SECURITY_CODE env var).
//   - hilltop-video-slider.js : HilltopAds Video Slider (floats bottom-right).
//   - hilltop-banner.js       : HilltopAds Banner rotator (one per active section).
//   - Popunder (HilltopAds)   : opens behind the page on a click, site-wide.
//
// All Adsterra ad units (popunder, social bar, 160x300 rail, 728x90 leaderboard,
// native banner and the gate banners) have been REMOVED in favour of HilltopAds.
// No Adsterra markup or keys are injected anywhere any more.
// click-guard is NOT injected any more: its overlay shield could set
// pointer-events:none on the HilltopAds popunder/overlays and stop them from
// working. The file stays in the repo for easy re-enabling.
// HilltopAds domain-ownership verification tag (must sit before </head>).
const SITE_VERIFY = '<meta name="a463f835504346d220c283a4e3e7b951db7a8266" content="a463f835504346d220c283a4e3e7b951db7a8266" />';

// ---- search-engine verification --------------------------------------------
// You can verify the site in Google Search Console (and Bing) WITHOUT owning a
// domain, by pasting the token they give you into Render's environment:
//   GOOGLE_SITE_VERIFICATION=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//   BING_SITE_VERIFICATION=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// Both are plain meta tags, so nothing else has to change.
const GOOGLE_VERIFY = String(process.env.GOOGLE_SITE_VERIFICATION || "").trim();
const BING_VERIFY = String(process.env.BING_SITE_VERIFICATION || "").trim();
// Monetag verifies a site with a meta tag in <head>. Paste just the VALUE from
// their tag into MONETAG_VERIFICATION and it is injected for you.
const MONETAG_VERIFY = String(process.env.MONETAG_VERIFICATION || "").trim();
const VERIFY_TAGS =
    (GOOGLE_VERIFY ? '<meta name="google-site-verification" content="' + GOOGLE_VERIFY.replace(/[^A-Za-z0-9_-]/g, "") + '" />\n' : "") +
    (BING_VERIFY ? '<meta name="msvalidate.01" content="' + BING_VERIFY.replace(/[^A-Za-z0-9_-]/g, "") + '" />\n' : "") +
    (MONETAG_VERIFY ? '<meta name="monetag" content="' + MONETAG_VERIFY.replace(/[^A-Za-z0-9_-]/g, "") + '" />\n' : "");
// Video VAST tags, tried in order with fallback (index 0 = the Google/AdX one,
// which usually pays more). Fetched SERVER-side (see /api/vast) so the browser
// has no CORS problem; the gate still fires the impression pixels client-side.
const VAST_TAGS = [
    "https://second-director.com/d/mJFlzSd.GkNzvAZHGQUU/gegmj9JuSZdU/lDkhPLTSc/1YM/D/Yo1jN/TTM_t/N/zqUgwaNfjVUl1ANYygZMsXaiWM1zpudPD/0sxd",
    "https://second-director.com/dJmzFtz.dMGINbvBZ/GZUu/-e/m/9suhZXUelck/PPTDcp1/MHDPYH1TNDT/MvtaNXzIUQwxNdj/Uw1ONUwQ",
    "https://second-director.com/damuFAz.dAGkNHvaZdGpUD/LeGmO9luSZNU/l/kkP/TIco1SMQDUYF1QNVT-MOtuNnz/UqwfN/jXU/1aNbwf"
];
// HilltopAds popunder tags (affectionatestorage.com). ONE loads per page view,
// rotating through the pool so every zone keeps serving. A popunder hijacks
// clicks by design - that is how the format works.
const POPUNDERS = [
    "https://affectionatestorage.com/bk3cVG0/P.3/pEvEbqmuV/JXZPDk0t3vNJTmAE2RNFz/Eh3/LGT/c-1pMSDEY/3jMsjUEw",
    "https://affectionatestorage.com/bL3.VY0bPY3_pgvFbBmIVoJFZkDq0/3BNmTiA/2kNXz/E/3/LJTlc1aMZDUYD3JMhjoEJ",
    "https://affectionatestorage.com/b.3AVU0oPZ3jp/vHbtm_VMJOZrDj0/3hNUTpMm5ONeziAzxNLWTEcA1_Mjzvkh3fMeD-Uj"
];
let popunderIdx = 0;
function nextPopunder() {
    const url = POPUNDERS[popunderIdx % POPUNDERS.length];
    popunderIdx++;
    return '<script src="' + url + '" async></script>';
}
// Filled per-request: og:image / og:url need absolute URLs.
const META_PLACEHOLDER = "<!--FL_META-->";
const POPUNDER_PLACEHOLDER = "<!--FL_POPUNDER-->";

// ---- AdSense mode ---------------------------------------------------------
// Set ADSENSE_MODE=1 (and ADSENSE_CLIENT=ca-pub-XXXXXXXX) in Render to switch
// the site to an AdSense-clean build: the popunder, the download gate and the
// rewarded "watch an ad for coins" feature are all removed, because AdSense
// prohibits pop-unders and any incentive to view ads. Nothing else changes.
const ADSENSE_MODE = String(process.env.ADSENSE_MODE || "").trim() === "1";
const ADSENSE_CLIENT = String(process.env.ADSENSE_CLIENT || "").trim();
const ADSENSE_TAG = ADSENSE_CLIENT
    ? '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
      ADSENSE_CLIENT.replace(/[^A-Za-z0-9-]/g, "") + '" crossorigin="anonymous"></script>\n'
    : "";

const HEAD_SCRIPTS = (ADSENSE_MODE ? "" : POPUNDER_PLACEHOLDER) + "\n" + ADSENSE_TAG + SITE_VERIFY + "\n" + VERIFY_TAGS + META_PLACEHOLDER;
const FRONTEND_SCRIPTS =
    '<script src="/js/upload-guard.js" defer></script>\n' +
    '<script src="/js/admin-login-guard.js" defer></script>\n' +
    '<script src="/js/rich-desc-editor.js" defer></script>\n' +
    '<script src="/js/asset-hub.js" defer></script>\n' +
    '<script src="/js/drive-link.js" defer></script>\n' +
    '<script src="/js/live-stats.js" defer></script>\n' +
    '<script src="/js/presence.js" defer></script>\n' +
    '<script src="/js/admin-presence.js" defer></script>\n' +
    '<script src="/js/admin-analytics.js" defer></script>\n' +
    '<script src="/js/admin-daily.js?v=2026-10-30b" defer></script>\n' +
    (ADSENSE_MODE ? "" : '<script src="/js/earn-coins.js" defer></script>\n') +
    '<script src="/js/coin-shop.js" defer></script>\n' +
    '<script src="/js/referral.js" defer></script>\n' +
    '<script src="/js/leaderboard.js" defer></script>\n' +
    '<script src="/js/weekly-board.js" defer></script>\n' +
    '<script src="/js/daily-streak.js" defer></script>\n' +
    '<script src="/js/skin-head.js" defer></script>\n' +
    '<script src="/js/player-lookup.js" defer></script>\n' +
    '<script src="/js/cosmetics-park.js" defer></script>\n' +
    '<script src="/js/features-tour.js" defer></script>\n' +
    '<script src="/js/change-password.js" defer></script>\n' +
    '<script src="/js/modrinth-ui.js?v=2026-10-30a" defer></script>\n' +
    '<script src="/js/deep-links.js" defer></script>\n' +
    '<script src="/js/site-footer.js" defer></script>\n' +
    '<script src="/js/asset-extras.js" defer></script>\n' +
    '<script src="/js/project-page.js" defer></script>\n' +
    '<script src="/js/store.js" defer></script>\n' +
    '<script src="/js/home.js" defer></script>\n' +
    '<script src="/js/profile-projects.js" defer></script>\n' +
    '<script src="/js/follow.js" defer></script>\n' +
    '<script src="/js/notifications.js" defer></script>\n' +
    '<script src="/js/edit-assets.js" defer></script>\n' +
    '<script src="/js/hilltop-video-slider.js" defer></script>\n' +
    '<script src="/js/hilltop-banner.js" defer></script>\n' +
    '<script src="/js/pixel-loader.js?v=2026-10-27a" defer></script>\n' +
    '<script src="/js/skin-studio.js?v=2026-10-27a" defer></script>\n' +
    '<script src="/js/vine-drain.js?v=2026-10-27a" defer></script>\n' +
    (ADSENSE_MODE ? "" : '<script src="/js/monetag.js" defer></script>\n') +
    (ADSENSE_MODE ? "" : '<script src="/js/monetag-multi.js" defer></script>\n') +
    (ADSENSE_MODE ? "" : '<script src="/js/download-gate.js" defer></script>');
const INDEX_HTML_PATH = path.join(__dirname, "..", "public", "index.html");
let patchedIndexHtml = null;

const SITE_TITLE = "CraftynMC - Customize Your Launcher Profile";
const SITE_DESC =
    "Customize your launcher profile, download Minecraft mods, plugins, resource packs and shaders, and manage your skins — all from one dashboard.";

// Favicon + social/link-preview tags (Open Graph / Twitter). Absolute URLs
// are derived from the incoming request so previews work on any domain.
function esc(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function slugify(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Google Drive share links -> a direct image URL
function driveImage(url) {
    if (!url) return "";
    const m = String(url).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([\w-]{10,})/);
    if (m) return "https://lh3.googleusercontent.com/d/" + m[1];
    return url;
}

// plain text for og:description
function plain(s, n) {
    return String(s || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/[#*`_>\[\]()]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, n || 180);
}

const PAGE_TITLES = {
    dashboard: "Dashboard", mods: "Minecraft Mods", plugins: "Server Plugins",
    resources: "Resource Packs", shaders: "Shaders", fearlauncher: "FearLauncher Client",
    profile: "Customize Profile", "daily-rewards": "Daily Rewards", achievements: "Achievements",
    leaderboard: "Leaderboards", "earn-coins": "Earn Coins", "coin-shop": "Coin Shop",
    "player-lookup": "Player Lookup"
};

// Real, indexable sentences for the pages people actually search for.
const PAGE_DESC = {
    mods: "Download Minecraft mods for Fabric, Forge, NeoForge and Quilt — with versions, licences and reviews, free on CraftynMC.",
    plugins: "Browse server plugins for Paper, Spigot and Purpur. Filter by version and download free on CraftynMC.",
    resources: "Free Minecraft resource packs — texture packs and models for any version, ready to download.",
    shaders: "Download Minecraft shaders for Iris and OptiFine. See compatibility and versions before you install.",
    fearlauncher: "FearLauncher — play Minecraft: Java Edition on Android. Tuned render resolution, a smooth FPS profile and no hidden 60 FPS cap.",
    "player-lookup": "Look up any CraftynMC player: see their 3D character with their skin, their stats and badges, and download their skin and cape.",
    leaderboard: "Weekly leaderboards and seasons on CraftynMC — most time online and most coins earned, with 2,000 / 1,000 / 500 coin prizes.",
    "earn-coins": "Earn coins on CraftynMC by watching a short ad, claim daily rewards and spend them in the Coin Shop.",
    "coin-shop": "Spend your CraftynMC coins on a Premium badge, a featured project, an ad-free pass or a streak freeze.",
    "daily-rewards": "Claim a daily reward every day on CraftynMC — from 100 coins up to 1,500 on day ten.",
    profile: "Customise your CraftynMC profile: upload a 64x64 Minecraft skin and a cape, and preview them live in 3D.",
    achievements: "Earn badges on CraftynMC by playing on the network servers."
};

async function buildMeta(req) {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
    const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").split(",")[0].trim();
    const base = host ? proto + "://" + host : "";

    let title = SITE_TITLE;
    let desc = SITE_DESC;
    let img = base + "/og-image.png";
    let url = base + "/";
    let sized = true;
    let app = null;   // set for the launcher page -> SoftwareApplication markup

    const parts = String(req.path || "/").split("/").filter(Boolean);

    try {
        if (parts[0] === "player" && parts[1]) {
            // A player's profile: show their CHARACTER CARD (skin rendered).
            const name = decodeURIComponent(parts[1]).replace(/[^A-Za-z0-9_]/g, "");
            if (name) {
                const u = await User.findOne({ username: new RegExp("^" + name + "$", "i") })
                    .select("username displayName bio uuid skinPngBase64 coins role").lean();
                if (u) {
                    title = (u.displayName || u.username) + " — CraftynMC player";
                    desc = plain(u.bio, 180) || (u.username + " on CraftynMC — skin, character and profile.");
                    url = base + "/player/" + encodeURIComponent(u.username);
                    if (u.skinPngBase64) { img = base + "/skins/" + u.uuid + "_card.png"; sized = false; }
                }
            }
        } else if (parts[0] && parts[1]) {
            // A project page: /plugins/Some-Project -> its own preview image.
            const cat = parts[0] === "fearlauncher" ? "launcher" : parts[0];
            const slug = slugify(decodeURIComponent(parts[1]));
            if (slug) {
                const list = await Asset.find({ category: cat })
                    .select("name description previewUrl iconUrl category").lean();
                let hit = null;
                for (let i = 0; i < list.length; i++) {
                    if (slugify(list[i].name) === slug) { hit = list[i]; break; }
                }
                if (hit) {
                    title = hit.name + " — CraftynMC";
                    desc = plain(hit.description, 180) || ("Download " + hit.name + " on CraftynMC.");
                    url = base + "/" + parts[0] + "/" + slugify(hit.name);
                    const im = driveImage(hit.previewUrl || hit.iconUrl);
                    if (im) { img = /^https?:/i.test(im) ? im : base + im; sized = false; }
                }
            }
        } else if (parts[0] && PAGE_TITLES[parts[0]]) {
            title = PAGE_TITLES[parts[0]] + " — CraftynMC";
            desc = PAGE_DESC[parts[0]] || desc;
            url = base + "/" + parts[0];
            if (parts[0] === "fearlauncher") app = true;
        }
    } catch (e) { /* fall back to the site defaults */ }

    // Structured data — helps Google understand what the site actually is.
    const ld = [{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "CraftynMC",
        "url": base + "/",
        "description": SITE_DESC,
        "potentialAction": {
            "@type": "SearchAction",
            "target": base + "/mods?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    }];
    if (app) {
        ld.push({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "FearLauncher",
            "operatingSystem": "Android",
            "applicationCategory": "GameApplication",
            "url": url,
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" }
        });
    }

    const out = [
        '<link rel="canonical" href="' + esc(url) + '">',
        '<meta name="description" content="' + esc(desc) + '">',
        '<script type="application/ld+json">' + JSON.stringify(ld) + "</script>",
        '<link rel="icon" type="image/png" sizes="512x512" href="/logo.png">',
        '<link rel="shortcut icon" href="/favicon.ico">',
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="CraftynMC">',
        '<meta property="og:title" content="' + esc(title) + '">',
        '<meta property="og:description" content="' + esc(desc) + '">',
        '<meta property="og:image" content="' + esc(img) + '">',
        '<meta property="og:url" content="' + esc(url) + '">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="' + esc(title) + '">',
        '<meta name="twitter:description" content="' + esc(desc) + '">',
        '<meta name="twitter:image" content="' + esc(img) + '">'
    ];
    if (sized) {
        out.splice(11, 0,
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="630">');
    }
    return { meta: out.join("\n"), title: title };
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
    app.set("trust proxy", 1); // Render sits behind a proxy, so req.ip needs this
    app.use(securityHeaders);
    app.use(cors(corsOptions));

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

    // Legal pages: /legal/privacy, /legal/terms, /legal/rules, /legal/licence
    app.get(/^\/legal(\/[a-z]+)?\/?$/i, (req, res) => {
        res.sendFile(path.join(__dirname, "..", "public", "legal.html"));
    });

    // About / Contact — every ad network (and AdSense especially) wants one.
    app.get(/^\/about\/?$/i, (req, res) => {
        res.sendFile(path.join(__dirname, "..", "public", "about.html"));
    });

    // Phone-friendly admin password recovery page (gated by ADMIN_RECOVERY_TOKEN).
    app.get("/recover", (req, res) => {
        res.sendFile(path.join(__dirname, "..", "public", "recover.html"));
    });

    // ---- Pretty page URLs: /plugins, /mods, /plugins/Some-Project ----
    // The app is a single page, so these all serve the same HTML; the client
    // (deep-links.js) reads the path and opens the matching page.
    const PAGE_ROUTES = /^\/(dashboard|mods|plugins|resources|shaders|fearlauncher|profile|daily-rewards|achievements|leaderboard|earn-coins|coin-shop|player-lookup|player)(\/[^\/]+)?\/?$/i;
    const sendPage = async (req, res, next) => {
        let html = getPatchedIndexHtml();
        if (!html) return next();

        let out = { meta: "", title: "" };
        try { out = await buildMeta(req); } catch (e) { out = { meta: "", title: "" }; }

        html = html
            .replace(POPUNDER_PLACEHOLDER, ADSENSE_MODE ? "" : nextPopunder())
            .replace(META_PLACEHOLDER, out.meta || "");

        // A real, per-page <title> — what Google shows as the result headline.
        if (out.title) html = replaceTitle(html, esc(out.title));

        res.type("html").send(html);
    };

    // ---- sitemap.xml: tells Google every page that exists ----------------
    app.get("/sitemap.xml", async (req, res) => {
        try {
            const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
            const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").split(",")[0].trim();
            const base = host ? proto + "://" + host : "";

            const pages = ["", "about", "mods", "plugins", "resources", "shaders", "fearlauncher",
                "player-lookup", "leaderboard", "earn-coins", "coin-shop", "daily-rewards", "achievements",
                "legal/privacy", "legal/terms", "legal/rules", "legal/licence"];

            const rows = pages.map((p) => ({ loc: base + "/" + p, pri: p === "" ? "1.0" : "0.8", last: null }));

            // Every published project gets its own URL.
            try {
                const assets = await Asset.find({}).select("name category updatedAt").limit(5000).lean();
                assets.forEach((a) => {
                    const cat = a.category === "launcher" ? "fearlauncher" : a.category;
                    const slug = slugify(a.name);
                    if (slug) rows.push({ loc: base + "/" + cat + "/" + slug, pri: "0.7", last: a.updatedAt });
                });
            } catch (e) { /* a sitemap without projects is still a sitemap */ }

            const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                rows.map((u) => "  <url><loc>" + u.loc + "</loc>" +
                    (u.last ? "<lastmod>" + new Date(u.last).toISOString().slice(0, 10) + "</lastmod>" : "") +
                    "<priority>" + u.pri + "</priority></url>").join("\n") +
                "\n</urlset>";

            res.type("application/xml").send(xml);
        } catch (e) {
            res.status(500).end();
        }
    });
    app.get(PAGE_ROUTES, sendPage);

    // Serve the dashboard with our frontend scripts + ad slot injected before </body>.
    app.get("/", sendPage);

    // VAST proxy for the download gate (same-origin; follows one wrapper level;
    // tries the requested tag first, then falls back to the others).
    app.get("/api/vast", async (req, res) => {
        async function getVast(url, depth) {
            const r = await fetch(url, { redirect: "follow" });
            const xml = await r.text();
            if (depth < 2 && !/<MediaFile/i.test(xml)) {
                const m = xml.match(/<VASTAdTagURI[^>]*>([\s\S]*?)<\/VASTAdTagURI>/i);
                if (m && m[1]) return getVast(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(), depth + 1);
            }
            return xml;
        }
        const start = parseInt(req.query.i, 10) || 0;
        let xml = "";
        try {
            for (let k = 0; k < VAST_TAGS.length; k++) {
                const tag = VAST_TAGS[(start + k) % VAST_TAGS.length];
                try {
                    const out = await getVast(tag, 0);
                    if (/<MediaFile/i.test(out)) { xml = out; break; }
                    if (!xml) xml = out;
                } catch (e) { /* try the next tag */ }
            }
        } catch (err) {
            console.error("[vast]", err.message);
        }
        res.type("application/xml").send(xml || '<VAST version="3.0"></VAST>');
    });

    app.use(express.static(path.join(__dirname, "..", "public")));

    // Parse once up front so the NoSQL-injection guard can inspect the body.
    app.use(express.json({ limit: "2mb" }));
    app.use(noSqlGuard);

    // Per-IP limits on the sensitive endpoints.
    app.use("/login", rateLimiter({ windowMs: 60000, max: 12 }));
    app.use("/register", rateLimiter({ windowMs: 60000, max: 6 }));
    app.use("/api/presence", rateLimiter({ windowMs: 60000, max: 45 }));
    app.use("/api/launcher/heartbeat", rateLimiter({ windowMs: 60000, max: 45 }));
    app.use("/api/coins/watch-ad", rateLimiter({ windowMs: 60000, max: 12 }));
    app.use("/admin", rateLimiter({ windowMs: 60000, max: 300 }));

    app.use("/", authRoutes);
    app.use("/", skinRoutes);
    app.use("/", coinRoutes);
    app.use("/", adminRoutes);
    app.use("/", profileRoutes);
    app.use("/", assetRoutes);
    app.use("/", presenceRoutes);
    app.use("/", analyticsRoutes);
    app.use("/", leaderboardRoutes);

    // Weekly prizes: pay any board that has rolled over. The lazy path inside
    // /api/leaderboard does this on read; this timer is the safety net.
    try {
        setInterval(() => {
            if (typeof leaderboardRoutes.runAllAwards === "function") {
                leaderboardRoutes.runAllAwards(new Date()).catch(() => {});
            }
        }, 60 * 60 * 1000);   // hourly
    } catch (e) { /* never let this stop the server booting */ }
    app.use("/", followRoutes);
    app.use("/", notificationRoutes);
    app.use("/", reviewRoutes);
    app.use("/", playerRoutes);

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
