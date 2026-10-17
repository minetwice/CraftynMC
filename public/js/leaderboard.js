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
    ".flb-prize{color:gold;font-weight:700}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flbStyles")) return;
    var st = document.createElement("style");
    st.id = "flbStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
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
