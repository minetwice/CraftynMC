/* CraftynMC / FearLauncher — presence heartbeat
 * ------------------------------------------------------------------
 * While a logged-in visitor has the site open, ping /api/presence every
 * 30s (and when the tab becomes visible again) so the admin dashboard can
 * show who is online and how long they have been on.
 */
(function () {
  "use strict";

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken(); } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) { return ""; }
  }

  function ping() {
    var t = token();
    if (!t) return;
    if (document.hidden) return;
    try {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
        body: JSON.stringify({ source: "web" }),
      });
    } catch (e) {}
  }

  function init() {
    ping();
    setInterval(ping, 30000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) ping();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
