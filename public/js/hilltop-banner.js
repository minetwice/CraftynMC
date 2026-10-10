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
 * The banner is created by running HilltopAds' OWN loader code inside the
 * slot, exactly the way the network expects (document.currentScript etc.).
 *
 * VARIETY: add more HilltopAds Banner zone codes to POOL below.
 */
(function () {
  "use strict";

  // Add more banner zone codes (same format) here for more variety:
  var POOL = [
    "\/\/peacefulbicycle.com\/bvXkVns\/d.GZld0CYFWEcz\/ke\/mb9uuNZ\/U\/lwk\/P\/TScS1RMRDXY\/2xM\/ziM\/tIN-zoUsw\/NNjWYNztNLwB",
    "\/\/peacefulbicycle.com\/bLXLV.sidlG\/lm0cYtWXcb\/FevmJ9JudZCU\/l\/kzPMT-cQ1gM\/DrYg3mMQDNUKt\/NwzgUEwONAjocYw\/O\/Q_"
  ];

  var SLOT_ID = "flSectionBanner";
  var idx = 0;

  function activeSection() {
    return document.querySelector(".section.active");
  }

  // HilltopAds' own loader, reproduced verbatim (with the zone url inlined).
  function loaderCode(src) {
    return "(function(x){" +
      "var d=document,s=d.createElement('script')," +
      "l=d.currentScript||d.scripts[d.scripts.length-1];" +
      "s.settings=x||{};s.src='" + src + "';s.async=true;" +
      "s.referrerPolicy='no-referrer-when-downgrade';" +
      "l.parentNode.insertBefore(s,l);})({})";
  }

  function render() {
    var sec = activeSection();

    var old = document.getElementById(SLOT_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    // No banner on the login screen (authView) — avoids a wasted request
    // before the visitor is even on a real page.
    if (!sec || sec.id === "authView") return;

    var wrap = document.createElement("div");
    wrap.id = SLOT_ID;
    wrap.setAttribute("aria-label", "Advertisement");
    wrap.style.cssText = "display:flex;align-items:center;justify-content:center;margin:16px auto;max-width:100%;min-height:50px";
    sec.insertBefore(wrap, sec.firstChild);

    var key = POOL[idx % POOL.length];
    idx++;

    var ldr = document.createElement("script");
    ldr.textContent = loaderCode(key);
    wrap.appendChild(ldr);
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
