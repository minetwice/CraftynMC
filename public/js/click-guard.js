/* CraftynMC / FearLauncher — Click guard
 * ------------------------------------------------------------------
 * Neutralises popunder / click-hijack ad scripts WITHOUT breaking the
 * site's own buttons and links. Real user clicks always work; only the
 * ad script's attempts to open extra windows/tabs are blocked.
 *
 * MUST load synchronously in <head> BEFORE the popunder script, so the
 * overrides are installed before the ad script captures window.open.
 *
 * What it does:
 *   1. Blocks window.open() to ad / cross-origin URLs (the usual popunder
 *      mechanism) while still allowing same-origin opens.
 *   2. Blocks programmatic <a target="_blank">.click() on external URLs.
 *   3. Blocks synthetic (untrusted) clicks aimed at external _blank links.
 *   4. Shields hidden full-screen transparent ad overlays that swallow
 *      clicks by setting pointer-events:none on them.
 *
 * Debug: window.__flClickGuardReport() returns everything it blocked.
 */
(function () {
  "use strict";
  if (window.__flClickGuard) return;
  window.__flClickGuard = true;

  var AD_HOSTS = [
    "profitableratecpm", "highrevenueformat", "adsterra",
    "onclickads", "popads", "popcash", "propellerads", "hilltopads",
    "adcash", "clickadu", "adprovider", "exoclick", "juicyads",
    "trafficjunky", "ad-maven", "mgid", "revcontent", "outbrain", "taboola"
  ];

  var blocked = [];
  function report(kind, detail) {
    blocked.push({ kind: kind, detail: String(detail || "") });
    try { console.warn("[FearLauncher click-guard] blocked " + kind + ": " + detail); } catch (e) {}
  }

  function isAdUrl(url) {
    if (!url) return false;
    var u = String(url).toLowerCase();
    for (var i = 0; i < AD_HOSTS.length; i++) if (u.indexOf(AD_HOSTS[i]) !== -1) return true;
    return false;
  }

  function isCrossOrigin(url) {
    try {
      if (!url) return false;
      var a = document.createElement("a");
      a.href = url;
      if (!a.hostname) return false;
      return a.hostname !== location.hostname;
    } catch (e) { return false; }
  }

  // 1) window.open popups -------------------------------------------------
  var _open = window.open;
  window.open = function (url, name, features) {
    if (url && (isCrossOrigin(url) || isAdUrl(url))) {
      report("window.open", url);
      return null;
    }
    return _open ? _open.apply(window, arguments) : null;
  };

  // 2) programmatic external _blank anchor clicks -------------------------
  if (window.HTMLAnchorElement && HTMLAnchorElement.prototype) {
    var _click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      try {
        if (this.target === "_blank" && (isCrossOrigin(this.href) || isAdUrl(this.href))) {
          report("anchor.click", this.href);
          return;
        }
      } catch (e) {}
      return _click.apply(this, arguments);
    };
  }

  // 3) synthetic clicks on external _blank links --------------------------
  document.addEventListener("click", function (e) {
    if (e.isTrusted) return;                 // real user clicks always pass
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    var a = t.closest ? t.closest("a[target=_blank]") : null;
    if (a && (isCrossOrigin(a.href) || isAdUrl(a.href))) {
      report("synthetic click", a.href);
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // 4) hidden full-screen transparent ad overlays -------------------------
  function shieldOverlays() {
    var els = document.body ? document.body.children : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el || el.nodeType !== 1) continue;
      if (el.id === "dgOverlay" || el.id === "flAdSlot" || (el.classList && el.classList.contains("fl-banner"))) continue;
      var cs;
      try { cs = getComputedStyle(el); } catch (e) { continue; }
      if (!cs || cs.position !== "fixed") continue;
      var z = parseInt(cs.zIndex, 10);
      if (isNaN(z) || z < 1000) continue;
      var r = el.getBoundingClientRect();
      if (!(r.width >= window.innerWidth * 0.6 && r.height >= window.innerHeight * 0.6)) continue;
      var transparent = cs.opacity === "0" || cs.opacity === "0.0" ||
        cs.backgroundColor === "rgba(0, 0, 0, 0)" || cs.backgroundColor === "transparent";
      var looksAd = isAdUrl(el.id) || isAdUrl(el.className) || isAdUrl(el.getAttribute("data-ad") || "");
      var iframe = el.querySelector ? el.querySelector("iframe") : null;
      var hasAdIframe = !!(iframe && isAdUrl(iframe.src));
      var selfIsAd = el.tagName === "IFRAME" && isAdUrl(el.src);
      if (transparent && (looksAd || hasAdIframe || selfIsAd || z >= 5000)) {
        el.style.pointerEvents = "none";
        el.setAttribute("data-fl-shielded", "1");
        report("overlay shielded", el.id || el.className || el.tagName);
      }
    }
  }

  window.__flClickGuardReport = function () { return blocked.slice(); };
  window.FearLauncherClickGuard = { report: window.__flClickGuardReport, shield: shieldOverlays };

  function boot() {
    shieldOverlays();
    setInterval(shieldOverlays, 2500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
