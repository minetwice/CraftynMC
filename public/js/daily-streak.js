/* CraftynMC / FearLauncher — Daily Rewards 2.0 status strip
 * ------------------------------------------------------------------
 * Injects a streak strip at the top of the Daily Rewards section showing the
 * 10-day coin ladder, which day you are on, and your streak freezes.
 * Data: GET /api/daily-reward/status
 */
(function () {
  "use strict";

  var PANEL_ID = "flStreakPanel";

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken(); } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) { return ""; }
  }

  var CSS = [
    ".flk-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:14px 16px;margin-bottom:16px}",
    ".flk-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}",
    ".flk-title{display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#fff;margin:0}",
    ".flk-sub{font-size:12px;color:var(--text-secondary)}",
    ".flk-days{display:grid;grid-template-columns:repeat(10,1fr);gap:6px}",
    ".flk-day{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--border-color);font-size:11px;color:var(--text-secondary)}",
    ".flk-day b{color:#fff;font-size:12px}",
    ".flk-day.done{background:rgba(0,255,136,.12);border-color:rgba(0,255,136,.35)}",
    ".flk-day.done b{color:#00ff88}",
    ".flk-day.now{background:rgba(255,0,72,.16);border-color:var(--primary-red)}",
    ".flk-day.now b{color:#fff}",
    ".flk-freeze{color:gold;font-weight:700}",
    "@media (max-width:640px){.flk-days{grid-template-columns:repeat(5,1fr)}}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flkStyles")) return;
    var st = document.createElement("style");
    st.id = "flkStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function render(d) {
    var el = document.getElementById(PANEL_ID);
    if (!el) return;
    var days = (d.rewards || []).map(function (r, i) {
      var n = i + 1;
      var cls = n < d.nextStreak ? "done" : (n === d.nextStreak ? "now" : "");
      return '<div class="flk-day ' + cls + '"><b>Day ' + n + "</b><span>" + r + "</span></div>";
    }).join("");

    el.innerHTML =
      '<div class="flk-card">' +
        '<div class="flk-head">' +
          '<h3 class="flk-title"><i class="fas fa-fire" style="color:var(--primary-red)"></i> Daily streak' +
            (d.streak ? " — Day " + d.streak : "") + "</h3>" +
          '<span class="flk-sub">' + (d.canClaim
            ? 'Claim today for <b style="color:gold">+' + d.nextReward + " coins</b>"
            : "Claimed today ✓ — come back tomorrow") +
            (d.freezes ? ' &middot; <span class="flk-freeze">❄ ' + d.freezes + " freeze" + (d.freezes > 1 ? "s" : "") + "</span>" : "") +
          "</span>" +
        "</div>" +
        '<div class="flk-days">' + days + "</div>" +
      "</div>";
  }

  function load() {
    var t = token();
    if (!t) return;
    fetch("/api/daily-reward/status", { headers: { Authorization: "Bearer " + t } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) render(d); })
      .catch(function () {});
  }

  function place() {
    var sec = document.getElementById("daily-rewards");
    if (!sec) return;
    if (!document.getElementById(PANEL_ID)) {
      injectStyles();
      var wrap = document.createElement("div");
      wrap.id = PANEL_ID;
      sec.insertBefore(wrap, sec.firstChild);
    }
    if (sec.classList.contains("active")) load();
  }

  function init() {
    place();
    setInterval(place, 20000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
