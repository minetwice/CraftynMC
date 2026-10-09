/* CraftynMC / FearLauncher — Ad slot placement
 * ------------------------------------------------------------------
 * The ad markup itself (#flAdSlot + the network's scripts) is injected
 * inline into the served HTML (see src/index.js) so the ad network's
 * script is parsed the normal way. This file only decides WHERE the
 * 160x300 slot sits, responsively:
 *
 *   - wide screens (>= 1280px): a fixed right-side rail, vertically
 *     centred in the empty margin. Always visible, never overlaps the
 *     dashboard content.
 *   - smaller screens: an in-flow "Advertisement" card placed inside the
 *     Dashboard section, so it reads as native content instead of
 *     covering the screen.
 */
(function () {
  "use strict";

  var WIDE = "(min-width:1280px)";

  function injectStyles() {
    if (document.getElementById("flAdStyles")) return;
    var st = document.createElement("style");
    st.id = "flAdStyles";
    st.textContent = [
      ".fl-ad-slot{box-sizing:border-box;font-family:'Outfit',sans-serif}",
      ".fl-ad-label{display:block;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--text-secondary);opacity:.55;text-align:center;margin-bottom:6px}",
      "@media " + WIDE + "{.fl-ad-slot{position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:80;padding:8px 8px 6px;border-radius:16px;background:rgba(10,12,18,.6);border:1px solid var(--border-color);box-shadow:0 10px 40px rgba(0,0,0,.5)}}",
      "@media (max-width:1279px){.fl-ad-slot{display:block;margin:26px auto;padding:14px 14px 10px;border-radius:16px;background:rgba(10,12,18,.5);border:1px solid var(--border-color);max-width:220px;overflow:hidden}}"
    ].join("");
    document.head.appendChild(st);
  }

  function ensureLabel(slot) {
    if (slot.querySelector(".fl-ad-label")) return;
    var lbl = document.createElement("span");
    lbl.className = "fl-ad-label";
    lbl.textContent = "Advertisement";
    slot.insertBefore(lbl, slot.firstChild);
  }

  function isWide() {
    try {
      if (window.matchMedia) return window.matchMedia(WIDE).matches;
    } catch (e) {}
    return window.innerWidth >= 1280;
  }

  function place() {
    var slot = document.getElementById("flAdSlot");
    if (!slot) return;

    if (isWide()) {
      // Fixed rail: keep it a direct child of <body> so it stays visible
      // on every section.
      if (slot.parentNode !== document.body) document.body.appendChild(slot);
      return;
    }

    // In-flow card: sit inside the Dashboard section, right after the first card.
    var dash = document.getElementById("dashboard");
    if (!dash || slot.parentNode === dash) return;
    var firstCard = dash.querySelector(".card");
    if (firstCard && firstCard.parentNode === dash && firstCard.nextSibling) {
      dash.insertBefore(slot, firstCard.nextSibling);
    } else {
      dash.appendChild(slot);
    }
  }

  var resizeTimer = null;
  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(place, 150);
  }

  function init() {
    injectStyles();
    var slot = document.getElementById("flAdSlot");
    if (slot) ensureLabel(slot);
    place();
    window.addEventListener("resize", onResize);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
