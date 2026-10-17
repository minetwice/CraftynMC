/* CraftynMC / FearLauncher — admin presence panel
 * ------------------------------------------------------------------
 * Injects a live panel at the top of the Admin Dashboard section showing,
 * as two clearly separated lists:
 *   - IN LAUNCHER : players active through the launcher (playing / launcher open)
 *   - ON WEBSITE  : players active on the site
 * plus who is offline and everyone's coins. Data: GET /admin/presence.
 */
(function () {
  "use strict";

  var PANEL_ID = "flPresencePanel";

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken(); } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) { return ""; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function dur(secs) {
    if (secs == null) return "—";
    var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    if (h) return h + "h " + m + "m";
    if (m) return m + "m " + s + "s";
    return s + "s";
  }

  function ago(iso) {
    if (!iso) return "never";
    var secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 60) return secs + "s ago";
    if (secs < 3600) return Math.floor(secs / 60) + "m ago";
    if (secs < 86400) return Math.floor(secs / 3600) + "h ago";
    return Math.floor(secs / 86400) + "d ago";
  }

  var CSS = [
    ".flp-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:16px 18px}",
    ".flp-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px}",
    ".flp-kpi .flp-card{text-align:center;padding:14px 10px}",
    ".flp-kpi b{display:block;font-family:'Outfit',sans-serif;font-size:24px;color:#fff;line-height:1.2}",
    ".flp-kpi span{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary)}",
    ".flp-title{display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#fff;margin:0 0 10px}",
    ".flp-table{width:100%;border-collapse:collapse;font-size:13px}",
    ".flp-table th,.flp-table td{border-bottom:1px solid var(--border-color);padding:8px 10px;text-align:left;color:#fff}",
    ".flp-table th{color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.5px}",
    ".flp-role{font-size:10px;color:var(--text-secondary)}",
    ".flp-muted{color:var(--text-secondary)}",
    ".flp-scroll{max-height:260px;overflow:auto}",
    ".flp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}",
    ".flp-lc{border-color:rgba(255,0,72,.35)}",
    ".flp-wc{border-color:rgba(0,255,136,.3)}",
    "@media (max-width:860px){.flp-grid{grid-template-columns:1fr}}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flpStyles")) return;
    var st = document.createElement("style");
    st.id = "flpStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function kpi(v, label) {
    return '<div class="flp-card"><b>' + v + "</b><span>" + label + "</span></div>";
  }

  function rows(list, mode) {
    if (!list.length) return '<tr><td colspan="3" class="flp-muted">Nobody right now.</td></tr>';
    return list.map(function (u) {
      var when = mode === "online" ? dur(u.onlineForSeconds) : ago(u.lastSeen);
      return "<tr><td>" + esc(u.displayName) + '<div class="flp-role">' + esc(u.role) + "</div></td>" +
        "<td>" + esc(when) + '</td><td><i class="fas fa-coins" style="color:gold"></i> ' + (u.coins || 0) + "</td></tr>";
    }).join("");
  }

  function card(icon, color, title, count, list, mode, whenLabel, cls) {
    return '<div class="flp-card ' + (cls || "") + '">' +
      '<h4 class="flp-title"><i class="fas ' + icon + '" style="color:' + color + '"></i> ' + title + " (" + count + ")</h4>" +
      '<div class="flp-scroll"><table class="flp-table"><thead><tr><th>Player</th><th>' + whenLabel +
      "</th><th>Coins</th></tr></thead><tbody>" + rows(list, mode) + "</tbody></table></div></div>";
  }

  function render(d) {
    var el = document.getElementById(PANEL_ID);
    if (!el) return;

    var inLauncher = d.online.filter(function (u) { return u.source === "launcher"; });
    var onWeb = d.online.filter(function (u) { return u.source !== "launcher"; });

    el.innerHTML =
      '<h3 class="flp-title" style="font-size:17px;margin-bottom:12px">' +
        '<i class="fas fa-tower-broadcast" style="color:var(--primary-red)"></i> Who is online right now</h3>' +
      '<div class="flp-kpi">' +
        kpi(d.onlineCount, "Online now") +
        kpi(inLauncher.length, "In launcher") +
        kpi(onWeb.length, "On website") +
        kpi(d.offlineCount, "Offline") +
        kpi(d.totalUsers, "Total users") +
      "</div>" +
      '<div class="flp-grid">' +
        card("fa-gamepad", "#ff6b8b", "In Launcher", inLauncher.length, inLauncher, "online", "Playing for", "flp-lc") +
        card("fa-globe", "#00ff88", "On Website", onWeb.length, onWeb, "online", "Online for", "flp-wc") +
      "</div>" +
      '<div class="flp-card" style="margin-top:14px">' +
        '<h4 class="flp-title"><i class="fas fa-moon" style="color:var(--text-secondary)"></i> Offline (' + d.offlineCount + ")</h4>" +
        '<div class="flp-scroll"><table class="flp-table"><thead><tr><th>Player</th><th>Last seen</th><th>Coins</th></tr></thead><tbody>' +
        rows(d.offline, "offline") + "</tbody></table></div></div>" +
      '<p class="flp-muted" style="font-size:11px;margin-top:10px">Website = seen in the last ' +
        Math.round(d.windowSeconds / 60) + " min &middot; Launcher = seen in the last 30 min. Refreshes every 20s.</p>";
  }

  function load() {
    var t = token();
    if (!t) return;
    fetch("/admin/presence", { headers: { Authorization: "Bearer " + t } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) render(d); })
      .catch(function () {});
  }

  function place() {
    var sec = document.getElementById("admin-dashboard");
    if (!sec) return;
    if (!document.getElementById(PANEL_ID)) {
      injectStyles();
      var wrap = document.createElement("div");
      wrap.id = PANEL_ID;
      wrap.style.margin = "0 0 18px";
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
