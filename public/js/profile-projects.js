/* CraftynMC — "Projects by this player" on a Player Lookup profile
 * ------------------------------------------------------------------
 * Modrinth profiles show a creator's projects. We watch the Player Lookup
 * result, and when it shows a player, append the projects they uploaded.
 */
(function () {
  "use strict";

  var CATS = ["mods", "plugins", "resources", "shaders", "launcher"];
  var BOX_ID = "flpProjects";
  var lastUser = "";
  var cache = null;

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

  function all() {
    if (cache) return Promise.resolve(cache);
    return Promise.all(CATS.map(function (c) {
      return fetch("/api/assets?category=" + encodeURIComponent(c))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return (d && d.assets) || []; })
        .catch(function () { return []; });
    })).then(function (g) {
      var out = [];
      g.forEach(function (x) { out = out.concat(x); });
      cache = out;
      return out;
    });
  }

  function render(username) {
    var host = document.getElementById("flpResult");
    if (!host) return;
    if (document.getElementById(BOX_ID)) document.getElementById(BOX_ID).remove();

    all().then(function (list) {
      var mine = list.filter(function (a) {
        return String(a.uploadedBy || "").toLowerCase() === String(username).toLowerCase();
      });
      if (!mine.length) return;

      var box = document.createElement("div");
      box.id = BOX_ID;
      box.style.cssText = "margin-top:16px;padding-top:14px;border-top:1px solid var(--border-color)";
      box.innerHTML = '<h4 style="margin:0 0 10px;font-family:\'Outfit\',sans-serif;font-size:14px;color:#fff">' +
          '<i class="fas fa-cube" style="color:var(--primary-red)"></i> Projects by ' + esc(username) +
          ' <span style="color:var(--text-secondary);font-weight:400">(' + mine.length + ")</span></h4>" +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">' +
          mine.map(function (a) {
            return '<div data-id="' + esc(a._id) + '" class="flpp-card" style="display:flex;gap:10px;padding:11px;' +
              'border:1px solid var(--border-color);border-radius:13px;background:var(--bg-card);cursor:pointer">' +
              (a.iconUrl || a.previewUrl
                ? '<img src="' + esc(a.iconUrl || a.previewUrl) + '" alt="" style="width:42px;height:42px;border-radius:11px;object-fit:cover;flex:0 0 auto" onerror="this.style.display=\'none\'">'
                : '<div style="width:42px;height:42px;border-radius:11px;background:#1b1e29;flex:0 0 auto"></div>') +
              '<div style="min-width:0"><div style="font-size:13.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
                esc(a.name) + "</div>" +
                '<div style="font-size:11.5px;color:var(--text-secondary)">' + esc(a.category) + " · " +
                big(a.downloadsCount) + " downloads</div></div></div>";
          }).join("") +
        "</div>";

      host.appendChild(box);
      Array.prototype.forEach.call(box.querySelectorAll(".flpp-card"), function (c) {
        c.addEventListener("click", function () {
          var id = c.getAttribute("data-id");
          var a = mine.filter(function (x) { return String(x._id) === String(id); })[0];
          if (a && window.FearLauncherProject) window.FearLauncherProject.open(a);
        });
      });
    });
  }

  function tick() {
    var pl = window.FearLauncherPlayerLookup;
    var u = pl && pl.current;
    if (!u) { lastUser = ""; return; }
    if (u === lastUser && document.getElementById(BOX_ID)) return;
    var host = document.getElementById("flpResult");
    if (!host || host.textContent.length < 20) return;   // profile not painted yet
    lastUser = u;
    render(u);
  }

  setInterval(tick, 1500);
})();
