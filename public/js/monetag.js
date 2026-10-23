/* CraftynMC — Monetag in-page push (ad Network B)
 * ------------------------------------------------------------------
 * This is Monetag's own loader, written out plainly instead of the obfuscated
 * one-liner they hand out — same behaviour, easier to read and audit:
 *
 *   (function(s){ s.dataset.zone='12105284';
 *                 s.src='https://nap5k.com/tag.min.js' })(
 *     [document.documentElement, document.body].filter(Boolean).pop()
 *       .appendChild(document.createElement('script')))
 *
 * The script is appended to <body> (or <html>), so Monetag decides where the
 * in-page push units appear — it is not tied to one of our banner slots.
 *
 * Rules we respect:
 *   - this is Network B, separate from HilltopAds (no ad stacking)
 *   - it is NOT loaded at all in ADSENSE_MODE, because AdSense forbids other
 *     networks' pop-up style formats on the same pages
 *   - it never runs twice
 */
(function () {
  "use strict";

  var ZONE = "12105284";
  var SRC = "https://nap5k.com/tag.min.js";

  function load() {
    if (window.__flMonetagLoaded) return;
    window.__flMonetagLoaded = true;
    try {
      var s = document.createElement("script");
      s.dataset.zone = ZONE;
      s.src = SRC;
      s.async = true;
      s.referrerPolicy = "no-referrer-when-downgrade";
      (document.body || document.documentElement).appendChild(s);
    } catch (e) {
      /* a blocked ad script must never break the page */
    }
  }

  // Wait for a body to exist — the tag needs a parent to attach to.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
