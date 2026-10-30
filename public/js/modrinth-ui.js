/* CraftynMC — visual polish (no layout change)
 * ------------------------------------------------------------------
 * ONLY styling. The original left sidebar is left exactly as it was — every
 * nav option stays where the player expects it.
 *
 * What this does:
 *   1. tidies the surfaces (flatter cards, consistent radii) on your own red
 *   2. adds quick, tasteful motion (hover lift + staggered entrance)
 *   3. removes the two blank-space bugs:
 *        - min-height:100vh on the content column forced a full-screen void
 *        - empty ad slots kept their height
 *
 * What this deliberately does NOT do: touch the sidebar, the nav, the colour,
 * or the page structure.
 */
(function () {
  "use strict";

  var CSS = [
    /* ---- the content column must size to its content, not the viewport ---- */
    ".app-container{align-items:flex-start!important}",
    ".main-content{min-height:0!important}",
    ".section.active{min-height:0!important}",

    /* ---- surfaces: flatter, consistent radii, no heavy glow ---- */
    ".card,.mcard,.shop-item,.reward-card,.feature-card,.stat-card{",
      "border-radius:16px!important;",
      "box-shadow:0 2px 10px rgba(0,0,0,.35)!important;",
      "transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease!important;",
    "}",
    ".card:hover,.feature-card:hover,.shop-item:hover,.reward-card:hover{",
      "transform:translateY(-2px);",
      "border-color:var(--border-hover)!important;",
      "box-shadow:var(--shadow-hover)!important;",
    "}",

    /* ---- buttons: consistent, snappy ---- */
    "button:not(.fl-nav-link):not(.fl-burger),.btn{",
      "border-radius:12px!important;",
      "transition:filter .15s ease,transform .12s ease!important;",
    "}",
    "button:not(.fl-nav-link):not(.fl-burger):hover{filter:brightness(1.08)}",
    "button:not(.fl-nav-link):not(.fl-burger):active{transform:scale(.985)}",

    /* ---- motion: entrance only, nothing loops ---- */
    "@keyframes flRise{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}",
    ".card,.st-card,.fh-card,.pp-card,.mcard,.feature-card,.shop-item,.reward-card{",
      "animation:flRise .34s cubic-bezier(.16,1,.3,1) both}",
    ".st-grid>.st-card:nth-child(2n),.fh-row>.fh-card:nth-child(2n){animation-delay:.04s}",
    ".st-grid>.st-card:nth-child(3n),.fh-row>.fh-card:nth-child(3n){animation-delay:.08s}",
    ".section.active{animation:flRise .28s ease both}",

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
  }

  function init() {
    styles();
    // If a previous version of this script hid the sidebar behind a top navbar,
    // undo that so the real left sidebar is back exactly as it was.
    if (document.body.classList.contains("fl-topnav")) document.body.classList.remove("fl-topnav");
    var oldNav = document.getElementById("flTopNav");
    if (oldNav && oldNav.parentNode) oldNav.parentNode.removeChild(oldNav);
    var oldSheet = document.getElementById("flNavSheet");
    if (oldSheet && oldSheet.parentNode) oldSheet.parentNode.removeChild(oldSheet);
    // ...and drop the padding that reserved space for that navbar.
    var main = document.querySelector("main.main-content") || document.querySelector("main");
    if (main) main.style.paddingTop = "";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  [300, 900, 1800].forEach(function (t) { setTimeout(init, t); });

  /* ============================================================
     CraftynMC design system — colours, type, glass, motion.
     Styling ONLY. No markup, no data, no sidebar changes.
     ============================================================ */
  var DESIGN = [
    /* ---- a real display face ---- */
    "@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Outfit:wght@300;400;500;600;700&display=swap');",

    ":root{",
      "--fl-butter:cubic-bezier(.22,1,.36,1);",
      "--fl-glass:rgba(255,255,255,.055);",
      "--fl-glass-2:rgba(255,255,255,.085);",
      "--fl-glass-line:rgba(255,255,255,.13);",
      "--fl-red:#ff1e5c;",
      "--fl-red-deep:#9d0030;",
      "--fl-gold:#ffd44a;",
      "--fl-mint:#31f0b2;",
      "--fl-sky:#6cbbff;",
    "}",

    /* ---- headline font everywhere it belongs ---- */
    "h1,h2,h3,.section-title,.hero h1,.stat-value,.brand-text{",
      "font-family:'Bricolage Grotesque','Outfit',system-ui,sans-serif !important;",
      "letter-spacing:-.7px;",
    "}",
    "body,.section,.card,p,span,button,input,textarea,select{",
      "font-family:'Outfit',system-ui,-apple-system,'Segoe UI',sans-serif;",
    "}",

    /* ---- richer, more vivid red ---- */
    ":root{--primary-red:#ff1e5c;--primary-glow:rgba(255,30,92,.55)}",
    /* ONLY the primary button. The sidebar must never get a solid fill —
       that was the red glitch. */
    ".btn-primary{",
      "background-image:linear-gradient(140deg,var(--fl-red),var(--fl-red-deep)) !important;",
    "}",

    /* ---- glass surfaces ---- */
    ".card,.stat-card,.asset-card,.project-card,.modal-content,.panel,.section > .card{",
      "background:var(--fl-glass) !important;",
      "-webkit-backdrop-filter:blur(20px) saturate(1.5);backdrop-filter:blur(20px) saturate(1.5);",
      "border:1px solid var(--fl-glass-line) !important;",
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 20px 44px -26px rgba(0,0,0,.9) !important;",
      "border-radius:16px;",
    "}",

    /* ---- butter motion on everything clickable ---- */
    ".card,.stat-card,.asset-card,.project-card,.btn,.btn-primary,.nav-item,.sidebar a{",
      "transition:transform .34s var(--fl-butter),box-shadow .34s var(--fl-butter),",
        "border-color .34s var(--fl-butter),background .3s var(--fl-butter) !important;",
    "}",
    ".card:hover,.stat-card:hover,.asset-card:hover,.project-card:hover{",
      "transform:translateY(-3px);border-color:rgba(255,30,92,.4) !important;",
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 30px 54px -28px rgba(0,0,0,1) !important;",
    "}",
    ".btn:active,.btn-primary:active{transform:scale(.985)}",

    /* ---- vivid accents on numbers and badges ---- */
    ".coins,.coin-count,.stat-value{color:var(--fl-gold)}",
    ".badge,.tag{background:rgba(255,30,92,.14) !important;border:1px solid rgba(255,30,92,.34) !important}",

    /* ---- smooth scrolling ---- */
    "html{scroll-behavior:smooth}",

    /* ---- never break the layout: no min-height voids ---- */
    ".main-content{min-height:0 !important}",

    "@media (prefers-reduced-motion:reduce){",
      "*,*::before,*::after{transition-duration:.01ms !important;animation-duration:.01ms !important}",
      "html{scroll-behavior:auto}",
    "}"
  ].join("");

  function applyDesign(){
    if (document.getElementById("flDesignSystem")) return;
    var st = document.createElement("style");
    st.id = "flDesignSystem";
    st.textContent = DESIGN;
    document.head.appendChild(st);
  }
  applyDesign();
  [600, 2000, 4000].forEach(function (t) { setTimeout(applyDesign, t); });


  /* ============================================================
     FULL UI TRANSFORM — built on the site's REAL class names
     (card, stat-card, banner-card, carousel-card, shop-item,
      nav-item, card-title, stat-value, sidebar-toggle-btn)
     Styling only. No markup, no data, no sidebar fill.
     ============================================================ */
  var TRANSFORM = [
    /* ---------- type ---------- */
    "h1,h2,h3,h4,.card-title,.stat-value,.hero-title,.section-title{",
      "font-family:'Bricolage Grotesque','Outfit',system-ui,sans-serif !important;",
      "letter-spacing:-.6px;",
    "}",
    ".card-title{font-weight:700 !important;font-size:16px !important;letter-spacing:-.4px}",
    ".stat-value{font-weight:700 !important;letter-spacing:-1.2px;font-variant-numeric:tabular-nums}",
    ".stat-label,.card-header{font-size:11px !important;letter-spacing:.14em;text-transform:uppercase;",
      "color:rgba(255,255,255,.5) !important;font-weight:600}",

    /* ---------- glass on every real surface ---------- */
    ".card,.stat-card,.banner-card,.carousel-card,.shop-item,.modal-content,.panel{",
      "background:rgba(255,255,255,.055) !important;",
      "-webkit-backdrop-filter:blur(20px) saturate(1.55);backdrop-filter:blur(20px) saturate(1.55);",
      "border:1px solid rgba(255,255,255,.13) !important;",
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 22px 46px -26px rgba(0,0,0,.95) !important;",
      "border-radius:18px !important;",
      "transition:transform .34s cubic-bezier(.22,1,.36,1),box-shadow .34s cubic-bezier(.22,1,.36,1),",
        "border-color .34s cubic-bezier(.22,1,.36,1) !important;",
      "transform:translateZ(0);",
    "}",
    ".card:hover,.stat-card:hover,.banner-card:hover,.carousel-card:hover,.shop-item:hover{",
      "transform:translateY(-4px);",
      "border-color:rgba(255,30,92,.42) !important;",
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 34px 60px -30px rgba(0,0,0,1) !important;",
    "}",
    ".card:active,.stat-card:active,.shop-item:active{transform:translateY(-1px) scale(.994)}",

    /* ---------- vivid accents ---------- */
    ":root{--primary-red:#ff1e5c}",
    ".stat-value{color:#fff}",
    ".stat-card .stat-value{color:#ffd44a}",
    ".shop-item-price{color:#ffd44a !important;font-weight:800 !important}",
    ".shop-item-image{background:linear-gradient(150deg,rgba(255,30,92,.22),rgba(255,255,255,.04)) !important;",
      "border-radius:14px}",

    /* ---------- nav ---------- */
    ".nav-item{border-radius:11px !important;",
      "transition:background .26s cubic-bezier(.22,1,.36,1),color .26s cubic-bezier(.22,1,.36,1) !important}",
    ".nav-item:hover{background:rgba(255,255,255,.06) !important;color:#fff !important}",
    ".nav-item.active{background:rgba(255,30,92,.16) !important;color:#fff !important;",
      "box-shadow:inset 0 0 0 1px rgba(255,30,92,.32) !important;font-weight:600 !important}",

    /* ---------- the sidebar toggle must be easy to hit ---------- */
    ".sidebar-toggle-btn{",
      "width:42px !important;height:42px !important;border-radius:13px !important;",
      "background:linear-gradient(150deg,rgba(255,30,92,.26),rgba(255,255,255,.07)) !important;",
      "border:1px solid rgba(255,30,92,.42) !important;color:#fff !important;",
      "-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);",
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 12px 26px -14px rgba(255,30,92,.85) !important;",
      "display:flex !important;align-items:center !important;justify-content:center !important;",
      "transition:transform .26s cubic-bezier(.22,1,.36,1) !important;",
    "}",
    ".sidebar-toggle-btn:hover{transform:translateY(-2px)}",
    ".sidebar-toggle-btn:active{transform:scale(.95)}",

    /* ---------- buttons ---------- */
    ".btn,.custom-file-btn,.model-pick-btn{border-radius:12px !important;",
      "transition:transform .26s cubic-bezier(.22,1,.36,1),filter .26s !important}",
    ".btn:hover,.custom-file-btn:hover,.model-pick-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}",
    ".model-pick-btn.active{box-shadow:inset 0 0 0 1px rgba(255,30,92,.5) !important}",

    /* ---------- daily streak tiles ---------- */
    ".rewards-streak-grid > *{border-radius:14px !important;",
      "background:rgba(255,255,255,.05) !important;border:1px solid rgba(255,255,255,.12) !important}",

    /* ---------- keep the layout honest ---------- */
    ".main-content{min-height:0 !important}",
    "html{scroll-behavior:smooth}",
    "@media (prefers-reduced-motion:reduce){",
      "*,*::before,*::after{transition-duration:.01ms !important;animation-duration:.01ms !important}",
      "html{scroll-behavior:auto}",
    "}"
  ].join("");

  function applyTransform(){
    if (document.getElementById("flUiTransform")) return;
    var st = document.createElement("style");
    st.id = "flUiTransform";
    st.textContent = TRANSFORM;
    document.head.appendChild(st);
  }
  applyTransform();
  [500, 1600, 3500, 6000].forEach(function (t) { setTimeout(applyTransform, t); });


  /* ============================================================
     DASHBOARD → MOSAIC (bento) — matches the design preview
     Built on the real markup: #dashboard .grid-4 > .stat-card
     ============================================================ */
  var MOSAIC = [
    "#dashboard{padding-top:4px}",
    "#dashboard .grid-4{",
      "display:grid !important;",
      "grid-template-columns:repeat(4,minmax(0,1fr)) !important;",
      "gap:14px !important;",
      "margin-bottom:18px;",
    "}",
    /* the first tile becomes the hero: bigger, red glow, spans two columns */
    "#dashboard .grid-4 .stat-card:nth-child(1){",
      "grid-column:span 2;",
      "background:radial-gradient(520px 220px at 10% -20%,rgba(255,30,92,.30),transparent 68%),",
        "rgba(255,255,255,.075) !important;",
      "border-color:rgba(255,30,92,.34) !important;",
      "min-height:150px;",
      "display:flex;flex-direction:column;justify-content:center;",
    "}",
    "#dashboard .grid-4 .stat-card:nth-child(1) .stat-value{font-size:clamp(34px,5vw,48px) !important;line-height:1}",
    "#dashboard .grid-4 .stat-card:nth-child(1) .stat-label{color:rgba(255,255,255,.72) !important}",

    /* the other tiles: taller, breathing room, staggered look */
    "#dashboard .grid-4 .stat-card{min-height:150px;display:flex;flex-direction:column;",
      "justify-content:flex-end;padding:18px !important}",
    "#dashboard .grid-4 .stat-card .stat-value{font-size:clamp(26px,3.2vw,34px) !important;",
      "color:#ffd44a !important;line-height:1;margin-bottom:6px}",

    /* the cards under the stats join the same rhythm */
    "#dashboard > .card{margin-top:18px !important;border-radius:18px !important}",

    "@media (max-width:900px){",
      "#dashboard .grid-4{grid-template-columns:repeat(2,minmax(0,1fr)) !important}",
      "#dashboard .grid-4 .stat-card:nth-child(1){grid-column:span 2}",
      "#dashboard .grid-4 .stat-card{min-height:120px}",
    "}",
    "@media (max-width:560px){",
      "#dashboard .grid-4{grid-template-columns:1fr !important}",
      "#dashboard .grid-4 .stat-card:nth-child(1){grid-column:span 1}",
    "}"
  ].join("");

  function applyMosaic(){
    if (document.getElementById("flMosaic")) return;
    var st = document.createElement("style");
    st.id = "flMosaic";
    st.textContent = MOSAIC;
    document.head.appendChild(st);
  }
  applyMosaic();
  [500, 1600, 3500].forEach(function (t) { setTimeout(applyMosaic, t); });


  /* ============================================================
     LEAF ANIMATION — the cards float on their own, like the preview
     Bottom edge lifts, gentle sway, never the same speed twice.
     ============================================================ */
  var LEAF = [
    "@keyframes flLeafFloat{",
      "0%{transform:perspective(900px) rotateX(0deg) rotateY(-2.6deg) rotateZ(-.5deg) translateY(0)}",
      "50%{transform:perspective(900px) rotateX(-5.5deg) rotateY(2.6deg) rotateZ(.5deg) translateY(-7px)}",
      "100%{transform:perspective(900px) rotateX(0deg) rotateY(-2.6deg) rotateZ(-.5deg) translateY(0)}",
    "}",
    ".card,.stat-card,.banner-card,.carousel-card,.shop-item{",
      "transform-origin:50% 100%;",
      "animation-name:flLeafFloat;",
      "animation-timing-function:cubic-bezier(.45,0,.55,1);",
      "animation-iteration-count:infinite;",
      "animation-duration:7s;",
      "will-change:transform;",
    "}",
    /* never move in lockstep — vary speed and start point per position */
    ".card:nth-child(2n),.stat-card:nth-child(2n),.banner-card:nth-child(2n){animation-duration:8.4s;animation-delay:-1.6s}",
    ".card:nth-child(3n),.stat-card:nth-child(3n),.banner-card:nth-child(3n){animation-duration:9.6s;animation-delay:-3.1s}",
    ".card:nth-child(4n),.stat-card:nth-child(4n){animation-duration:6.4s;animation-delay:-.8s}",
    ".card:nth-child(5n),.stat-card:nth-child(5n){animation-duration:10.2s;animation-delay:-4.4s}",

    /* hovering must still lift the card, so pause the float while you point at it */
    ".card:hover,.stat-card:hover,.banner-card:hover,.carousel-card:hover,.shop-item:hover{",
      "animation-play-state:paused;",
      "transform:translateY(-4px) !important;",
    "}",

    "@media (prefers-reduced-motion:reduce){",
      ".card,.stat-card,.banner-card,.carousel-card,.shop-item{animation:none !important}",
    "}"
  ].join("");

  function applyLeaf(){
    if (document.getElementById("flLeaf")) return;
    var st = document.createElement("style");
    st.id = "flLeaf";
    st.textContent = LEAF;
    document.head.appendChild(st);
  }
  applyLeaf();
  [500, 1600, 3500].forEach(function (t) { setTimeout(applyLeaf, t); });


  /* ============================================================
     SCROLL FIX — the page must scroll exactly as far as the content.
     body{perspective} + transformed cards were inflating the scroll
     area, so the dashboard scrolled forever.
     ============================================================ */
  var SCROLLFIX = [
    /* perspective on <body> makes every transformed child extend the scroll box */
    "body{perspective:none !important;overflow-x:hidden !important}",
    "html{overflow-x:hidden}",
    /* the two 100vh floors that forced a full-screen void */
    ".app-container{min-height:0 !important;height:auto !important}",
    ".main-content{min-height:0 !important;height:auto !important;",
      "overflow:visible !important;padding-bottom:32px}",
    /* sections size to their own content */
    ".section{min-height:0 !important;height:auto !important}",
    /* keep the floating cards from expanding the scroll box */
    ".card,.stat-card,.banner-card,.carousel-card,.shop-item{",
      "contain:layout style;",
      "transform:translateZ(0);",
    "}",
    /* centre the content column so it does not hug one edge on wide screens */
    ".main-content{max-width:1560px;margin-left:280px;margin-right:auto}",
    "@media (min-width:1800px){.main-content{margin-left:auto;padding-left:calc(280px + 32px)}}",
    "@media (max-width:1100px){.main-content{max-width:none}}"
  ].join("");

  function applyScrollFix(){
    if (document.getElementById("flScrollFix")) return;
    var st = document.createElement("style");
    st.id = "flScrollFix";
    st.textContent = SCROLLFIX;
    document.head.appendChild(st);
  }
  applyScrollFix();
  [400, 1500, 3200].forEach(function (t) { setTimeout(applyScrollFix, t); });

})();
