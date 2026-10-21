/* CraftynMC / FearLauncher — Modrinth-style home
 * ------------------------------------------------------------------
 * Adds a "Discover" block to the top of the dashboard:
 *   hero (how many creations) · a search box that jumps to a category
 *   Featured · Popular · Recently updated
 * Cards open the full project page.
 */
(function () {
  "use strict";

  var HOST_ID = "flHome";
  var CATS = ["mods", "plugins", "resources", "shaders", "launcher"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function big(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function meta(c) {
    var M = { mods: "fa-cube", plugins: "fa-plug", resources: "fa-box", shaders: "fa-sun", launcher: "fa-rocket" };
    return M[c] || "fa-cube";
  }
  function pageOf(c) { return c === "launcher" ? "fearlauncher" : c; }

  var CSS = [
    "#flHome{margin-bottom:22px}",
    ".fh-hero{position:relative;overflow:hidden;border:1px solid var(--border-color);border-radius:20px;padding:26px 24px;background:radial-gradient(700px 320px at 12% 0%,rgba(255,0,72,.20),transparent 65%),var(--bg-card)}",
    ".fh-hero h2{font-family:'Outfit',sans-serif;font-size:25px;font-weight:800;color:#fff;margin:0 0 6px}",
    ".fh-hero p{margin:0 0 16px;color:var(--text-secondary);font-size:14px;max-width:620px;line-height:1.6}",
    ".fh-search{display:flex;gap:9px;flex-wrap:wrap;max-width:620px}",
    ".fh-search .fh-box{flex:1;min-width:190px;display:flex;align-items:center;gap:9px;padding:12px 15px;border-radius:14px;border:1px solid var(--border-color);background:rgba(8,10,15,.7)}",
    ".fh-search input{flex:1;background:transparent;border:none;outline:none;color:#fff;font-family:inherit;font-size:14px}",
    ".fh-search select{padding:12px 13px;border-radius:14px;border:1px solid var(--border-color);background:rgba(8,10,15,.85);color:#fff;font-family:inherit;font-size:13px}",
    ".fh-go{padding:12px 20px;border:none;border-radius:14px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:800;font-size:14px;font-family:inherit;cursor:pointer}",
    ".fh-sec{margin-top:22px}",
    ".fh-sec h3{font-family:'Outfit',sans-serif;font-size:16px;color:#fff;margin:0 0 12px;display:flex;align-items:center;gap:9px}",
    ".fh-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:13px}",
    ".fh-card{display:flex;gap:12px;padding:13px;border:1px solid var(--border-color);border-radius:15px;background:var(--bg-card);cursor:pointer;transition:border-color .15s,transform .15s}",
    ".fh-card:hover{border-color:var(--primary-red);transform:translateY(-2px)}",
    ".fh-ico{width:54px;height:54px;border-radius:13px;flex:0 0 auto;object-fit:cover;background:#1b1e29;display:flex;align-items:center;justify-content:center;font-size:21px;color:#8b8ea0}",
    ".fh-b{min-width:0;flex:1}",
    ".fh-t{font-size:14.5px;font-weight:700;color:#fff;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".fh-d{font-size:12.5px;color:var(--text-secondary);line-height:1.45;margin:0 0 7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
    ".fh-m{display:flex;gap:11px;font-size:12px;color:var(--text-secondary);flex-wrap:wrap}",
    ".fh-tag{background:rgba(255,255,255,.06);border:1px solid var(--border-color);border-radius:20px;padding:2px 9px;font-size:11px;color:#fff;margin-left:4px}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("fhStyles")) return;
    var st = document.createElement("style");
    st.id = "fhStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function card(a) {
    var icon = a.iconUrl || a.previewUrl;
    return '<div class="fh-card" data-cat="' + esc(a.category) + '" data-id="' + esc(a._id) + '">' +
        (icon ? '<img class="fh-ico" src="' + esc(icon) + '" alt="" onerror="this.style.display=\'none\'">'
              : '<div class="fh-ico"><i class="fas ' + meta(a.category) + '"></i></div>') +
        '<div class="fh-b">' +
          '<h4 class="fh-t">' + esc(a.name) + '<span class="fh-tag">' + esc(a.category) + "</span></h4>" +
          '<p class="fh-d">' + esc(String(a.description || a.lore || "").replace(/[#*`>_\[\]()]/g, " ").slice(0, 150)) + "</p>" +
          '<div class="fh-m"><span><i class="fas fa-download"></i> ' + big(a.downloadsCount) + "</span>" +
            '<span><i class="fas fa-eye"></i> ' + big(a.views) + "</span>" +
            '<span>by ' + esc(a.uploadedBy || "Unknown") + "</span></div>" +
        "</div></div>";
  }

  function section(title, icon, list) {
    if (!list.length) return "";
    return '<div class="fh-sec"><h3><i class="fas ' + icon + '" style="color:var(--primary-red)"></i> ' + title + "</h3>" +
      '<div class="fh-row">' + list.map(card).join("") + "</div></div>";
  }

  function render(all) {
    var host = document.getElementById(HOST_ID);
    if (!host) return;

    var featured = all.filter(function (a) { return a.featuredUntil && new Date(a.featuredUntil) > new Date(); }).slice(0, 6);
    var popular = all.slice().sort(function (a, b) {
      return (b.downloadsCount || 0) * 3 + (b.views || 0) - ((a.downloadsCount || 0) * 3 + (a.views || 0));
    }).slice(0, 6);
    var recent = all.slice().sort(function (a, b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); }).slice(0, 6);

    host.innerHTML =
      '<div class="fh-hero">' +
        "<h2>Discover over " + all.length + " creation" + (all.length === 1 ? "" : "s") + "</h2>" +
        "<p>Mods, plugins, resource packs, shaders and the FearLauncher client — all in one place. Search as you type, then download with a single click.</p>" +
        '<div class="fh-search">' +
          '<div class="fh-box"><i class="fas fa-magnifying-glass" style="color:var(--text-secondary)"></i>' +
            '<input id="fhQ" placeholder="Search mods, plugins, shaders…" autocomplete="off"></div>' +
          '<select id="fhCat">' + CATS.map(function (c) { return '<option value="' + pageOf(c) + '">' + c.charAt(0).toUpperCase() + c.slice(1) + "</option>"; }).join("") + "</select>" +
          '<button type="button" class="fh-go" id="fhGo">Search</button>' +
        "</div>" +
      "</div>" +
      section("Featured", "fa-star", featured) +
      section("Popular", "fa-fire", popular) +
      section("Recently updated", "fa-clock-rotate-left", recent);

    var go = function () {
      var q = (document.getElementById("fhQ") || {}).value || "";
      var cat = (document.getElementById("fhCat") || {}).value || "mods";
      if (typeof window.showSection === "function") window.showSection(cat);
      setTimeout(function () {
        var el = document.getElementById("stQ_" + cat);
        if (el) { el.value = q; el.dispatchEvent(new Event("input")); }
      }, 400);
    };
    var b = document.getElementById("fhGo"); if (b) b.addEventListener("click", go);
    var qq = document.getElementById("fhQ");
    if (qq) qq.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });

    Array.prototype.forEach.call(host.querySelectorAll(".fh-card"), function (c) {
      c.addEventListener("click", function () {
        var id = c.getAttribute("data-id");
        var a = all.filter(function (x) { return String(x._id) === String(id); })[0];
        if (a && window.FearLauncherProject) window.FearLauncherProject.open(a);
      });
    });
  }

  function init() {
    injectStyles();
    if (document.getElementById(HOST_ID)) return;
    var dash = document.getElementById("dashboard");
    if (!dash) return;
    var auth = document.getElementById("authView");
    if (auth && auth.classList.contains("active")) return;

    var host = document.createElement("div");
    host.id = HOST_ID;
    dash.insertBefore(host, dash.firstChild);

    Promise.all(CATS.map(function (c) {
      return fetch("/api/assets?category=" + encodeURIComponent(c))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return (d && d.assets) || []; })
        .catch(function () { return []; });
    })).then(function (groups) {
      var all = [];
      groups.forEach(function (g) { all = all.concat(g); });
      render(all);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  [500, 1500, 3000].forEach(function (t) { setTimeout(init, t); });
  setInterval(function () { if (!document.getElementById(HOST_ID)) init(); }, 4000);
})();
