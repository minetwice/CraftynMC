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

    // Serve index.html with JS syntax fix + pointer-events CSS fix
    app.get("/", (req, res) => {
        let html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
        
        // Fix 1: Replace broken sidebar toggle IIFE with fixed version
        const brokenCode = '(function(){var toggle=document.getElementById("sidebarToggle");var sidebar=document.getElementById("sidebar");var overlay=document.getElementById("sidebarOverlay");if(toggle&&sidebar&&overlay){toggle.addEventListener("click",function(){sidebar.classList.toggle("mobile-open");overlay.classList.toggle("active")});overlay.addEventListener("click",function(){sidebar.classList.remove("mobile-open");overlay.classList.remove("active")})}document.querySelectorAll(".feature-card").forEach(function(card){card.addEventListener("mousemove",function(e){var rect=card.getBoundingClientRect();card.style.setProperty("--mx",(e.clientX-rect.left)+"px");card.style.setProperty("--my",(e.clientY-rect.top)+"px")})}})();';
        
        const fixedCode = '(function(){var toggle=document.getElementById("sidebarToggle");var sidebar=document.getElementById("sidebar");var overlay=document.getElementById("sidebarOverlay");if(toggle&&sidebar&&overlay){toggle.addEventListener("click",function(){sidebar.classList.toggle("mobile-open");overlay.classList.toggle("active");});overlay.addEventListener("click",function(){sidebar.classList.remove("mobile-open");overlay.classList.remove("active");});}document.querySelectorAll(".feature-card").forEach(function(card){card.addEventListener("mousemove",function(e){var rect=card.getBoundingClientRect();card.style.setProperty("--mx",(e.clientX-rect.left)+"px");card.style.setProperty("--my",(e.clientY-rect.top)+"px");});});})();';
        
        if (html.includes(brokenCode)) {
            html = html.replace(brokenCode, fixedCode);
        }
        
        // Fix 2: Inject pointer-events:none CSS for pseudo-elements
        if (!html.includes("pointer-fix.js")) {
            const cssFix = '<style>.animated-bg::before{pointer-events:none!important}button{position:relative!important}button::before{pointer-events:none!important}.card::before{pointer-events:none!important}.feature-card::after{pointer-events:none!important}.avatar::after{pointer-events:none!important}.nav-item.active::after{pointer-events:none!important}.stat-card::before{pointer-events:none!important}.modal::before{pointer-events:none!important}</style>';
            html = html.replace("</head>", cssFix + "</head>");
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