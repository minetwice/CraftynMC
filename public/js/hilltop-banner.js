/* CraftynMC / FearLauncher — HilltopAds banner
 * ------------------------------------------------------------------
 * One banner slot placed at the top of the main content area — OUTSIDE
 * the page sections — so it stays visible on EVERY page (dashboard,
 * mods, plugins, skins, ...), not just the first one.
 *
 * Why a fixed slot instead of a per-page one: the network's ad script
 * does not reliably render a second time when it is re-injected on each
 * page change (and it caps impressions per user), which is why a
 * per-page banner would show once and then disappear.
 *
 * The banner is created by running HilltopAds' OWN loader code inside
 * the slot, exactly the way the network expects.
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

  var SLOT_ID = "flBanner";
  var idx = 0;

  // HilltopAds' own loader, reproduced verbatim (with the zone url inlined).
  function loaderCode(src) {
    return "(function(x){" +
      "var d=document,s=d.createElement('script')," +
      "l=d.currentScript||d.scripts[d.scripts.length-1];" +
      "s.settings=x||{};s.src='" + src + "';s.async=true;" +
      "s.referrerPolicy='no-referrer-when-downgrade';" +
      "l.parentNode.insertBefore(s,l);})({})";
  }

  function mainEl() {
    return document.querySelector("main.main-content") || document.querySelector("main");
  }

  function place() {
    var main = mainEl();
    if (!main || document.getElementById(SLOT_ID)) return;

    var wrap = document.createElement("div");
    wrap.id = SLOT_ID;
    wrap.setAttribute("aria-label", "Advertisement");
    wrap.style.cssText = "display:flex;align-items:center;justify-content:center;margin:14px auto;max-width:100%;min-height:50px";

    // Right below the top bar, above the active page content.
    var tb = main.querySelector(".top-bar");
    if (tb && tb.parentNode === main && tb.nextSibling) main.insertBefore(wrap, tb.nextSibling);
    else if (tb && tb.parentNode === main) main.appendChild(wrap);
    else main.insertBefore(wrap, main.firstChild);

    var key = POOL[idx % POOL.length];
    idx++;

    var ldr = document.createElement("script");
    ldr.textContent = loaderCode(key);
    wrap.appendChild(ldr);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", place);
  } else {
    place();
  }
})();
