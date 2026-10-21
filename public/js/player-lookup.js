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
    ".flp-ac{position:relative;flex:1;min-width:200px}",
    ".flp-ac input{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-family:inherit;font-size:14px}",
    ".flp-ac input:focus{outline:none;border-color:var(--primary-red)}",
    ".flp-sug{position:absolute;left:0;right:0;top:calc(100% + 6px);background:rgba(12,14,22,.98);border:1px solid var(--border-hover);border-radius:14px;z-index:60;box-shadow:0 18px 40px rgba(0,0,0,.6);max-height:280px;overflow-y:auto}",
    ".flp-sug-item{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;font-size:14px;color:#fff;border-bottom:1px solid rgba(255,255,255,.05)}",
    ".flp-sug-item:hover,.flp-sug-item.active{background:rgba(255,0,72,.14)}",
    ".flp-sug-role{font-size:10px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.4px;margin-left:auto}",
    ".flp-dl{padding:11px 16px;border:1px solid var(--border-hover);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px}",
    ".flp-dl:hover{background:rgba(255,0,72,.16);border-color:var(--primary-red)}",
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
    ".flp-empty{text-align:center;color:var(--text-secondary);padding:40px 10px;font-size:14px}",
    ".flp-top{display:flex;align-items:center;gap:14px;margin-bottom:12px}",
    ".flp-head{width:64px;height:64px;border-radius:15px;flex:0 0 auto;box-shadow:0 10px 26px rgba(0,0,0,.55);image-rendering:pixelated}",
    ".flp-dir{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px}",
    ".flp-pcard{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border-color);border-radius:14px;background:var(--bg-card);cursor:pointer;transition:border-color .15s,transform .15s}",
    ".flp-pcard:hover{border-color:var(--primary-red);transform:translateY(-2px)}",
    ".flp-pcard canvas{border-radius:9px;flex:0 0 auto;image-rendering:pixelated}",
    ".flp-pname{font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".flp-psub{font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".flp-sel{padding:9px 12px;border-radius:11px;border:1px solid var(--border-color);background:rgba(10,12,18,.7);color:#fff;font-family:inherit;font-size:13px;cursor:pointer}",
    ".flp-pager{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap}",
    ".flp-pg{padding:10px 16px;border-radius:12px;border:1px solid var(--border-color);background:rgba(255,255,255,.05);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer}",
    ".flp-pg:disabled{opacity:.35;cursor:default}",
    ".flp-pg:hover:not(:disabled){border-color:var(--primary-red)}",
    ".flp-pgnum{font-size:13px;color:var(--text-secondary)}"
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
        '<div class="flp-ac">' +
          '<input id="flpName" placeholder="Enter a username…" autocomplete="off" maxlength="16" />' +
          '<div class="flp-sug" id="flpSug" style="display:none"></div>' +
        "</div>" +
        '<button type="button" id="flpGo"><i class="fas fa-search"></i> Search</button>' +
      "</div>" +
      '<div class="flp-msg" id="flpMsg"></div>' +
      '<div id="flpResult"><div class="flp-empty"><i class="fas fa-user-astronaut" style="font-size:34px;opacity:.5"></i>' +
        "<p>Search a player above, or pick one from <b>All players</b> below.</p></div></div>" +
      '<div id="flpDir" style="margin-top:28px">' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
          '<h3 style="font-family:\'Outfit\',sans-serif;color:#fff;margin:0;font-size:16px"><i class="fas fa-users" style="color:var(--primary-red)"></i> All players</h3>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-left:auto">' +
            '<select id="flpSort" class="flp-sel">' +
              '<option value="new">Newest</option>' +
              '<option value="coins">Most coins</option>' +
              '<option value="online">Most online time</option>' +
              '<option value="name">A → Z</option>' +
            "</select>" +
            '<button type="button" class="flp-pg" id="flpRefresh" title="Reload players"><i class="fas fa-rotate-right"></i></button>' +
          "</div>" +
        "</div>" +
        '<div id="flpGrid" class="flp-dir"></div>' +
        '<div class="flp-pager" id="flpPager"></div>' +
      "</div>" +
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
    setCurrent(p && p.username ? p.username : null);
    var roleCls = (p.role === "admin" || p.role === "superadmin" || p.role === "moderator") ? "flp-b-role" : "flp-b-user";
    var chips = (p.cosmetics || []).length
      ? '<div class="flp-chips">' + p.cosmetics.map(function (c) { return '<span class="flp-chip">' + esc(c.name || c.cosmeticId) + "</span>"; }).join("") + "</div>"
      : '<p class="flp-text" style="color:var(--text-secondary)">No cosmetics equipped.</p>';

    el.innerHTML =
      '<div class="flp-grid">' +
        '<div class="flp-stage"><canvas id="flpCanvas" width="320" height="460"></canvas></div>' +
        '<div class="flp-card">' +
          '<div class="flp-top">' +
            '<canvas class="flp-head" id="flpHead" width="64" height="64"></canvas>' +
            '<h3 class="flp-name" style="margin:0">' + esc(p.displayName) + (p.premium ? ' <i class="fas fa-crown flp-crown"></i>' : "") + "</h3>" +
          "</div>" +
          '<div class="flp-badges">' +
            '<span class="flp-badge ' + roleCls + '">' + esc(p.role) + "</span>" +
            '<span class="flp-badge flp-b-model">' + esc(p.skinModel) + " model</span>" +
            '<span class="flp-badge flp-b-coins"><i class="fas fa-coins"></i> ' + (p.coins || 0) + "</span>" +
            (p.hasCape ? '<span class="flp-badge flp-b-user">cape</span>' : "") +
          "</div>" +
          (p.bio ? '<div class="flp-label">Bio</div><p class="flp-text">' + esc(p.bio) + "</p>" : "") +
          (p.description ? '<div class="flp-label">About</div><p class="flp-text">' + esc(p.description) + "</p>" : "") +
          '<div class="flp-label">Cosmetics</div>' + chips +
          '<div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">' +
            '<button type="button" class="flp-dl" id="flpDlSkin"><i class="fas fa-download"></i> Download skin PNG</button>' +
            (p.hasCape ? '<button type="button" class="flp-dl" id="flpDlCape"><i class="fas fa-download"></i> Download cape PNG</button>' : "") +
          "</div>" +
        "</div>" +
      "</div>";

    var hc = document.getElementById("flpHead");
    if (hc && window.FearLauncherHead) window.FearLauncherHead.draw(hc, p.skinUrl, 64);

    var ds = document.getElementById("flpDlSkin");
    if (ds) ds.addEventListener("click", function () { downloadFile(p.skinUrl, p.username + "-skin.png"); });
    var dc = document.getElementById("flpDlCape");
    if (dc) dc.addEventListener("click", function () { downloadFile(p.capeUrl, p.username + "-cape.png"); });

    buildViewer(p);
  }

  /* ---------- all-players directory ---------- */
  function renderDirectory(list) {
    var g = document.getElementById("flpGrid");
    if (!g) return;
    if (!list || !list.length) {
      g.innerHTML = '<p class="flp-text" style="color:var(--text-secondary)">No players yet.</p>';
      return;
    }
    g.innerHTML = list.map(function (p) {
      return '<div class="flp-pcard" data-u="' + esc(p.username) + '">' +
        '<canvas width="44" height="44"></canvas>' +
        '<div style="min-width:0">' +
          '<div class="flp-pname">' + esc(p.displayName) + (p.premium ? " 👑" : "") + "</div>" +
          '<div class="flp-psub">' + esc(p.role) + " · " + (p.coins || 0) + " coins</div>" +
        "</div></div>";
    }).join("");

    Array.prototype.forEach.call(g.querySelectorAll(".flp-pcard"), function (card) {
      var uname = card.getAttribute("data-u");
      var p = list.filter(function (x) { return x.username === uname; })[0];
      var c = card.querySelector("canvas");
      if (c && p && window.FearLauncherHead) window.FearLauncherHead.draw(c, p.skinUrl, 44);
      card.addEventListener("click", function () { openPlayer(uname); });
    });
  }

  var dirPage = 1, dirPages = 1, dirTotal = 0, dirPerPage = 30;
  var PER_PAGE = 30;

  function renderPager() {
    var el = document.getElementById("flpPager");
    if (!el) return;
    if (!dirTotal) { el.innerHTML = ""; return; }
    var from = (dirPage - 1) * dirPerPage + 1;
    var to = Math.min(dirPage * dirPerPage, dirTotal);

    el.innerHTML =
      '<button type="button" class="flp-pg" id="flpPrev"' + (dirPage <= 1 ? " disabled" : "") + '>' +
        '<i class="fas fa-chevron-left"></i> Prev</button>' +
      '<span class="flp-pgnum">Page <b style="color:#fff">' + dirPage + "</b> of " + dirPages +
        " &middot; showing " + from + "–" + to + " of " + dirTotal + " players</span>" +
      '<button type="button" class="flp-pg" id="flpNext"' + (dirPage >= dirPages ? " disabled" : "") + '>' +
        'Next <i class="fas fa-chevron-right"></i></button>';

    var pv = document.getElementById("flpPrev");
    if (pv) pv.addEventListener("click", function () { if (dirPage > 1) loadDirectory(dirPage - 1); });
    var nx = document.getElementById("flpNext");
    if (nx) nx.addEventListener("click", function () { if (dirPage < dirPages) loadDirectory(dirPage + 1); });
  }

  function loadDirectory(page, force) {
    var g = document.getElementById("flpGrid");
    if (!g) return;
    if (page === undefined && !force && g.getAttribute("data-loaded")) return;

    var sel = document.getElementById("flpSort");
    var sort = (sel && sel.value) || "new";
    var p = page || 1;

    g.innerHTML = '<p class="flp-text" style="color:var(--text-secondary)">Loading players…</p>';
    fetch("/api/players?sort=" + encodeURIComponent(sort) + "&limit=" + PER_PAGE + "&page=" + p)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        dirPage = d.page || 1;
        dirPages = d.pages || 1;
        dirTotal = d.total || 0;
        dirPerPage = d.perPage || PER_PAGE;
        renderDirectory(d.players || []);
        renderPager();
        g.setAttribute("data-loaded", "1");
        if (page !== undefined) {
          try { document.getElementById("flpDir").scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {}
        }
      })
      .catch(function () {});
  }

  function openPlayer(username) {
    var inp = document.getElementById("flpName");
    if (inp) inp.value = username;
    lookup();
    try { document.getElementById("flpResult").scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {}
  }

  // Who is on screen right now — so deep-links.js can build /player/<name>.
  function setCurrent(username) {
    if (!window.FearLauncherPlayerLookup) return;
    window.FearLauncherPlayerLookup.current = username || null;
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
    var sortSel = document.getElementById("flpSort");
    if (sortSel) sortSel.addEventListener("change", function () { loadDirectory(1, true); });
    var rf = document.getElementById("flpRefresh");
    if (rf) rf.addEventListener("click", function () { loadDirectory(dirPage, true); });
    loadDirectory(undefined, false);
    var go = document.getElementById("flpGo");
    var inp = document.getElementById("flpName");
    var sug = document.getElementById("flpSug");
    var timer = null;
    var items = [];
    var active = -1;

    function hideSug() { if (sug) { sug.style.display = "none"; sug.innerHTML = ""; } items = []; active = -1; }

    function paintSug(list) {
      if (!sug) return;
      items = list || [];
      active = -1;
      if (!items.length) { hideSug(); return; }
      sug.innerHTML = items.map(function (p, i) {
        return '<div class="flp-sug-item" data-i="' + i + '"><i class="fas fa-user"></i> <b>' + esc(p.username) + "</b>" +
          (p.premium ? ' <i class="fas fa-crown" style="color:gold"></i>' : "") +
          '<span class="flp-sug-role">' + esc(p.role) + "</span></div>";
      }).join("");
      sug.style.display = "block";
      Array.prototype.forEach.call(sug.querySelectorAll(".flp-sug-item"), function (it) {
        it.addEventListener("mousedown", function (e) { e.preventDefault(); pick(Number(it.getAttribute("data-i"))); });
      });
    }

    function pick(i) {
      var p = items[i];
      if (!p) return;
      if (inp) inp.value = p.username;
      hideSug();
      lookup();
    }

    function markActive() {
      if (!sug) return;
      Array.prototype.forEach.call(sug.querySelectorAll(".flp-sug-item"), function (it, i) {
        it.classList.toggle("active", i === active);
      });
    }

    function fetchSug(q) {
      fetch("/api/player/search?q=" + encodeURIComponent(q))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && inp && inp.value.trim() === q) paintSug(d.players || []); })
        .catch(function () {});
    }

    if (go) go.addEventListener("click", lookup);
    if (inp) {
      inp.addEventListener("input", function () {
        var q = inp.value.trim();
        if (timer) clearTimeout(timer);
        if (!q) { hideSug(); return; }
        timer = setTimeout(function () { fetchSug(q); }, 180);
      });
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          if (active >= 0 && items[active]) { e.preventDefault(); pick(active); }
          else { hideSug(); lookup(); }
        } else if (e.key === "ArrowDown" && items.length) { e.preventDefault(); active = Math.min(active + 1, items.length - 1); markActive(); }
        else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); active = Math.max(active - 1, 0); markActive(); }
        else if (e.key === "Escape") hideSug();
      });
      inp.addEventListener("blur", function () { setTimeout(hideSug, 150); });
    }

    try {
      var m = String(location.search || "").match(/[?&]player=([A-Za-z0-9_]+)/);
      if (m && inp) { inp.value = m[1]; lookup(); }
    } catch (e) {}
  }

  function downloadFile(url, filename) {
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("no file"); return r.blob(); })
      .then(function (b) {
        var u = URL.createObjectURL(b);
        var a = document.createElement("a");
        a.href = u;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          try { URL.revokeObjectURL(u); } catch (e) {}
          if (a.parentNode) a.parentNode.removeChild(a);
        }, 1200);
      })
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

  // Let the leaderboards (and anything else) open a player's account.
  window.FearLauncherPlayerLookup = {
    current: null,
    open: function (username) {
      if (!username) return;
      try { if (typeof window.showSection === "function") window.showSection(SEC_ID); } catch (e) {}
      var a = document.getElementById(NAV_ID);
      if (a) {
        document.querySelectorAll(".nav-item").forEach(function (i) { i.classList.remove("active"); });
        a.classList.add("active");
      }
      wire();
      setTimeout(function () { openPlayer(username); }, 80);
    },
    directory: function () { loadDirectory(1, true); }
  };

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
