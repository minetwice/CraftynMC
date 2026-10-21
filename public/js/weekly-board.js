/* CraftynMC — Weekly prize boards
 * ------------------------------------------------------------------
 * Two SEPARATE boards at the top of the Leaderboards page:
 *   1. Most time online — this week
 *   2. Most coins earned — this week
 * Each pays 2000 / 1000 / 500 coins to its top three at the end of the week.
 * Staff (admin / owner / moderator) are excluded by the server.
 */
(function () {
  "use strict";

  var HOST = "flWeekly";
  var data = null;
  var ticker = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h >= 24) return Math.floor(h / 24) + "d " + (h % 24) + "h";
    if (h) return h + "h " + m + "m";
    return m + "m";
  }

  function valueOf(b, v) {
    return b.unit === "seconds" ? fmtTime(v) : (v || 0).toLocaleString("en-IN") + " coins";
  }

  var CSS = [
    "#" + HOST + "{margin-bottom:26px}",
    ".flw-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 4px}",
    ".flw-head h3{margin:0;font-family:'Outfit',sans-serif;font-size:19px;color:#fff;display:flex;align-items:center;gap:9px}",
    ".flw-timer{margin-left:auto;font-size:12.5px;color:var(--text-secondary);background:rgba(255,255,255,.05);",
      "border:1px solid var(--border-color);border-radius:999px;padding:5px 12px}",
    ".flw-timer b{color:#fff}",
    ".flw-note{font-size:12.5px;color:var(--text-secondary);margin:0 0 14px}",
    ".flw-boards{display:grid;grid-template-columns:1fr 1fr;gap:16px}",
    "@media (max-width:900px){.flw-boards{grid-template-columns:1fr}}",
    ".flw-board{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:16px;",
      "display:flex;flex-direction:column;min-width:0}",
    ".flw-board__top{display:flex;align-items:center;gap:10px;margin-bottom:4px}",
    ".flw-board__ico{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;",
      "font-size:16px;flex:0 0 auto}",
    ".flw-board__t{font-family:'Outfit',sans-serif;font-size:15.5px;font-weight:700;color:#fff;margin:0}",
    ".flw-board__s{font-size:12px;color:var(--text-secondary);margin:0}",
    ".flw-prizes{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 10px}",
    ".flw-prize{font-size:11.5px;font-weight:700;border-radius:999px;padding:4px 11px;border:1px solid}",
    ".flw-prize.g{color:gold;border-color:rgba(255,215,0,.45);background:rgba(255,215,0,.12)}",
    ".flw-prize.s{color:#d8dde6;border-color:rgba(216,221,230,.35);background:rgba(216,221,230,.09)}",
    ".flw-prize.b{color:#e0a06a;border-color:rgba(224,160,106,.4);background:rgba(224,160,106,.12)}",
    ".flw-list{display:flex;flex-direction:column;gap:5px;margin-top:2px}",
    ".flw-row{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:11px;cursor:pointer;",
      "border:1px solid transparent;transition:background .15s ease,border-color .15s ease}",
    ".flw-row:hover{background:rgba(255,255,255,.05);border-color:var(--border-color)}",
    ".flw-row.p1{background:linear-gradient(90deg,rgba(255,215,0,.14),transparent);border-color:rgba(255,215,0,.3)}",
    ".flw-row.p2{background:linear-gradient(90deg,rgba(216,221,230,.10),transparent)}",
    ".flw-row.p3{background:linear-gradient(90deg,rgba(224,160,106,.12),transparent)}",
    ".flw-rank{width:26px;text-align:center;font-weight:800;font-size:13px;color:var(--text-secondary);flex:0 0 auto}",
    ".flw-row.p1 .flw-rank{color:gold}.flw-row.p2 .flw-rank{color:#d8dde6}.flw-row.p3 .flw-rank{color:#e0a06a}",
    ".flw-name{font-size:13.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
    ".flw-val{margin-left:auto;font-size:12.5px;color:var(--text-secondary);white-space:nowrap;flex:0 0 auto}",
    ".flw-empty{padding:26px 10px;text-align:center;color:var(--text-secondary);font-size:13px}",
    ".flw-last{margin-top:12px;padding-top:11px;border-top:1px solid var(--border-color);font-size:12px;color:var(--text-secondary)}",
    ".flw-last b{color:#fff}",
    ".flw-last .flw-chip{display:inline-block;margin:4px 5px 0 0;padding:3px 9px;border-radius:999px;",
      "background:rgba(255,255,255,.06);border:1px solid var(--border-color);color:#fff}"
  ].join("");

  function styles() {
    if (document.getElementById("flWStyles")) return;
    var st = document.createElement("style");
    st.id = "flWStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function boardHTML(b, icon, tint) {
    var top = b.top || [];
    var rows = top.length
      ? top.map(function (u, i) {
          var place = i + 1;
          return '<div class="flw-row' + (place <= 3 ? " p" + place : "") + '" data-user="' + esc(u.username) + '">' +
            '<span class="flw-rank">' + (place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : "#" + place) + "</span>" +
            '<span class="flw-name">' + esc(u.displayName || u.username) + "</span>" +
            '<span class="flw-val">' + esc(valueOf(b, u.value != null ? u.value : u.coins)) + "</span>" +
          "</div>";
        }).join("")
      : '<div class="flw-empty">Nobody yet this week — be the first!</div>';

    var last = (b.lastWinners || []).slice(0, 3);
    var lastHTML = last.length
      ? '<div class="flw-last">Last week\'s winners · ' + esc(b.lastAwardWeek || "") + "<br>" +
          last.map(function (w) {
            return '<span class="flw-chip">' + (w.place === 1 ? "🥇" : w.place === 2 ? "🥈" : "🥉") + " " +
              esc(w.username) + " · +" + (w.prize || 0).toLocaleString("en-IN") + "</span>";
          }).join("") + "</div>"
      : "";

    return '<div class="flw-board">' +
        '<div class="flw-board__top">' +
          '<div class="flw-board__ico" style="background:' + tint + '">' + icon + "</div>" +
          "<div><p class=\"flw-board__t\">" + esc(b.title) + "</p>" +
          '<p class="flw-board__s">Resets every Monday · prizes paid automatically</p></div>' +
        "</div>" +
        '<div class="flw-prizes">' +
          '<span class="flw-prize g">🥇 2,000 coins</span>' +
          '<span class="flw-prize s">🥈 1,000 coins</span>' +
          '<span class="flw-prize b">🥉 500 coins</span>' +
        "</div>" +
        '<div class="flw-list">' + rows + "</div>" +
        lastHTML +
      "</div>";
  }

  function render() {
    var el = document.getElementById(HOST);
    if (!el || !data) return;
    var boards = data.boards || [];
    el.innerHTML =
      '<div class="flw-head"><h3><i class="fas fa-trophy" style="color:gold"></i> Weekly prize boards</h3>' +
        '<span class="flw-timer" id="flwTimer">—</span></div>' +
      '<p class="flw-note">Two separate boards. Top three of <b style="color:#fff">each</b> board get coins at the end of the week — ' +
        'and a notification telling them where they placed.</p>' +
      '<div class="flw-boards">' +
        boards.map(function (b) {
          return b.board === "online"
            ? boardHTML(b, '<i class="fas fa-clock" style="color:#00ff88"></i>', "rgba(0,255,136,.12)")
            : boardHTML(b, '<i class="fas fa-coins" style="color:gold"></i>', "rgba(255,215,0,.12)");
        }).join("") +
      "</div>";

    Array.prototype.forEach.call(el.querySelectorAll(".flw-row"), function (r) {
      r.addEventListener("click", function () {
        var u = r.getAttribute("data-user");
        if (u && window.FearLauncherPlayerLookup) window.FearLauncherPlayerLookup.open(u);
      });
    });

    startTimer();
  }

  function startTimer() {
    if (ticker) clearInterval(ticker);
    function paint() {
      var t = document.getElementById("flwTimer");
      if (!t) return;
      var now = new Date();
      var day = (now.getUTCDay() + 6) % 7;                 // Monday = 0
      var next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (7 - day), 0, 0, 0));
      var ms = next - now;
      if (ms < 0) ms = 0;
      var d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
      t.innerHTML = "Ends in <b>" + d + "d " + h + "h " + m + "m</b>";
    }
    paint();
    ticker = setInterval(paint, 60000);
  }

  function load() {
    styles();
    var sec = document.getElementById("leaderboard");
    if (!sec || !sec.classList.contains("active")) return;
    if (document.getElementById(HOST)) return;
    var anchor = sec.firstElementChild;
    var host = document.createElement("div");
    host.id = HOST;
    host.innerHTML = '<div class="flw-empty">Loading the weekly boards…</div>';
    if (anchor && anchor.nextSibling) sec.insertBefore(host, anchor.nextSibling);
    else sec.appendChild(host);   // after the page heading, above the all-time boards

    fetch("/api/leaderboard")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) { data = d; render(); } })
      .catch(function () {});
  }

  function tick() { load(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 2500);
})();
