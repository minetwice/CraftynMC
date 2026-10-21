/* CraftynMC / FearLauncher — HilltopAds banners (multi-slot)
 * ------------------------------------------------------------------
 * Five slots, OUTSIDE the SPA sections, so one set of ads stays visible on
 * every page:
 *   - flBannerTop     : below the top bar (every page)
 *   - flBannerSticky  : fixed bottom bar (every screen, incl. mobile)
 *   - flBannerMid     : between two sections
 *   - flBannerBottom  : end of the main content
 *   - flBannerRail    : fixed right-hand skyscraper (desktop only, >=1100px)
 *
 * RULES THAT SHAPE THIS FILE (learned the hard way):
 *   1) A HilltopAds banner zone fills only ONCE per page view — so every slot
 *      must use a DIFFERENT zone from POOL. N zones => N banners.
 *   2) The site is an SPA, so a nav click is NOT a new page view. Re-requesting
 *      ads on navigation wiped every banner, so NAV_REFRESH is OFF.
 *   3) Networks rarely fill a far off-screen slot, so each slot asks for its
 *      ad only once it scrolls into view (armSlot).
 *
 * VARIETY: add more HilltopAds Banner zone codes to POOL below.
 */
(function () {
  "use strict";

  var POOL = [
    "\/\/peacefulbicycle.com\/bvXkVns\/d.GZld0CYFWEcz\/ke\/mb9uuNZ\/U\/lwk\/P\/TScS1RMRDXY\/2xM\/ziM\/tIN-zoUsw\/NNjWYNztNLwB",
    "\/\/peacefulbicycle.com\/bLXLV.sidlG\/lm0cYtWXcb\/FevmJ9JudZCU\/l\/kzPMT-cQ1gM\/DrYg3mMQDNUKt\/NwzgUEwONAjocYw\/O\/Q_",
    "//peacefulbicycle.com/b/XrV.svdBG/lz0fYsW/cU/_e/my9suPZNU/l/ktPiTVcT1LMFzJkl2TOYDDULtwNczUUAzeOUTnYd4EOgQb",
    "//peacefulbicycle.com/bgXbV.scdHGblc0lY/WOcM/Me/m_9fuqZRUUlxkpPfTScg1JMGzTk/3/MwD/kAtQNYznUaz/O-T/csxbMywC"
  ];

  // DO NOT re-request ads when the player clicks a nav item. The whole site is
  // one page (an SPA), and a HilltopAds zone only fills ONCE per page view — so
  // re-requesting on navigation made every banner disappear. The slots live
  // OUTSIDE the sections, so one set of ads stays visible on every page.
  var NAV_REFRESH = false;
  var DESKTOP_MIN_PX = 1100;           // rail shows from here up

  // A HilltopAds banner zone fills only ONCE per page view, so every slot must
  // ask for a DIFFERENT zone. Slots are listed most-valuable first (the ones on
  // screen at load), and each takes the next zone from POOL. With N zones you
  // get N banners; add more zone codes to POOL to light up more slots.
  var SLOTS = [
    { id: "flBannerTop", mode: "top" },
    { id: "flBannerSticky", mode: "sticky" },   // every screen — most traffic is mobile
    { id: "flBannerMid", mode: "mid" },
    { id: "flBannerBottom", mode: "bottom" },
    { id: "flBannerRail", mode: "rail", desktop: true }
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

  function loaderNode(zoneIdx) {
    var key;
    if (zoneIdx === undefined) { key = POOL[idx % POOL.length]; idx++; }
    else { key = POOL[zoneIdx % POOL.length]; }
    var ldr = document.createElement("script");
    ldr.textContent = loaderCode(key);
    return ldr;
  }

  // Ad networks usually will not render a creative for a slot that is far
  // off-screen, so we request each slot's script the moment it comes into
  // view. Top / rail / sticky are on screen already, so they go immediately.
  function armSlot(wrap, slot, slotIndex) {
    var fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      wrap.setAttribute("data-loaded", "1");
      wrap.setAttribute("data-zone", String(slotIndex % POOL.length));
      wrap.appendChild(loaderNode(slotIndex));
    }
    if (slot.mode === "top" || slot.mode === "sticky" || slot.mode === "rail") return fire();
    if (typeof IntersectionObserver === "undefined") return fire();
    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { fire(); io.disconnect(); }
        });
      }, { rootMargin: "600px" });   // ask early — more requests means more fill
      io.observe(wrap);
      // Safety net: every slot must ask within a few seconds, even if the page
      // is too short to ever scroll it into view.
      setTimeout(fire, 8000);
    } catch (e) { fire(); }
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

    SLOTS.forEach(function (slot, slotIndex) {
      if (slot.desktop && !isDesktop()) { remove(slot.id); return; }
      if (!force && document.getElementById(slot.id)) return;
      remove(slot.id);

      var wrap = document.createElement("div");
      wrap.id = slot.id;
      wrap.setAttribute("aria-label", "Advertisement");
      wrap.style.cssText = styleFor(slot.mode);

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

      // Arm AFTER it is in the document — an IntersectionObserver on a detached
      // node never fires, which left mid/bottom stuck until the fallback.
      armSlot(wrap, slot, slotIndex);
    });

    // Keep the sticky bar from covering the last bit of the page.
    document.body.style.paddingBottom = document.getElementById("flBannerSticky") ? "72px" : "";
  }

  // Kept for the manual FearLauncherBanners.refresh() button only.
  function onNav() {
    if (!NAV_REFRESH) return;
    place(true);
  }

  /* ---------------- diagnostics (open  ?adsdebug=1  on the site) ---------------- */
  function adsDebug() {
    try { if (String(location.search || "").indexOf("adsdebug") === -1) return; } catch (e) { return; }
    var box = document.createElement("div");
    box.id = "flAdsDebug";
    box.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;background:#0b0d14;border:1px solid #ff0048;" +
      "border-radius:12px;padding:10px 12px;font:11px/1.55 ui-monospace,Menlo,monospace;color:#fff;max-width:92vw;" +
      "max-height:52vh;overflow:auto;box-shadow:0 12px 30px rgba(0,0,0,.7)";
    document.body.appendChild(box);

    function has(sel) { try { return !!document.querySelector(sel); } catch (e) { return false; } }

    function scan() {
      var rows = SLOTS.map(function (s, i) {
        var el = document.getElementById(s.id);
        if (!el) return "• " + s.id + " — NOT PLACED (needs a wider screen?)";
        var filled = el.querySelectorAll("iframe, ins, img, a, canvas").length;
        var asked = el.getAttribute("data-loaded") ? "asked" : "waiting to scroll in";
        var zone = el.getAttribute("data-zone");
        var scripts = el.querySelectorAll("script").length;
        return "• " + s.id + " (zone " + (zone === null ? i % POOL.length : zone) + ") — " +
          (filled ? "<b style='color:#00ff88'>FILLED (" + filled + ")</b>"
            : "<span style='color:#ff8fb0'>empty</span> [" + asked + ", scripts: " + scripts + "]");
      });
      var other =
        "popunder script: " + (has('script[src*="affectionatestorage"]') ? "<b style='color:#00ff88'>loaded</b>" : "<span style='color:#ff8fb0'>MISSING</span>") + "<br>" +
        "video slider: " + (has('script[src*="b.XcVesKd"]') ? "<b style='color:#00ff88'>loaded</b>" : "<span style='color:#ff8fb0'>MISSING</span>");
      box.innerHTML = "<b style='color:#ff0048'>AD DEBUG</b>  " + location.hostname + "<br>" +
        "width: " + window.innerWidth + "px · pool: " + POOL.length + " banner zone(s)<br>" +
        rows.join("<br>") + "<br>" + other +
        "<br><span style='color:#8b8ea0'>empty = the network served no creative for that zone</span>";
    }
    scan();
    setInterval(scan, 2000);
  }

  // An empty slot must not leave a gap on the page (that reads as a broken
  // layout), but a slot with an ad must never be hidden. "Truly empty" is
  // strict: nothing inside but our own loader script.
  function tidyOne(el, isSticky) {
    if (!el) return;
    var adNodes = el.querySelectorAll("iframe, ins, img, a, canvas, ins.adsbygoogle").length;
    var trulyEmpty = el.children.length <= 1;
    if (trulyEmpty && !adNodes) {
      el.style.minHeight = "0";
      el.style.height = "0";
      el.style.margin = "0";
      el.style.overflow = "hidden";
      if (isSticky) document.body.style.paddingBottom = "";
    } else {
      el.style.minHeight = "";
      el.style.height = "";
      el.style.margin = "";
      el.style.overflow = "";
      if (isSticky) document.body.style.paddingBottom = "72px";
    }
  }

  function tidySlots() {
    SLOTS.forEach(function (s) {
      tidyOne(document.getElementById(s.id), s.mode === "sticky");
    });
  }

  // Handy for debugging: force a fresh set of ads right now.
  window.FearLauncherBanners = {
    refresh: function () { lastRefresh = 0; place(true); },
    slots: function () { return SLOTS.map(function (s) { return s.id; }).filter(function (id) { return !!document.getElementById(id); }); },
    // Put a banner into an arbitrary container (used by the Earn Coins page).
    // A zone fills only once per page view, so this reuses a zone the fixed
    // slots are not already using.
    fill: function (el, zoneIdx) {
      try {
        if (!el || el.getAttribute("data-ad-filled") === "1") return false;
        el.setAttribute("data-ad-filled", "1");
        el.appendChild(loaderNode(zoneIdx));
        return true;
      } catch (e) { return false; }
    },
    zones: function () { return POOL.length; }
  };

  function init() {
    place(false);
    adsDebug();
    lastRefresh = Date.now();
    setTimeout(tidySlots, 9000);
    setInterval(tidySlots, 4000);

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
