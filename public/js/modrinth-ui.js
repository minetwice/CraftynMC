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
})();
