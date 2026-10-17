/* CraftynMC / FearLauncher — Player Lookup
 * ------------------------------------------------------------------
 * Search any username and see that player on a live 3D character body
 * (skin + cape, walking animation, drag to rotate) with their public
 * customisation: display name, bio, description, role, coins, cosmetics.
 * Data: GET /api/player/:username
 */
(function () {
  "use strict";

  var SEC_ID = "player-lookup";
  var NAV_ID = "flLookupNav";
  var viewer = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CSS = [
    ".flp-wrap{max-width:1000px}",
    ".flp-search{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}",
    ".flp-search input{flex:1;min-width:200px;padding:14px 16px;border-radius:14px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-family:inherit;font-size:14px}",
    ".flp-search input:focus{outline:none;border-color:var(--primary-red)}",
    ".flp-search button{padding:14px 22px;border:none;border-radius:14px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;cursor:pointer;font-family:inherit}",
    ".flp-msg{font-size:13px;min-height:18px;margin-bottom:12px}",
    ".flp-err{color:#ff6b8b}",
    ".flp-grid{display:grid;grid-template-columns:minmax(280px,340px) 1fr;gap:20px;align-items:start}",
    "@media (max-width:820px){.flp-grid{grid-template-columns:1fr}}",
    ".flp-stage{background:radial-gradient(circle at 50% 20%,rgba(255,0,72,.16),rgba(8,10,16,.9));border:1px solid var(--border-hover);border-radius:20px;padding:14px;display:flex;align-items:center;justify-content:center;min-height:480px}",
    ".flp-stage canvas{border-radius:14px;cursor:grab}",
    ".flp-stage canvas:active{cursor:grabbing}",
    ".flp-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:20px;padding:22px}",
    ".flp-name{font-family:'Outfit',sans-serif;font-size:26px;font-weight:800;color:#fff;margin:0 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
    ".flp-crown{color:gold}",
    ".flp-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}",
    ".flp-badge{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:4px 10px;border-radius:20px}",
    ".flp-b-role{background:rgba(255,0,72,.16);color:#ff6b8b}",
    ".flp-b-user{background:rgba(255,255,255,.07);color:var(--text-secondary)}",
    ".flp-b-model{background:rgba(0,255,136,.14);color:#00ff88}",
    ".flp-b-coins{background:rgba(255,215,0,.16);color:gold}",
    ".flp-label{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:700;margin:14px 0 4px}",
    ".flp-text{color:#e8e8ee;font-size:14px;line-height:1.6;margin:0}",
    ".flp-chips{display:flex;flex-wrap:wrap;gap:6px}",
    ".flp-chip{background:rgba(255,255,255,.06);border:1px solid var(--border-color);border-radius:20px;padding:4px 12px;font-size:12px;color:#fff}",
    ".flp-empty{text-align:center;color:var(--text-secondary);padding:40px 10px;font-size:14px}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flpStyles2")) return;
    var st = document.createElement("style");
    st.id = "flpStyles2";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function shell() {
    return '<div class="flp-wrap">' +
      '<h2 style="font-family:\'Outfit\',sans-serif;color:#fff;margin:0 0 6px">Player Lookup</h2>' +
      '<p style="color:var(--text-secondary);font-size:13px;margin:0 0 16px">Search any username to see their skin, cape and customisation on a live 3D character.</p>' +
      '<div class="flp-search">' +
        '<input id="flpName" placeholder="Enter a username…" autocomplete="off" maxlength="16" />' +
        '<button type="button" id="flpGo"><i class="fas fa-search"></i> Search</button>' +
      "</div>" +
      '<div class="flp-msg" id="flpMsg"></div>' +
      '<div id="flpResult"><div class="flp-empty"><i class="fas fa-user-astronaut" style="font-size:34px;opacity:.5"></i>' +
        "<p>Search a player to see their 3D character.</p></div></div>" +
    "</div>";
  }

  function disposeViewer() {
    try { if (viewer && viewer.dispose) viewer.dispose(); } catch (e) {}
    viewer = null;
  }

  function buildViewer(p) {
    var canvas = document.getElementById("flpCanvas");
    if (!canvas) return;
    if (typeof skinview3d === "undefined") return;
    disposeViewer();
    try {
      viewer = new skinview3d.SkinViewer({ canvas: canvas, width: 320, height: 460 });
      try { viewer.renderer.setClearColor(0x0b0d14, 0); } catch (e) {}
      try {
        viewer.controls.enableRotate = true;
        viewer.controls.enableZoom = true;
        viewer.controls.enablePan = false;
      } catch (e) {}
      viewer.autoRotate = true;
      viewer.autoRotateSpeed = 0.6;
      try {
        if (skinview3d.WalkingAnimation) {
          viewer.animation = new skinview3d.WalkingAnimation();
          viewer.animation.speed = 0.5;
        }
      } catch (e) {}
      try { viewer.camera.position.set(0, 8, 48); } catch (e) {}

      var opts = p.skinModel === "slim" ? { model: "slim" } : {};
      var pr = viewer.loadSkin(p.skinUrl, opts);
      if (pr && pr.catch) pr.catch(function () {});
      if (p.hasCape) { try { viewer.loadCape(p.capeUrl); } catch (e) {} }
    } catch (e) {}
  }

  function show(p) {
    var el = document.getElementById("flpResult");
    if (!el) return;
    var roleCls = (p.role === "admin" || p.role === "superadmin" || p.role === "moderator") ? "flp-b-role" : "flp-b-user";
    var chips = (p.cosmetics || []).length
      ? '<div class="flp-chips">' + p.cosmetics.map(function (c) { return '<span class="flp-chip">' + esc(c.name || c.cosmeticId) + "</span>"; }).join("") + "</div>"
      : '<p class="flp-text" style="color:var(--text-secondary)">No cosmetics equipped.</p>';

    el.innerHTML =
      '<div class="flp-grid">' +
        '<div class="flp-stage"><canvas id="flpCanvas" width="320" height="460"></canvas></div>' +
        '<div class="flp-card">' +
          '<h3 class="flp-name">' + esc(p.displayName) + (p.premium ? ' <i class="fas fa-crown flp-crown"></i>' : "") + "</h3>" +
          '<div class="flp-badges">' +
            '<span class="flp-badge ' + roleCls + '">' + esc(p.role) + "</span>" +
            '<span class="flp-badge flp-b-model">' + esc(p.skinModel) + " model</span>" +
            '<span class="flp-badge flp-b-coins"><i class="fas fa-coins"></i> ' + (p.coins || 0) + "</span>" +
            (p.hasCape ? '<span class="flp-badge flp-b-user">cape</span>' : "") +
          "</div>" +
          (p.bio ? '<div class="flp-label">Bio</div><p class="flp-text">' + esc(p.bio) + "</p>" : "") +
          (p.description ? '<div class="flp-label">About</div><p class="flp-text">' + esc(p.description) + "</p>" : "") +
          '<div class="flp-label">Cosmetics</div>' + chips +
        "</div>" +
      "</div>";

    buildViewer(p);
  }

  function lookup() {
    var inp = document.getElementById("flpName");
    var msg = document.getElementById("flpMsg");
    var name = inp ? inp.value.trim() : "";
    if (!name) { if (msg) { msg.className = "flp-msg flp-err"; msg.textContent = "Type a username first."; } return; }
    if (msg) { msg.className = "flp-msg"; msg.textContent = "Searching…"; }

    fetch("/api/player/" + encodeURIComponent(name))
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (out) {
        if (!out.ok) {
          if (msg) { msg.className = "flp-msg flp-err"; msg.textContent = out.d.error || "Player not found."; }
          var el = document.getElementById("flpResult");
          if (el) el.innerHTML = '<div class="flp-empty">No player matched.</div>';
          disposeViewer();
          return;
        }
        if (msg) { msg.className = "flp-msg"; msg.textContent = ""; }
        show(out.d);
        try { history.replaceState(null, "", "?player=" + encodeURIComponent(out.d.username)); } catch (e) {}
      })
      .catch(function () { if (msg) { msg.className = "flp-msg flp-err"; msg.textContent = "Lookup failed."; } });
  }

  function wire() {
    var el = document.getElementById(SEC_ID);
    if (!el || el.getAttribute("data-wired")) return;
    el.setAttribute("data-wired", "1");
    injectStyles();
    el.innerHTML = shell();
    var go = document.getElementById("flpGo");
    var inp = document.getElementById("flpName");
    if (go) go.addEventListener("click", lookup);
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") lookup(); });
    try {
      var m = String(location.search || "").match(/[?&]player=([A-Za-z0-9_]+)/);
      if (m && inp) { inp.value = m[1]; lookup(); }
    } catch (e) {}
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
      var a = document.createElement("a");
      a.className = "nav-item";
      a.id = NAV_ID;
      a.setAttribute("data-section", SEC_ID);
      a.innerHTML = '<i class="fas fa-user-astronaut"></i><span>Player Lookup</span>';
      a.addEventListener("click", function () {
        if (typeof window.showSection === "function") window.showSection(SEC_ID);
        document.querySelectorAll(".nav-item").forEach(function (i) { i.classList.remove("active"); });
        a.classList.add("active");
        var sb = document.getElementById("sidebar");
        if (sb) sb.classList.remove("mobile-open");
        wire();
      });
      nav.appendChild(a);
    }
    if (document.getElementById(SEC_ID).classList.contains("active")) wire();
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
