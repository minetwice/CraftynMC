/* CraftynMC / FearLauncher — Modrinth-style store
 * ------------------------------------------------------------------
 * Replaces the plain category grid with a real browse experience:
 *   toolbar : search · sort (Relevance / Downloads / Newest / Name) · Filters
 *   filters : loader · Minecraft version · environment · licence
 *   results : count + Modrinth-style cards + pagination (20 per page)
 * Clicking a card opens the full project page.
 */
(function () {
  "use strict";

  var PER_PAGE = 20;
  var CATS = ["mods", "plugins", "resources", "shaders", "fearlauncher"];
  var state = {};   // per category

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function catOf(c) { return c === "fearlauncher" ? "launcher" : c; }
  function big(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function envLabel(v) {
    return v === "client" ? "Client" : v === "server" ? "Server" : v === "both" ? "Client or server" : "";
  }
  function meta(c) {
    var M = { mods: { i: "fa-cube", n: "Mod" }, plugins: { i: "fa-plug", n: "Plugin" },
      resources: { i: "fa-box", n: "Resource Pack" }, shaders: { i: "fa-sun", n: "Shader" },
      launcher: { i: "fa-rocket", n: "Launcher" } };
    return M[c] || M.mods;
  }
  function timeAgo(d) {
    var t = d ? new Date(d).getTime() : 0;
    if (!t) return "";
    var s = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    var dd = Math.round(s / 86400);
    if (dd < 30) return dd + "d ago";
    var mo = Math.round(dd / 30);
    return mo < 12 ? mo + "mo ago" : Math.round(mo / 12) + "y ago";
  }

  var CSS = [
    ".st-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 12px}",
    ".st-search{display:flex;align-items:center;gap:9px;flex:1;min-width:190px;padding:11px 14px;border:1px solid var(--border-color);border-radius:14px;background:rgba(10,12,18,.6)}",
    ".st-search i{color:var(--text-secondary)}",
    ".st-search input{flex:1;background:transparent;border:none;outline:none;color:#fff;font-family:inherit;font-size:14px}",
    ".st-sel{padding:11px 13px;border-radius:13px;border:1px solid var(--border-color);background:rgba(10,12,18,.7);color:#fff;font-family:inherit;font-size:13px;cursor:pointer}",
    ".st-fbtn{padding:11px 15px;border-radius:13px;border:1px solid var(--border-color);background:rgba(255,255,255,.05);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px}",
    ".st-fbtn.on{border-color:var(--primary-red);background:rgba(255,0,72,.14)}",
    ".st-filters{display:none;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;padding:16px;border:1px solid var(--border-color);border-radius:16px;background:var(--bg-card);margin-bottom:14px}",
    ".st-filters.open{display:grid}",
    ".st-fgroup h5{margin:0 0 8px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--text-secondary)}",
    ".st-opts{display:flex;flex-wrap:wrap;gap:6px}",
    ".st-opt{padding:6px 12px;border-radius:20px;border:1px solid var(--border-color);background:rgba(255,255,255,.04);color:var(--text-secondary);font-family:inherit;font-size:12.5px;cursor:pointer}",
    ".st-opt.on{background:rgba(255,0,72,.16);border-color:var(--primary-red);color:#fff}",
    ".st-count{font-size:13px;color:var(--text-secondary);margin:0 0 12px}",
    ".st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}",
    "@media (max-width:700px){.st-grid{grid-template-columns:1fr}}",
    ".st-card{display:flex;gap:14px;padding:15px;border:1px solid var(--border-color);border-radius:16px;background:var(--bg-card);cursor:pointer;transition:border-color .15s,transform .15s}",
    ".st-card:hover{border-color:var(--primary-red);transform:translateY(-2px)}",
    ".st-ico{width:66px;height:66px;border-radius:15px;flex:0 0 auto;object-fit:cover;background:#1b1e29;display:flex;align-items:center;justify-content:center;font-size:26px;color:#8b8ea0}",
    ".st-body{min-width:0;flex:1}",
    ".st-title{font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;color:#fff;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".st-by{font-size:12px;color:var(--text-secondary);margin:0 0 6px}",
    ".st-desc{font-size:13px;color:#c6c8d2;line-height:1.5;margin:0 0 9px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
    ".st-meta{display:flex;gap:13px;font-size:12.5px;color:var(--text-secondary);margin-bottom:9px;flex-wrap:wrap}",
    ".st-tags{display:flex;gap:6px;flex-wrap:wrap}",
    ".st-tag{background:rgba(255,255,255,.06);border:1px solid var(--border-color);border-radius:20px;padding:3px 10px;font-size:11.5px;color:#fff}",
    ".st-tag.acc{background:rgba(255,0,72,.14);border-color:rgba(255,0,72,.4);color:#ff9bb4}",
    ".st-tag.ok{background:rgba(0,255,136,.12);border-color:rgba(0,255,136,.3);color:#00ff88}",
    ".st-tag.gold{background:rgba(255,215,0,.16);border-color:rgba(255,215,0,.4);color:gold}",
    ".st-pager{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px;flex-wrap:wrap}",
    ".st-pg{padding:10px 16px;border-radius:12px;border:1px solid var(--border-color);background:rgba(255,255,255,.05);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer}",
    ".st-pg:disabled{opacity:.35;cursor:default}",
    ".st-empty{padding:40px 10px;text-align:center;color:var(--text-secondary);font-size:14px}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("stStyles")) return;
    var st = document.createElement("style");
    st.id = "stStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function st(cat) {
    if (!state[cat]) {
      state[cat] = { assets: null, q: "", sort: "relevance", page: 1, open: false, f: { loader: "", version: "", env: "", licence: "" } };
    }
    return state[cat];
  }

  /* ---------- filtering ---------- */
  function filtered(s) {
    var list = (s.assets || []).slice();
    var q = s.q.trim().toLowerCase();
    if (q) {
      list = list.filter(function (a) {
        return (a.name || "").toLowerCase().indexOf(q) !== -1 ||
          (a.description || "").toLowerCase().indexOf(q) !== -1 ||
          (a.lore || "").toLowerCase().indexOf(q) !== -1 ||
          (a.uploadedBy || "").toLowerCase().indexOf(q) !== -1;
      });
    }
    if (s.f.loader) list = list.filter(function (a) { return (a.loaders || []).indexOf(s.f.loader) !== -1; });
    if (s.f.version) list = list.filter(function (a) { return (a.supportedVersions || []).indexOf(s.f.version) !== -1; });
    if (s.f.env) list = list.filter(function (a) { return (a.environment || "") === s.f.env; });
    if (s.f.licence) list = list.filter(function (a) { return (a.licence || "") === s.f.licence; });

    var feat = function (a) { return a.featuredUntil && new Date(a.featuredUntil) > new Date() ? 1 : 0; };
    if (s.sort === "downloads") list.sort(function (a, b) { return feat(b) - feat(a) || (b.downloadsCount || 0) - (a.downloadsCount || 0); });
    else if (s.sort === "newest") list.sort(function (a, b) { return feat(b) - feat(a) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
    else if (s.sort === "updated") list.sort(function (a, b) { return feat(b) - feat(a) || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); });
    else if (s.sort === "name") list.sort(function (a, b) { return feat(b) - feat(a) || String(a.name).localeCompare(String(b.name)); });
    else list.sort(function (a, b) { return feat(b) - feat(a) || (b.views || 0) - (a.views || 0); });
    return list;
  }

  function distinct(list, key) {
    var seen = {}, out = [];
    list.forEach(function (a) {
      var v = a[key];
      var arr = Array.isArray(v) ? v : (v ? [v] : []);
      arr.forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; out.push(x); } });
    });
    return out.sort();
  }

  /* ---------- rendering ---------- */
  function card(a) {
    var icon = a.iconUrl || a.previewUrl;
    var m = meta(a.category);
    var featured = a.featuredUntil && new Date(a.featuredUntil) > new Date();
    var tags = [];
    (a.loaders || []).slice(0, 3).forEach(function (l) { tags.push('<span class="st-tag">' + esc(l) + "</span>"); });
    if (a.environment) tags.push('<span class="st-tag ok">' + envLabel(a.environment) + "</span>");
    if (a.licence) tags.push('<span class="st-tag">' + esc(a.licence) + "</span>");
    if (featured) tags.push('<span class="st-tag gold">★ Featured</span>');
    if (a.coinCost > 0) tags.push('<span class="st-tag acc">' + a.coinCost + " coins</span>");

    return '<div class="st-card" data-id="' + esc(a._id) + '">' +
        (icon ? '<img class="st-ico" src="' + esc(icon) + '" alt="" onerror="this.style.display=\'none\'">'
              : '<div class="st-ico"><i class="fas ' + m.i + '"></i></div>') +
        '<div class="st-body">' +
          '<h3 class="st-title">' + esc(a.name) + "</h3>" +
          '<p class="st-by">by ' + esc(a.uploadedBy || "Unknown") + (a.version ? " · " + esc(a.version) : "") + "</p>" +
          '<p class="st-desc">' + esc(String(a.description || a.lore || "").replace(/[#*`>_\[\]()]/g, " ").slice(0, 180)) + "</p>" +
          '<div class="st-meta">' +
            '<span><i class="fas fa-download"></i> ' + big(a.downloadsCount) + "</span>" +
            '<span><i class="fas fa-eye"></i> ' + big(a.views) + "</span>" +
            (a.ratingCount ? '<span><i class="fas fa-star" style="color:gold"></i> ' + (a.ratingAvg || 0) + "</span>" : "") +
            (a.updatedAt ? "<span>" + timeAgo(a.updatedAt) + "</span>" : "") +
          "</div>" +
          '<div class="st-tags">' + tags.join("") + "</div>" +
        "</div></div>";
  }

  function filtersHTML(cat, list) {
    var s = st(cat);
    var loaders = distinct(list, "loaders");
    var versions = distinct(list, "supportedVersions").slice(0, 14);
    var licences = distinct(list, "licence");
    function group(title, key, values, labeler) {
      if (!values.length) return "";
      return '<div class="st-fgroup"><h5>' + title + "</h5><div class=\"st-opts\">" +
        values.map(function (v) {
          return '<button type="button" class="st-opt' + (s.f[key] === v ? " on" : "") + '" data-f="' + key + '" data-v="' + esc(v) + '">' +
            esc(labeler ? labeler(v) : v) + "</button>";
        }).join("") + "</div></div>";
    }
    return group("Loader / platform", "loader", loaders) +
      group("Minecraft version", "version", versions) +
      group("Environment", "env", ["client", "server", "both"], envLabel) +
      group("Licence", "licence", licences);
  }

  function paint(cat) {
    var container = document.getElementById(cat + "Container");
    if (!container) return;
    var s = st(cat);
    var list = filtered(s);
    var pages = Math.max(Math.ceil(list.length / PER_PAGE), 1);
    if (s.page > pages) s.page = pages;
    var slice = list.slice((s.page - 1) * PER_PAGE, s.page * PER_PAGE);
    var m = meta(catOf(cat));

    var cards = slice.length
      ? slice.map(card).join("")
      : '<div class="st-empty"><i class="fas ' + m.i + '" style="font-size:30px;opacity:.4"></i><p style="margin:10px 0 0">' +
        (s.q || s.f.loader || s.f.version || s.f.env || s.f.licence ? "No projects match your filters." : "Nothing here yet — check back soon!") + "</p></div>";

    var pager = pages > 1
      ? '<div class="st-pager">' +
          '<button type="button" class="st-pg" data-pg="prev"' + (s.page <= 1 ? " disabled" : "") + '><i class="fas fa-chevron-left"></i> Prev</button>' +
          '<span class="st-count" style="margin:0">Page <b style="color:#fff">' + s.page + "</b> of " + pages + " · " + list.length + " project" + (list.length === 1 ? "" : "s") + "</span>" +
          '<button type="button" class="st-pg" data-pg="next"' + (s.page >= pages ? " disabled" : "") + '>Next <i class="fas fa-chevron-right"></i></button>' +
        "</div>"
      : "";

    container.classList.remove("grid-3", "mr-grid");
    container.style.display = "block";
    container.innerHTML =
      '<div class="st-toolbar">' +
        '<div class="st-search"><i class="fas fa-magnifying-glass"></i>' +
          '<input id="stQ_' + cat + '" placeholder="Search ' + cat + '…" value="' + esc(s.q) + '" autocomplete="off"></div>' +
        '<select class="st-sel" id="stSort_' + cat + '">' +
          [["relevance", "Relevance"], ["downloads", "Downloads"], ["updated", "Recently updated"], ["newest", "Newest"], ["name", "Name A–Z"]]
            .map(function (o) { return '<option value="' + o[0] + '"' + (s.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
        "</select>" +
        '<button type="button" class="st-fbtn' + (s.open ? " on" : "") + '" id="stF_' + cat + '"><i class="fas fa-sliders"></i> Filters</button>' +
      "</div>" +
      '<div class="st-filters' + (s.open ? " open" : "") + '" id="stFilters_' + cat + '">' + filtersHTML(cat, s.assets || []) + "</div>" +
      '<p class="st-count">' + list.length + " project" + (list.length === 1 ? "" : "s") + "</p>" +
      '<div class="st-grid">' + cards + "</div>" + pager;

    bind(cat, container);
  }

  function bind(cat, container) {
    var s = st(cat);
    var q = document.getElementById("stQ_" + cat);
    if (q) q.addEventListener("input", function () { s.q = q.value; s.page = 1; paint(cat); setTimeout(function () { var el = document.getElementById("stQ_" + cat); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 0); });
    var so = document.getElementById("stSort_" + cat);
    if (so) so.addEventListener("change", function () { s.sort = so.value; s.page = 1; paint(cat); });
    var fb = document.getElementById("stF_" + cat);
    if (fb) fb.addEventListener("click", function () { s.open = !s.open; paint(cat); });

    Array.prototype.forEach.call(container.querySelectorAll(".st-opt"), function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-f"), v = b.getAttribute("data-v");
        s.f[k] = (s.f[k] === v) ? "" : v;
        s.page = 1;
        paint(cat);
      });
    });
    Array.prototype.forEach.call(container.querySelectorAll(".st-pg"), function (b) {
      b.addEventListener("click", function () {
        var d = b.getAttribute("data-pg");
        s.page += (d === "next" ? 1 : -1);
        paint(cat);
        try { container.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {}
      });
    });
    Array.prototype.forEach.call(container.querySelectorAll(".st-card"), function (c) {
      c.addEventListener("click", function () {
        var id = c.getAttribute("data-id");
        var a = (s.assets || []).filter(function (x) { return String(x._id) === String(id); })[0];
        if (!a) return;
        if (window.FearLauncherProject) window.FearLauncherProject.open(a);
        else if (window.FearLauncherStore) window.FearLauncherStore.open(a);
      });
    });
  }

  /* ---------- data ---------- */
  function load(cat, force) {
    var s = st(cat);
    var container = document.getElementById(cat + "Container");
    if (!container) return;
    if (s.assets && !force) { paint(cat); return; }
    container.classList.remove("grid-3", "mr-grid");
    container.style.display = "block";
    container.innerHTML = '<div class="st-empty">Loading ' + esc(cat) + "…</div>";
    fetch("/api/assets?category=" + encodeURIComponent(catOf(cat)))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { s.assets = (d && d.assets) || []; paint(cat); })
      .catch(function () { container.innerHTML = '<div class="st-empty">Could not load ' + esc(cat) + ".</div>"; });
  }

  /* ---------- take over the page's loader ---------- */
  function init() {
    injectStyles();
    if (window.__flStoreHooked) return;
    window.__flStoreHooked = true;
    window.loadPublicAssets = function (cat) {
      if (CATS.indexOf(cat) === -1) return;
      load(cat, false);
    };
    window.FearLauncherStoreFront = { load: load, refresh: function (cat) { load(cat, true); } };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  [400, 1200, 2500].forEach(function (t) { setTimeout(init, t); });
})();
