/* CraftynMC — Modrinth-style UI
 * ------------------------------------------------------------------
 * Restyles the whole app to look and feel like modrinth.com on both desktop
 * and phone:
 *   - palette: CraftynMC's own red, with tidied Modrinth-style surfaces
 *   - type:    Inter, tighter tracking, their radii and flat shadows
 *   - layout:  a horizontal top navbar instead of the left sidebar
 *   - motion:  quick hover lifts, staggered entrance, reduced-motion aware
 *
 * The original top bar is kept in the DOM (hidden) and mirrored into the new
 * navbar, so the coin balance, the ad slots and the tour keep working.
 */
(function () {
  "use strict";

  var NAV_ID = "flTopNav";
  var SECTIONS = [
    { id: "dashboard", label: "Home", icon: "fa-house" },
    { id: "mods", label: "Mods", icon: "fa-cube" },
    { id: "plugins", label: "Plugins", icon: "fa-plug" },
    { id: "resources", label: "Resource Packs", icon: "fa-box" },
    { id: "shaders", label: "Shaders", icon: "fa-sun" },
    { id: "fearlauncher", label: "Launcher", icon: "fa-rocket" },
    { id: "player-lookup", label: "Players", icon: "fa-user-magnifying-glass" },
    { id: "leaderboard", label: "Leaderboards", icon: "fa-trophy" },
    { id: "earn-coins", label: "Earn Coins", icon: "fa-coins" },
    { id: "coin-shop", label: "Coin Shop", icon: "fa-store" }
  ];

  var CSS = [
    /* ---------- palette: KEEP CraftynMC's own red ---------- */
    /* Only the surfaces/radii are tidied here — the brand colour is untouched. */
    ":root{",
      "--bg-dark:#07080d;",
      "--bg-card:rgba(18,20,29,.65);",
      "--bg-card-hover:rgba(26,30,44,.85);",
      "--bg-sidebar:rgba(12,14,22,.85);",
      "--border-color:rgba(255,255,255,.08);",
      "--border-hover:rgba(255,0,72,.4);",
      "--text-primary:#f8fafc;",
      "--text-secondary:#94a3b8;",
      "--shadow-3d:0 2px 8px rgba(0,0,0,.45);",
      "--shadow-hover:0 8px 26px rgba(0,0,0,.55);",
      "--transition:all .2s ease;",
      "--fl-nav-h:58px;",
    "}",

    /* ---------- type ---------- */
    "body,button,input,select,textarea,h1,h2,h3,h4,h5,.section-title,.logo span{",
      "font-family:Inter,'Plus Jakarta Sans',system-ui,-apple-system,sans-serif!important;",
      "letter-spacing:normal;",
    "}",
    "h1,h2,h3,.section-title{letter-spacing:-.02em;font-weight:800}",

    /* ---------- surfaces: flat, Modrinth-like ---------- */
    /* P0: min-height:100vh on the content column forces a full-screen blank area
       on short pages (the biggest "wedge"). Let it size to its content instead —
       body keeps the viewport fill, so the footer still lands at the bottom. */
    ".app-container{align-items:flex-start!important}",
    ".main-content{min-height:0!important}",
    ".section.active{min-height:0!important}",
    "body{background:var(--bg-dark)!important}",
    ".card,.mcard,.shop-item,.reward-card,.feature-card,.stat-card{",
      "background:var(--bg-card)!important;border:1px solid var(--border-color)!important;",
      "border-radius:16px!important;box-shadow:none!important;backdrop-filter:none!important;",
      "transition:transform .18s ease,border-color .18s ease,background .18s ease!important;",
    "}",
    ".card:hover,.feature-card:hover,.shop-item:hover,.reward-card:hover{",
      "transform:translateY(-2px);border-color:var(--border-hover)!important;background:var(--bg-card-hover)!important;",
      "box-shadow:var(--shadow-hover)!important;",
    "}",

    /* ---------- buttons ---------- */
    "button:not(.fl-nav-link):not(.fl-burger),.btn{",
      "border-radius:12px!important;font-weight:700!important;letter-spacing:.01em;",
      "transition:filter .15s ease,transform .12s ease,background .15s ease!important;",
    "}",
    "button:not(.fl-nav-link):not(.fl-burger):hover{filter:brightness(1.08)}",
    "button:not(.fl-nav-link):not(.fl-burger):active{transform:scale(.985)}",
    "button.full-width,.btn-primary{background:var(--gradient-main)!important;color:#fff!important;border:none!important}",

    /* ---------- sidebar -> hidden (the top navbar replaces it) ---------- */
    "body.fl-topnav .sidebar{display:none!important}",
    "body.fl-topnav .main-content{margin-left:0!important;width:100%!important;",
      "padding-top:calc(var(--fl-nav-h) + 18px)!important}",
    "body.fl-topnav .top-bar{position:absolute!important;left:-9999px!important;top:0!important;width:1px!important;height:1px!important;overflow:hidden!important}",

    /* ---------- the navbar ---------- */
    "#" + NAV_ID + "{position:fixed;top:0;left:0;right:0;height:var(--fl-nav-h);z-index:900;",
      "display:flex;align-items:center;gap:10px;padding:0 16px;",
      "background:rgba(22,24,28,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--border-color)}",
    "#" + NAV_ID + " .fl-brand{display:flex;align-items:center;gap:9px;cursor:pointer;flex:0 0 auto;",
      "font-weight:800;font-size:15.5px;color:#fff;text-decoration:none;letter-spacing:-.02em}",
    "#" + NAV_ID + " .fl-brand i{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;",
      "background:linear-gradient(135deg,#ff0048,#a8002e);color:#fff;font-size:14px}",
    "#" + NAV_ID + " .fl-links{display:flex;align-items:center;gap:2px;flex:1;min-width:0;overflow:hidden}",
    "#" + NAV_ID + " .fl-nav-link{display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:9px;",
      "border:none;background:none;color:var(--text-secondary);font-size:13.5px;font-weight:600;cursor:pointer;",
      "white-space:nowrap;transition:background .15s ease,color .15s ease;font-family:inherit}",
    "#" + NAV_ID + " .fl-nav-link:hover{background:rgba(255,255,255,.06);color:#fff}",
    "#" + NAV_ID + " .fl-nav-link.on{background:rgba(255,0,72,.14);color:#ff5c85}",
    "#" + NAV_ID + " .fl-search{display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:10px;",
      "background:#1a1c21;border:1px solid var(--border-color);min-width:150px;max-width:250px;flex:0 1 auto}",
    "#" + NAV_ID + " .fl-search i{color:var(--text-secondary);font-size:12px}",
    "#" + NAV_ID + " .fl-search input{background:none;border:none;outline:none;color:#fff;font-size:13px;width:100%;font-family:inherit}",
    "#" + NAV_ID + " .fl-right{display:flex;align-items:center;gap:9px;flex:0 0 auto;margin-left:auto}",
    "#" + NAV_ID + " .fl-user{display:flex;align-items:center;gap:8px;padding:5px 10px 5px 5px;border-radius:11px;",
      "background:#1a1c21;border:1px solid var(--border-color);cursor:pointer}",
    "#" + NAV_ID + " .fl-ava{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#ff0048,#a8002e);",
      "display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff}",
    "#" + NAV_ID + " .fl-uname{font-size:12.5px;font-weight:700;color:#fff;line-height:1.15}",
    "#" + NAV_ID + " .fl-urole{font-size:10px;color:var(--text-secondary);line-height:1.15}",
    "#" + NAV_ID + " .fl-coin{display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;",
      "background:rgba(255,0,72,.13);border:1px solid rgba(255,0,72,.32);color:#ff5c85;font-weight:800;font-size:12.5px}",
    "#" + NAV_ID + " .fl-burger{display:none;width:38px;height:38px;border-radius:10px;border:1px solid var(--border-color);",
      "background:#1a1c21;color:#fff;cursor:pointer;align-items:center;justify-content:center;font-size:14px}",
    "#flNavSheet{position:fixed;top:var(--fl-nav-h);left:0;right:0;z-index:899;background:#1a1c21;",
      "border-bottom:1px solid var(--border-color);padding:10px;display:none;max-height:70vh;overflow:auto;",
      "box-shadow:0 18px 40px rgba(0,0,0,.55)}",
    "#flNavSheet.on{display:block;animation:flSheet .18s ease}",
    "#flNavSheet .fl-nav-link{width:100%;padding:12px 14px;font-size:14px}",
    "@keyframes flSheet{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}",

    /* ---------- motion ---------- */
    "@keyframes flRise{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}",
    ".card,.st-card,.fh-card,.pp-card,.mcard,.feature-card,.shop-item,.reward-card{",
      "animation:flRise .34s cubic-bezier(.16,1,.3,1) both}",
    ".st-grid>.st-card:nth-child(2n),.fh-row>.fh-card:nth-child(2n){animation-delay:.04s}",
    ".st-grid>.st-card:nth-child(3n),.fh-row>.fh-card:nth-child(3n){animation-delay:.08s}",
    ".section{animation:flRise .28s ease both}",

    /* ---------- phone ---------- */
    "@media (max-width:1000px){",
      "#" + NAV_ID + " .fl-links{display:none}",
      "#" + NAV_ID + " .fl-burger{display:flex}",
      "#" + NAV_ID + " .fl-search{max-width:none;flex:1}",
      "#" + NAV_ID + " .fl-user .fl-uname,#" + NAV_ID + " .fl-user .fl-urole{display:none}",
    "}",
    "@media (max-width:560px){",
      "#" + NAV_ID + "{padding:0 10px;gap:8px}",
      "#" + NAV_ID + " .fl-brand span{display:none}",
      "#" + NAV_ID + " .fl-coin{padding:6px 9px;font-size:11.5px}",
    "}",

    "@media (prefers-reduced-motion:reduce){",
      "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}",
    "}"
  ].join("");

  function styles() {
    if (document.getElementById("flMrStyles")) return;
    var st = document.createElement("style");
    st.id = "flMrStyles";
    st.textContent = CSS;
    document.head.appendChild(st);

    // Inter, like Modrinth. The system stack is the fallback if this fails.
    if (!document.getElementById("flMrFont")) {
      var l = document.createElement("link");
      l.id = "flMrFont";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
  }

  /* ---------------- the navbar ---------------- */
  function activeId() {
    var a = document.querySelector(".nav-item[data-section].active");
    if (a) return a.getAttribute("data-section");
    var s = document.querySelector(".section.active");
    return s ? s.id : "";
  }

  function go(id) {
    if (typeof window.showSection === "function") window.showSection(id);
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (i) {
      i.classList.toggle("active", i.getAttribute("data-section") === id);
    });
    sync();
    var sheet = document.getElementById("flNavSheet");
    if (sheet) sheet.classList.remove("on");
  }

  function linkHTML(s) {
    return '<button type="button" class="fl-nav-link" data-go="' + s.id + '">' +
      '<i class="fas ' + s.icon + '"></i>' + s.label + "</button>";
  }

  function build() {
    if (document.getElementById(NAV_ID)) return;
    var main = document.querySelector("main.main-content") || document.querySelector("main");
    if (!main) return;
    if (!document.body.classList.contains("fl-topnav")) document.body.classList.add("fl-topnav");

    var nav = document.createElement("nav");
    nav.id = NAV_ID;
    nav.innerHTML =
      '<a class="fl-brand" id="flBrand"><i class="fas fa-cube"></i><span>CraftynMC</span></a>' +
      '<button type="button" class="fl-burger" id="flNavBurger" aria-label="Menu"><i class="fas fa-bars"></i></button>' +
      '<div class="fl-links">' + SECTIONS.map(linkHTML).join("") + "</div>" +
      '<div class="fl-right">' +
        '<div class="fl-search"><i class="fas fa-magnifying-glass"></i>' +
          '<input id="flNavSearch" placeholder="Search projects…" autocomplete="off"></div>' +
        '<div class="fl-coin" id="flNavCoin"><i class="fas fa-coins"></i><span>0</span></div>' +
        '<div class="fl-user" id="flNavUser">' +
          '<div class="fl-ava" id="flNavAva">?</div>' +
          '<div><div class="fl-uname" id="flNavName">Player</div>' +
          '<div class="fl-urole" id="flNavRole">Member</div></div>' +
        "</div>" +
      "</div>";
    document.body.appendChild(nav);

    var sheet = document.createElement("div");
    sheet.id = "flNavSheet";
    sheet.innerHTML = SECTIONS.map(linkHTML).join("");
    document.body.appendChild(sheet);

    nav.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-go]");
      if (b) { go(b.getAttribute("data-go")); return; }
      if (e.target.closest && e.target.closest("#flNavBurger")) {
        var s = document.getElementById("flNavSheet");
        if (s) s.classList.toggle("on");
        return;
      }
      if (e.target.closest && e.target.closest("#flBrand")) go("dashboard");
    });
    sheet.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-go]");
      if (b) go(b.getAttribute("data-go"));
    });

    var search = document.getElementById("flNavSearch");
    if (search) search.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var q = search.value.trim();
      go("mods");
      setTimeout(function () {
        var el = document.getElementById("stQ_mods");
        if (el && q) { el.value = q; el.dispatchEvent(new Event("input")); }
      }, 420);
    });

    sync();
  }

  /* ---------------- mirror the live top bar ---------------- */
  function sync() {
    var id = activeId();
    Array.prototype.forEach.call(document.querySelectorAll("#" + NAV_ID + " [data-go], #flNavSheet [data-go]"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-go") === id);
    });

    // coin + user are mirrored from the real top bar so they stay live
    var srcCoin = document.querySelector(".top-bar .coin-display");
    var dst = document.querySelector("#flNavCoin span");
    if (srcCoin && dst) {
      var m = String(srcCoin.textContent || "").match(/[\d,]+/);
      dst.textContent = m ? m[0] : "0";
    }
    var srcName = document.querySelector(".top-bar .user-info h3, .top-bar .user-info strong, .top-bar .user-info .name");
    var dstName = document.getElementById("flNavName");
    if (srcName && dstName && srcName.textContent.trim()) dstName.textContent = srcName.textContent.trim();
    var srcRole = document.querySelector(".top-bar .user-info p, .top-bar .user-info small, .top-bar .user-info .role");
    var dstRole = document.getElementById("flNavRole");
    if (srcRole && dstRole && srcRole.textContent.trim()) dstRole.textContent = srcRole.textContent.trim();
    if (dstName && dstName.textContent.trim()) {
      var ava = document.getElementById("flNavAva");
      if (ava) ava.textContent = dstName.textContent.trim().charAt(0).toUpperCase();
    }
  }

  function tick() {
    styles();
    build();
    sync();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  [300, 900, 1800, 3200].forEach(function (t) { setTimeout(tick, t); });
  setInterval(sync, 1500);

  window.FearLauncherModrinth = { go: go, refresh: sync };
})();
