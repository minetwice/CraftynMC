/* CraftynMC — Monetag Multitag (ad Network B, second zone)
 * ------------------------------------------------------------------
 * Monetag's Multitag snippet, written out plainly:
 *
 *   <script src="https://quge5.com/88/tag.min.js"
 *           data-zone="300964" async data-cfasync="false"></script>
 *
 * Multitag is Monetag's "all formats in one tag" product, so it may serve more
 * than one format type. We keep it separate from the in-page-push zone
 * (12105284) so each can be switched off on its own.
 *
 * Not loaded in ADSENSE_MODE, and never loaded twice.
 */
(function () {
  "use strict";

  var ZONE = "300964";
  var SRC = "https://quge5.com/88/tag.min.js";

  function load() {
    if (window.__flMonetagMultiLoaded) return;
    window.__flMonetagMultiLoaded = true;
    try {
      var s = document.createElement("script");
      s.src = SRC;
      s.setAttribute("data-zone", ZONE);
      s.setAttribute("data-cfasync", "false");
      s.async = true;
      (document.body || document.documentElement).appendChild(s);
    } catch (e) {
      /* a blocked ad script must never break the page */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
