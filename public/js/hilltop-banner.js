/* CraftynMC / FearLauncher — HilltopAds section banner (rotating)
 * ------------------------------------------------------------------
 * Shows ONE banner inside the currently active page/section (dashboard,
 * mods, plugins, resources, shaders, skins, capes, shop, ...). When the
 * visitor switches page, the old banner is removed and a NEW one is
 * requested — so each page gets a fresh ad.
 *
 * Only the visible section gets a banner (never the hidden ones), so we
 * do not create impressions for invisible slots.
 *
 * VARIETY: add more HilltopAds Banner zone codes to POOL below. With one
 * code the network still rotates creatives; with several you rotate
 * zones too.
 */
(function () {
  "use strict";

  // Add more banner zone codes (same format) here for more variety:
  var POOL = [
    "\/\/peacefulbicycle.com\/bvXkVns\/d.GZld0CYFWEcz\/ke\/mb9uuNZ\/U\/lwk\/P\/TScS1RMRDXY\/2xM\/ziM\/tIN-zoUsw\/NNjWYNztNLwB"
  ];

  var SLOT_ID = "flSectionBanner";
  var idx = 0;

  function activeSection() {
    return document.querySelector(".section.active");
  }

  function render() {
    var sec = activeSection();
    if (!sec) return;

    var old = document.getElementById(SLOT_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var wrap = document.createElement("div");
    wrap.id = SLOT_ID;
    wrap.setAttribute("aria-label", "Advertisement");
    wrap.style.cssText = "display:flex;align-items:center;justify-content:center;margin:16px auto 6px;max-width:100%;overflow:hidden;min-height:60px";
    sec.insertBefore(wrap, sec.firstChild);

    var key = POOL[idx % POOL.length];
    idx++;

    var s = document.createElement("script");
    s.async = true;
    s.referrerPolicy = "no-referrer-when-downgrade";
    s.settings = {};
    s.src = key;
    wrap.appendChild(s);
  }

  function init() {
    render();
    var last = (activeSection() || {}).id || null;
    setInterval(function () {
      var sec = activeSection();
      var id = sec ? sec.id : null;
      if (id && id !== last) { last = id; render(); }
    }, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
