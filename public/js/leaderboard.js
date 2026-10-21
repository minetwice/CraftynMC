/* CraftynMC / FearLauncher — Weekly Leaderboard
 * ------------------------------------------------------------------
 * A sidebar section showing this week's top coin earners and last week's
 * prize winners. Coins are earned by watching ads, so the board rewards
 * the most active players. Data: GET /api/leaderboard
 */
(function () {
  "use strict";

  var SEC_ID = "leaderboard";
  var NAV_ID = "flBoardNav";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function me() {
    try { return (JSON.parse(localStorage.getItem("userInfo") || "{}").username || "").toLowerCase(); } catch (e) { return ""; }
  }

  var CSS = [
    ".flb-wrap{max-width:760px}",
    ".flb-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:16px 18px;margin-bottom:14px}",
    ".flb-title{display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#fff;margin:0 0 10px}",
    ".flb-table{width:100%;border-collapse:collapse;font-size:13px}",
    ".flb-table th,.flb-table td{border-bottom:1px solid var(--border-color);padding:9px 10px;text-align:left;color:#fff}",
    ".flb-table th{color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.5px}",
    ".flb-table td.num{text-align:right;font-variant-numeric:tabular-nums}",
    ".flb-rank{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.06);font-weight:700;font-size:12px}",
    ".flb-r1{background:linear-gradient(135deg,#ffd700,#b8860b);color:#231a00}",
    ".flb-r2{background:linear-gradient(135deg,#d8d8d8,#8f8f8f);color:#1c1c1c}",
    ".flb-r3{background:linear-gradient(135deg,#cd7f32,#8b5a2b);color:#fff}",
    ".flb-me{background:rgba(255,0,72,.12)}",
    ".flb-muted{color:var(--text-secondary)}",
    ".flb-crown{color:gold}",
    ".flb-prize{color:gold;font-weight:700}",
    ".flb-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}",
    ".flb-tab{padding:8px 12px;border-radius:20px;border:1px solid var(--border-color);background:rgba(255,255,255,.04);color:var(--text-secondary);font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer}",
    ".flb-tab.on{background:rgba(255,0,72,.14);border-color:var(--primary-red);color:#fff}",
    ".flb-row{cursor:pointer}",
    ".flb-row:hover{background:rgba(255,255,255,.04)}",
    ".flb-pcell{display:flex;align-items:center;gap:9px}",
    ".flb-head{border-radius:7px;image-rendering:pixelated;flex:0 0 auto}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flbStyles")) return;
    var st = document.createElement("style");
    st.id = "flbStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- separate boards (coins / online time / projects / downloads) ---------- */
  var BOARDS = [
    { key: "coins", label: "Most coins", icon: "fa-coins", color: "gold", fmt: function (v) { return (v || 0) + " coins"; } },
    { key: "online", label: "Most online", icon: "fa-clock", color: "#00ff88", fmt: function (v) { return fmtTime(v); } },
    { key: "projects", label: "Most projects", icon: "fa-cube", color: "#7cc4ff", fmt: function (v) { return (v || 0) + " projects"; } },
    { key: "downloads", label: "Most downloads", icon: "fa-download", color: "#ff8fb0", fmt: function (v) { return (v || 0) + " downloads"; } }
  ];
  var activeBoard = "coins";
  var boardData = null;

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + "h " + m + "m";
    if (m > 0) return m + "m";
    return sec + "s";
  }

  function renderBoards() {
    var el = document.getElementById("flbBoards");
    if (!el) return;
    var who = me();

    var tabs = BOARDS.map(function (b) {
      return '<button type="button" class="flb-tab' + (b.key === activeBoard ? " on" : "") + '" data-b="' + b.key + '">' +
        '<i class="fas ' + b.icon + '" style="color:' + b.color + '"></i> ' + b.label + "</button>";
    }).join("");

    var conf = BOARDS.filter(function (b) { return b.key === activeBoard; })[0] || BOARDS[0];
    var list = (boardData && boardData[activeBoard]) || [];

    var rows = list.length
      ? list.map(function (u, i) {
          var rk = '<span class="flb-rank' + (i === 0 ? " flb-r1" : i === 1 ? " flb-r2" : i === 2 ? " flb-r3" : "") + '">' + (i + 1) + "</span>";
          var isMe = who && String(u.username).toLowerCase() === who;
          return '<tr class="flb-row' + (isMe ? " flb-me" : "") + '" data-u="' + esc(u.username) + '">' +
            "<td>" + rk + "</td>" +
            '<td class="flb-pcell"><canvas class="flb-head" width="28" height="28"></canvas><span>' +
              esc(u.displayName) + (u.premium ? ' <i class="fas fa-crown flb-crown"></i>' : "") +
              (isMe ? ' <span class="flb-muted">(you)</span>' : "") + "</span></td>" +
            '<td class="num">' + conf.fmt(u.value) + "</td></tr>";
        }).join("")
      : '<tr><td colspan="3" class="flb-muted">Nobody here yet.</td></tr>';

    el.innerHTML =
      '<div class="flb-card">' +
        '<h4 class="flb-title"><i class="fas fa-medal" style="color:var(--primary-red)"></i> Leaderboards</h4>' +
        '<div class="flb-tabs">' + tabs + "</div>" +
        '<table class="flb-table"><thead><tr><th>#</th><th>Player</th><th class="num">' + conf.label +
          "</th></tr></thead><tbody>" + rows + "</tbody></table>" +
        '<p class="flb-muted" style="margin:10px 0 0;font-size:12px">Tap a player to open their account and 3D character.</p>' +
      "</div>";

    Array.prototype.forEach.call(el.querySelectorAll(".flb-row"), function (tr) {
      var uname = tr.getAttribute("data-u");
      var u = list.filter(function (x) { return x.username === uname; })[0];
      var c = tr.querySelector("canvas");
      if (c && u && window.FearLauncherHead) window.FearLauncherHead.draw(c, u.skinUrl, 28);
      tr.addEventListener("click", function () {
        if (window.FearLauncherPlayerLookup) window.FearLauncherPlayerLookup.open(uname);
      });
    });
    Array.prototype.forEach.call(el.querySelectorAll(".flb-tab"), function (b) {
      b.addEventListener("click", function () { activeBoard = b.getAttribute("data-b"); renderBoards(); });
    });
  }

  function refreshBoards() {
    fetch("/api/leaderboards")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) { boardData = d.boards || {}; renderBoards(); } })
      .catch(function () {});
  }

  function render(d) {
    var el = document.getElementById(SEC_ID);
    if (!el) return;
    var who = me();

    var rows = d.top.length
      ? d.top.map(function (u, i) {
          var rk = '<span class="flb-rank' + (i === 0 ? " flb-r1" : i === 1 ? " flb-r2" : i === 2 ? " flb-r3" : "") + '">' + (i + 1) + "</span>";
          var isMe = who && String(u.username).toLowerCase() === who;
          return '<tr class="' + (isMe ? "flb-me" : "") + '"><td>' + rk + "</td><td>" +
            esc(u.displayName) + (u.premium ? ' <i class="fas fa-crown flb-crown"></i>' : "") +
            (isMe ? ' <span class="flb-muted">(you)</span>' : "") +
            '</td><td class="num"><i class="fas fa-coins" style="color:gold"></i> ' + (u.coins || 0) + "</td></tr>";
        }).join("")
      : '<tr><td colspan="3" class="flb-muted">No coins earned this week yet — watch some ads to get on the board!</td></tr>';

    var winners = (d.lastWinners && d.lastWinners.length)
      ? d.lastWinners.map(function (w, i) {
          return '<tr><td><span class="flb-rank' + (i === 0 ? " flb-r1" : i === 1 ? " flb-r2" : " flb-r3") + '">' + (i + 1) + "</span></td><td>" +
            esc(w.username) + '</td><td class="num flb-prize">+' + (w.prize || 0) + " coins</td></tr>";
        }).join("")
      : '<tr><td colspan="3" class="flb-muted">No winners yet — the first prizes go out at the end of this week.</td></tr>';

    el.innerHTML =
      '<div class="flb-wrap">' +
        '<h2 style="font-family:\'Outfit\',sans-serif;color:#fff;margin:0 0 4px">Weekly Leaderboard</h2>' +
        '<p class="flb-muted" style="margin:0 0 14px;font-size:13px">Coins earned in the last 7 days. Top 3 each week win <b class="flb-prize">' +
          (d.prizes || []).join(" / ") + "</b> bonus coins.</p>" +
        '<div id="flbBoards"></div>' +
        '<div class="flb-card"><h4 class="flb-title"><i class="fas fa-ranking-star" style="color:#00ff88"></i> This week</h4>' +
          '<table class="flb-table"><thead><tr><th>#</th><th>Player</th><th class="num">Coins earned</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
        '<div class="flb-card"><h4 class="flb-title"><i class="fas fa-trophy" style="color:gold"></i> Last week\'s winners</h4>' +
          '<table class="flb-table"><thead><tr><th>#</th><th>Player</th><th class="num">Prize</th></tr></thead><tbody>' + winners + "</tbody></table></div>" +
      "</div>";
  }

  function refresh() {
    fetch("/api/leaderboard")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) render(d); })
      .catch(function () {});
    refreshBoards();
  }

  function place() {
    var main = document.querySelector("main.main-content") || document.querySelector("main");
    var nav = document.querySelector(".nav-section");
    if (!main || !nav) return;

    if (!document.getElementById(SEC_ID)) {
      var sec = document.createElement("div");
      sec.id = SEC_ID;
      sec.className = "section";
      main.appendChild(sec);
    }
    if (!document.getElementById(NAV_ID)) {
      injectStyles();
      var a = document.createElement("a");
      a.className = "nav-item";
      a.id = NAV_ID;
      a.setAttribute("data-section", SEC_ID);
      a.innerHTML = '<i class="fas fa-ranking-star"></i><span>Leaderboard</span>';
      a.addEventListener("click", function () {
        if (typeof window.showSection === "function") window.showSection(SEC_ID);
        document.querySelectorAll(".nav-item").forEach(function (i) { i.classList.remove("active"); });
        a.classList.add("active");
        var sb = document.getElementById("sidebar");
        if (sb) sb.classList.remove("mobile-open");
        refresh();
      });
      nav.appendChild(a);
    }

    var sec = document.getElementById(SEC_ID);
    if (sec && sec.classList.contains("active") && !el_hasTable(sec)) refresh();
  }

  function el_hasTable(sec) { return !!sec.querySelector("table"); }

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
