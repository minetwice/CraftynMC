/* CraftynMC / FearLauncher — HilltopAds banners (multi-slot + per-navigation)
 * ------------------------------------------------------------------
 * Four slots so a wide desktop layout actually gets ads:
 *   - flBannerTop     : below the top bar (every page)
 *   - flBannerBottom  : end of the main content (every page)
 *   - flBannerRail    : fixed right-hand skyscraper  (desktop only, >=1280px)
 *   - flBannerSticky  : fixed bottom bar             (desktop only, >=1280px)
 *
 * EARNING BOOST — the site is an SPA, so a visitor browsing 8 sections used
 * to count as ONE pageview (one set of ads). Now a REAL navigation (a nav
 * click, never a timer) re-requests the ads, because that is a genuine new
 * page view. Throttled so it can never fire more than once every 30s.
 *
 * NOTE: this is a user-initiated refresh, not the auto-refresh (timer)
 * HilltopAds prohibits. If support ever objects, set NAV_REFRESH to false.
 *
 * VARIETY: add more HilltopAds Banner zone codes to POOL below.
 */
(function () {
  "use strict";

  var POOL = [
    "\/\/peacefulbicycle.com\/bvXkVns\/d.GZld0CYFWEcz\/ke\/mb9uuNZ\/U\/lwk\/P\/TScS1RMRDXY\/2xM\/ziM\/tIN-zoUsw\/NNjWYNztNLwB",
    "\/\/peacefulbicycle.com\/bLXLV.sidlG\/lm0cYtWXcb\/FevmJ9JudZCU\/l\/kzPMT-cQ1gM\/DrYg3mMQDNUKt\/NwzgUEwONAjocYw\/O\/Q_"
  ];

  var NAV_REFRESH = true;              // re-request ads on a real nav click
  var NAV_REFRESH_MIN_MS = 30000;      // never more than once per 30s
  var DESKTOP_MIN_PX = 1100;           // rail shows from here up

  var SLOTS = [
    { id: "flBannerTop", mode: "top" },
    { id: "flBannerMid", mode: "mid" },
    { id: "flBannerBottom", mode: "bottom" },
    { id: "flBannerRail", mode: "rail", desktop: true },
    { id: "flBannerSticky", mode: "sticky" }   // every screen — most traffic is mobile
  ];

  var idx = 0;
  var lastRefresh = 0;

  // HilltopAds' own loader, reproduced verbatim (zone url inlined).
  function loaderCode(src) {
    return "(function(x){" +
      "var d=document,s=d.createElement('script')," +
      "l=d.currentScript||d.scripts[d.scripts.length-1];" +
      "s.settings=x||{};s.src='" + src + "';s.async=true;" +
      "s.referrerPolicy='no-referrer-when-downgrade';" +
      "l.parentNode.insertBefore(s,l);})({})";
  }

  function loaderNode() {
    var key = POOL[idx % POOL.length];
    idx++;
    var ldr = document.createElement("script");
    ldr.textContent = loaderCode(key);
    return ldr;
  }

  function styleFor(mode) {
    if (mode === "rail") {
      return "position:fixed;right:8px;top:96px;width:160px;min-height:600px;z-index:40;display:flex;align-items:flex-start;justify-content:center;pointer-events:auto";
    }
    if (mode === "sticky") {
      return "position:fixed;left:0;right:0;bottom:0;min-height:60px;z-index:41;display:flex;align-items:center;justify-content:center;background:rgba(6,7,12,.94);border-top:1px solid var(--border-color);pointer-events:auto;overflow:hidden";
    }
    return "display:flex;align-items:center;justify-content:center;margin:14px auto;max-width:100%;min-height:50px";
  }

  function mainEl() {
    return document.querySelector("main.main-content") || document.querySelector("main");
  }

  function isDesktop() {
    try { return window.innerWidth >= DESKTOP_MIN_PX; } catch (e) { return true; }
  }

  function remove(id) {
    var el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function place(force) {
    var main = mainEl();
    if (!main) return;
    var tb = main.querySelector(".top-bar");

    SLOTS.forEach(function (slot) {
      if (slot.desktop && !isDesktop()) { remove(slot.id); return; }
      if (!force && document.getElementById(slot.id)) return;
      remove(slot.id);

      var wrap = document.createElement("div");
      wrap.id = slot.id;
      wrap.setAttribute("aria-label", "Advertisement");
      wrap.style.cssText = styleFor(slot.mode);
      wrap.appendChild(loaderNode());

      if (slot.mode === "top") {
        if (tb && tb.parentNode === main && tb.nextSibling) main.insertBefore(wrap, tb.nextSibling);
        else main.insertBefore(wrap, main.firstChild);
      } else if (slot.mode === "bottom") {
        main.appendChild(wrap);
      } else if (slot.mode === "mid") {
        // Between two sections (a sibling of them, so it stays visible).
        var secs = main.querySelectorAll(".section");
        if (secs.length > 1) main.insertBefore(wrap, secs[Math.floor(secs.length / 2)]);
        else main.appendChild(wrap);
      } else {
        document.body.appendChild(wrap);   // rail / sticky live on the viewport
      }
    });

    // Keep the sticky bar from covering the last bit of the page.
    document.body.style.paddingBottom = document.getElementById("flBannerSticky") ? "72px" : "";
  }

  // A nav click is a genuine new page view -> request fresh ads.
  function onNav() {
    if (!NAV_REFRESH) return;
    var now = Date.now();
    if (now - lastRefresh < NAV_REFRESH_MIN_MS) return;
    lastRefresh = now;
    place(true);
  }

  // Handy for debugging: force a fresh set of ads right now.
  window.FearLauncherBanners = {
    refresh: function () { lastRefresh = 0; place(true); },
    slots: function () { return SLOTS.map(function (s) { return s.id; }).filter(function (id) { return !!document.getElementById(id); }); }
  };

  function init() {
    place(false);
    lastRefresh = Date.now();

    document.addEventListener("click", function (e) {
      var a = (e.target && e.target.closest) ? e.target.closest(".nav-item[data-section]") : null;
      if (a) setTimeout(onNav, 300);
    }, true);

    // Re-evaluate desktop-only slots when the viewport changes.
    try {
      window.addEventListener("resize", function () {
        var railThere = !!document.getElementById("flBannerRail");
        if (isDesktop() !== railThere) place(false);
      });
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
