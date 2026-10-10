/* CraftynMC / FearLauncher — Click guard
 * ------------------------------------------------------------------
 * Shields hidden full-screen transparent ad overlays that swallow
 * clicks, by setting pointer-events:none on them.
 *
 * NOTE: the old window.open / anchor-click BLOCKING has been removed,
 * because the site now runs a HilltopAds popunder which legitimately
 * opens a new tab on a click. Real user clicks and links are untouched.
 *
 * Debug: window.__flClickGuardReport() returns everything it shielded.
 */
(function () {
  "use strict";
  if (window.__flClickGuard) return;
  window.__flClickGuard = true;

  var AD_HOSTS = [
    "profitableratecpm", "highrevenueformat", "adsterra",
    "onclickads", "popads", "popcash", "propellerads",
    "adcash", "clickadu", "adprovider", "exoclick", "juicyads",
    "trafficjunky", "ad-maven", "mgid", "revcontent", "outbrain", "taboola"
  ];

  var shielded = [];
  function report(detail) {
    shielded.push(String(detail || ""));
    try { console.warn("[FearLauncher click-guard] shielded overlay: " + detail); } catch (e) {}
  }

  function isAdUrl(url) {
    if (!url) return false;
    var u = String(url).toLowerCase();
    for (var i = 0; i < AD_HOSTS.length; i++) if (u.indexOf(AD_HOSTS[i]) !== -1) return true;
    return false;
  }

  function shieldOverlays() {
    var els = document.body ? document.body.children : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el || el.nodeType !== 1) continue;
      if (el.id === "dgOverlay" || el.id === "flAdSlot" ||
          el.id === "flSectionBanner" || (el.classList && el.classList.contains("fl-banner"))) continue;
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
        report(el.id || el.className || el.tagName);
      }
    }
  }

  window.__flClickGuardReport = function () { return shielded.slice(); };
  window.FearLauncherClickGuard = { report: window.__flClickGuardReport, shield: shieldOverlays };

  function boot() {
    shieldOverlays();
    setInterval(shieldOverlays, 2500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
