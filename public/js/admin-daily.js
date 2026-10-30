/* CraftynMC — Daily audience panel (admin)
 * ------------------------------------------------------------------
 * Adds a card to the admin area showing, day by day:
 *   - how many people came online
 *   - how many of them were RETURNING (seen on an earlier day)
 *   - who spent the most time that day
 * Read-only: it only GETs /admin/analytics/daily.
 */
(function () {
  "use strict";
  if (window.__flAdminDaily) return;
  window.__flAdminDaily = true;

  var HOST = "flAdminDaily";

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken() || ""; } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) {}
    return "";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function hms(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h) return h + "h " + m + "m";
    if (m) return m + "m";
    return (sec % 60) + "s";
  }

  var CSS = [
    "#" + HOST + "{margin-top:22px}",
    ".fld-card{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.13);border-radius:18px;",
      "padding:20px;-webkit-backdrop-filter:blur(20px) saturate(1.5);backdrop-filter:blur(20px) saturate(1.5);",
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 22px 46px -26px rgba(0,0,0,.9)}",
    ".fld-h{display:flex;align-items:center;gap:10px;margin-bottom:4px}",
    ".fld-h h3{margin:0;font-family:'Bricolage Grotesque','Outfit',sans-serif;font-size:16px;color:#fff}",
    ".fld-sub{margin:0 0 16px;font-size:12px;color:#98a0b4;line-height:1.6}",
    ".fld-today{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:18px}",
    "@media (max-width:760px){.fld-today{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    ".fld-tile{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:13px}",
    ".fld-tile .k{font:600 9.5px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#6a7182}",
    ".fld-tile .v{font-family:'Bricolage Grotesque','Outfit',sans-serif;font-size:24px;font-weight:700;",
      "letter-spacing:-1px;margin-top:8px;color:#fff;font-variant-numeric:tabular-nums}",
    ".fld-tile .d{font-size:11px;color:#98a0b4;margin-top:4px}",
    ".fld-tile.gold .v{color:#ffd44a}",
    ".fld-tile.mint .v{color:#31f0b2}",
    ".fld-wrap{overflow-x:auto}",
    ".fld-table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px}",
    ".fld-table th{text-align:left;font:600 9.5px/1 ui-monospace,monospace;letter-spacing:.13em;",
      "text-transform:uppercase;color:#6a7182;padding:0 10px 10px;border-bottom:1px solid rgba(255,255,255,.1)}",
    ".fld-table td{padding:10px;border-bottom:1px solid rgba(255,255,255,.05);color:#cfd2dc}",
    ".fld-table tr:last-child td{border-bottom:none}",
    ".fld-table td.num{font-variant-numeric:tabular-nums;font-weight:600;color:#fff}",
    ".fld-table td.gold{color:#ffd44a;font-weight:600}",
    ".fld-pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:700;",
      "background:rgba(49,240,178,.12);color:#31f0b2;border:1px solid rgba(49,240,178,.3)}",
    ".fld-empty{font-size:12.5px;color:#6a7182;padding:18px 0}"
  ].join("");

  function style() {
    if (document.getElementById("fldCss")) return;
    var st = document.createElement("style");
    st.id = "fldCss";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function target() {
    var ids = ["admin-analytics", "analytics", "admin", "dashboard"];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) return el;
    }
    return null;
  }

  function render(data) {
    var host = document.getElementById(HOST);
    if (!host) return;
    var rows = (data && data.rows) || [];
    var t = (data && data.totals) || {};

    var today = rows[0] || {};
    var tiles =
      '<div class="fld-tile"><div class="k">Online today</div><div class="v">' + (today.online || 0) + "</div>" +
        '<div class="d">' + (today.fresh || 0) + " new · " + (today.returning || 0) + " returning</div></div>" +
      '<div class="fld-tile mint"><div class="k">Repeat audience</div><div class="v">' + (today.repeatRate || 0) + "%</div>" +
        '<div class="d">came back from an earlier day</div></div>' +
      '<div class="fld-tile gold"><div class="k">Most time today</div><div class="v" style="font-size:17px">' +
        (today.topUser ? esc(today.topUser.username) : "—") + "</div>" +
        '<div class="d">' + (today.topUser ? hms(today.topUser.seconds) : "no data yet") + "</div></div>" +
      '<div class="fld-tile"><div class="k">Unique players</div><div class="v">' + (t.uniqueEver || 0) + "</div>" +
        '<div class="d">across the last ' + (data.days || 0) + " days</div></div>";

    var body = rows.length
      ? rows.map(function (r) {
          return "<tr>" +
            "<td>" + esc(r.date) + "</td>" +
            '<td class="num">' + r.online + "</td>" +
            '<td class="num">' + r.returning + (r.online ? ' <span class="fld-pill">' + r.repeatRate + "%</span>" : "") + "</td>" +
            '<td class="num">' + r.fresh + "</td>" +
            '<td class="gold">' + (r.topUser ? esc(r.topUser.username) + " · " + hms(r.topUser.seconds) : "—") + "</td>" +
            '<td class="num">' + hms(r.avgSeconds) + "</td>" +
            "</tr>";
        }).join("")
      : '<tr><td colspan="6" class="fld-empty">No days recorded yet — this fills up as players come online.</td></tr>';

    host.innerHTML =
      '<div class="fld-card">' +
        '<div class="fld-h"><h3>Daily audience</h3></div>' +
        '<p class="fld-sub">How many people came online each day, how many of them were returning, ' +
          "and who spent the most time.</p>" +
        '<div class="fld-today">' + tiles + "</div>" +
        '<div class="fld-wrap"><table class="fld-table"><thead><tr>' +
          "<th>Day</th><th>Online</th><th>Returning</th><th>New</th><th>Most time</th><th>Avg time</th>" +
        "</tr></thead><tbody>" + body + "</tbody></table></div>" +
      "</div>";
  }

  var loading = false, loadedAt = 0;
  var lastData = null;          // keep the last payload so we can redraw instantly
  var secRef = null;            // remember which section we belong to

  function ensureHost() {
    var sec = (secRef && document.body.contains(secRef)) ? secRef : target();
    if (!sec) return null;
    secRef = sec;

    var host = document.getElementById(HOST);
    if (!host || !document.body.contains(host)) {
      host = document.createElement("div");
      host.id = HOST;
      sec.appendChild(host);
    } else if (host.parentNode !== sec) {
      // the admin panel re-rendered its own container and dropped us — re-attach
      sec.appendChild(host);
    }
    return host;
  }

  function load() {
    style();
    var sec = (secRef && document.body.contains(secRef)) ? secRef : target();
    if (!sec || !sec.classList.contains("active")) return;

    var host = ensureHost();
    if (!host) return;

    // the other analytics script wipes its container — redraw from what we already have
    if (lastData && (!host.firstChild || host.offsetHeight === 0)) {
      render(lastData);
    }

    if (loading || Date.now() - loadedAt < 60000) return;
    var t = token();
    if (!t) return;

    loading = true;
    fetch("/admin/analytics/daily?days=14", { headers: { Authorization: "Bearer " + t } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d) { lastData = d; render(d); loadedAt = Date.now(); }
      })
      .catch(function () {})
      .then(function () { loading = false; });
  }

  function tick() { load(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 3000);
})();
