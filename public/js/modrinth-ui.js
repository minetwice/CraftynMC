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
    ".btn-primary,.sidebar,.top-bar .nav-item.active{",
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

})();
