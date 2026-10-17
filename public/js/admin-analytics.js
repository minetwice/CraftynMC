/* CraftynMC / FearLauncher — admin Analytics section
 * ------------------------------------------------------------------
 * Adds an "Analytics" item to the admin sidebar and a matching section:
 *   - downloads / views per project (who downloaded what, how often)
 *   - today's logins + the players who logged in today
 *   - the last 14 days of logins / unique online / new users
 *   - totals (all users, users who ever logged in, downloads, views)
 * Data comes from GET /admin/analytics.
 */
(function () {
  "use strict";

  var SEC_ID = "admin-analytics";
  var NAV_FLAG = "flAnalyticsNav";

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken(); } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) { return ""; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CSS = [
    ".fla-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:14px 0}",
    ".fla-kpi .fla-card{text-align:center;padding:14px 10px}",
    ".fla-kpi b{display:block;font-family:'Outfit',sans-serif;font-size:24px;color:#fff;line-height:1.2}",
    ".fla-kpi span{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary)}",
    ".fla-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:16px 18px;margin-bottom:14px}",
    ".fla-title{display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#fff;margin:0 0 10px}",
    ".fla-table{width:100%;border-collapse:collapse;font-size:13px}",
    ".fla-table th,.fla-table td{border-bottom:1px solid var(--border-color);padding:8px 10px;text-align:left;color:#fff}",
    ".fla-table th{color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.5px}",
    ".fla-table td.num{text-align:right;font-variant-numeric:tabular-nums}",
    ".fla-muted{color:var(--text-secondary)}",
    ".fla-chips{display:flex;flex-wrap:wrap;gap:6px}",
    ".fla-chip{background:rgba(0,255,136,.12);color:#00ff88;border-radius:20px;padding:3px 10px;font-size:12px}",
    ".fla-scroll{max-height:340px;overflow:auto}",
    ".fla-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}",
    "@media (max-width:900px){.fla-grid{grid-template-columns:1fr}}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flaStyles")) return;
    var st = document.createElement("style");
    st.id = "flaStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function kpi(v, label) {
    return '<div class="fla-card"><b>' + v + "</b><span>" + label + "</span></div>";
  }

  function render(d) {
    var el = document.getElementById(SEC_ID);
    if (!el) return;

    var projRows = d.projects.length
      ? d.projects.map(function (p) {
          return "<tr><td>" + esc(p.name) + '<div class="fla-muted" style="font-size:11px">' + esc(p.category) + "</div></td>" +
            '<td class="num">' + p.downloads + '</td><td class="num">' + p.views + "</td></tr>";
        }).join("")
      : '<tr><td colspan="3" class="fla-muted">No projects yet.</td></tr>';

    var dayRows = d.days.length
      ? d.days.map(function (x) {
          return "<tr><td>" + esc(x.date) + '</td><td class="num">' + x.logins + '</td><td class="num">' + x.online +
            '</td><td class="num">' + x.newUsers + "</td></tr>";
        }).join("")
      : '<tr><td colspan="4" class="fla-muted">No activity recorded yet.</td></tr>';

    var players = d.todayPlayers.length
      ? '<div class="fla-chips">' + d.todayPlayers.map(function (n) { return '<span class="fla-chip">' + esc(n) + "</span>"; }).join("") + "</div>"
      : '<span class="fla-muted">Nobody logged in yet today.</span>';

    el.innerHTML =
      '<h2 style="font-family:\'Outfit\',sans-serif;color:#fff;margin:0 0 4px">Analytics</h2>' +
      '<p class="fla-muted" style="margin:0 0 6px;font-size:13px">Downloads, views, logins and online activity.</p>' +
      '<div class="fla-kpi">' +
        kpi(d.totals.totalUsers, "Total users") +
        kpi(d.totals.loggedInUsers, "Ever logged in") +
        kpi(d.totals.projects, "Projects") +
        kpi(d.totals.totalDownloads, "Total downloads") +
        kpi(d.totals.totalViews, "Total views") +
      "</div>" +
      '<div class="fla-card"><h4 class="fla-title"><i class="fas fa-calendar-day" style="color:var(--primary-red)"></i> Today — ' + esc(d.today.date) + "</h4>" +
        '<div class="fla-kpi" style="margin:0 0 10px">' +
          kpi(d.today.logins, "Logged in today") +
          kpi(d.today.online, "Online today") +
          kpi(d.today.newUsers, "New users") +
        "</div>" +
        '<div class="fla-title" style="font-size:13px"><i class="fas fa-user-check"></i> Players who logged in today</div>' +
        players +
      "</div>" +
      '<div class="fla-grid">' +
        '<div class="fla-card"><h4 class="fla-title"><i class="fas fa-download" style="color:#00ff88"></i> Downloads per project</h4>' +
          '<div class="fla-scroll"><table class="fla-table"><thead><tr><th>Project</th><th class="num">Downloads</th><th class="num">Views</th></tr></thead><tbody>' +
          projRows + "</tbody></table></div></div>" +
        '<div class="fla-card"><h4 class="fla-title"><i class="fas fa-chart-column" style="color:#00ff88"></i> Last 14 days</h4>' +
          '<div class="fla-scroll"><table class="fla-table"><thead><tr><th>Date</th><th class="num">Logins</th><th class="num">Online</th><th class="num">New</th></tr></thead><tbody>' +
          dayRows + "</tbody></table></div></div>" +
      "</div>";
  }

  function load() {
    var t = token();
    if (!t) return;
    fetch("/admin/analytics", { headers: { Authorization: "Bearer " + t } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) render(d); })
      .catch(function () {});
  }

  function place() {
    var main = document.querySelector("main.main-content") || document.querySelector("main");
    var nav = document.getElementById("adminNav");
    if (!main || !nav) return;

    if (!document.getElementById(SEC_ID)) {
      var sec = document.createElement("div");
      sec.id = SEC_ID;
      sec.className = "section";
      main.appendChild(sec);
    }

    if (!document.getElementById(NAV_FLAG)) {
      injectStyles();
      var a = document.createElement("a");
      a.className = "nav-item";
      a.id = NAV_FLAG;
      a.setAttribute("data-section", SEC_ID);
      a.innerHTML = '<i class="fas fa-chart-pie"></i><span>Analytics</span>';
      a.addEventListener("click", function () {
        if (typeof window.showSection === "function") window.showSection(SEC_ID);
        document.querySelectorAll(".nav-item").forEach(function (i) { i.classList.remove("active"); });
        a.classList.add("active");
        var sb = document.getElementById("sidebar");
        if (sb) sb.classList.remove("mobile-open");
        load();
      });
      nav.appendChild(a);
    }

    if (document.getElementById(SEC_ID).classList.contains("active")) load();
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
