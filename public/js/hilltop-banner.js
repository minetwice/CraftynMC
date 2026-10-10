/* CraftynMC / FearLauncher — HilltopAds banners (2 fixed slots)
 * ------------------------------------------------------------------
 * TWO banner slots placed in the main content area — OUTSIDE the page
 * sections — so both stay visible on EVERY page:
 *
 *   - flBannerTop    : right below the top bar
 *   - flBannerBottom : at the end of the main content
 *
 * Two slots means two banner impressions per page view (plus the video
 * slider and the popunder). Each slot pulls a different zone from POOL,
 * so the two banners are usually different creatives.
 *
 * The banners are created by running HilltopAds' OWN loader code inside
 * each slot, exactly the way the network expects.
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

  function makeSlot(id) {
    var wrap = document.createElement("div");
    wrap.id = id;
    wrap.setAttribute("aria-label", "Advertisement");
    wrap.style.cssText = "display:flex;align-items:center;justify-content:center;margin:14px auto;max-width:100%;min-height:50px";

    var key = POOL[idx % POOL.length];
    idx++;

    var ldr = document.createElement("script");
    ldr.textContent = loaderCode(key);
    wrap.appendChild(ldr);
    return wrap;
  }

  function place() {
    var main = mainEl();
    if (!main) return;
    var tb = main.querySelector(".top-bar");

    // Top slot: right below the top bar.
    if (!document.getElementById("flBannerTop")) {
      var top = makeSlot("flBannerTop");
      if (tb && tb.parentNode === main && tb.nextSibling) main.insertBefore(top, tb.nextSibling);
      else if (tb && tb.parentNode === main) main.appendChild(top);
      else main.insertBefore(top, main.firstChild);
    }

    // Bottom slot: at the end of the main content.
    if (!document.getElementById("flBannerBottom")) {
      main.appendChild(makeSlot("flBannerBottom"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", place);
  } else {
    place();
  }
})();
