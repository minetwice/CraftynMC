/* CraftynMC — notifications bell
 * ------------------------------------------------------------------
 * A 🔔 in the top bar with an unread badge and a dropdown panel.
 * Polls the cheap /count endpoint so it stays current without hammering.
 */
(function () {
  "use strict";

  var BELL = "flBell";
  var PANEL = "flBellPanel";
  var unread = 0;
  var timer = null;

  function token() {
    try { return (typeof window.getToken === "function") ? window.getToken() : ""; } catch (e) { return ""; }
  }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var t = token();
    if (t) opts.headers.Authorization = "Bearer " + t;
    return fetch(path, opts).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ago(d) {
    var s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
    if (s < 60) return "now";
    if (s < 3600) return Math.round(s / 60) + "m";
    if (s < 86400) return Math.round(s / 3600) + "h";
    return Math.round(s / 86400) + "d";
  }

  var ICONS = { follow: "fa-user-plus", review: "fa-star", coins: "fa-coins", featured: "fa-fire", system: "fa-bell" };

  var CSS = [
    "#" + BELL + "{position:relative;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;",
      "border-radius:12px;border:1px solid var(--border-color);background:rgba(255,255,255,.04);color:#fff;cursor:pointer;",
      "font-size:15px;transition:border-color .18s ease,background .18s ease}",
    "#" + BELL + ":hover{border-color:var(--border-hover);background:rgba(255,0,72,.10)}",
    "#" + BELL + " .fl-bell-dot{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;",
      "background:var(--gradient-main);color:#fff;font-size:10px;font-weight:800;display:none;align-items:center;justify-content:center;",
      "box-shadow:0 0 10px var(--primary-glow)}",
    "#" + BELL + ".has .fl-bell-dot{display:flex}",
    "#" + PANEL + "{position:fixed;top:70px;right:14px;width:min(370px,calc(100vw - 24px));max-height:min(70vh,520px);overflow:auto;",
      "z-index:10060;background:var(--bg-card);border:1px solid var(--border-hover);border-radius:16px;",
      "box-shadow:0 26px 70px rgba(0,0,0,.7);display:none;backdrop-filter:blur(12px)}",
    "#" + PANEL + ".on{display:block;animation:flBellIn .18s ease}",
    "@keyframes flBellIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}",
    "#" + PANEL + " .fl-bp-head{display:flex;align-items:center;gap:9px;padding:14px 15px;border-bottom:1px solid var(--border-color);",
      "font-weight:800;font-size:14px;color:#fff;position:sticky;top:0;background:var(--bg-card)}",
    "#" + PANEL + " .fl-bp-head button{margin-left:auto;background:none;border:none;color:var(--text-secondary);font-size:11.5px;",
      "cursor:pointer;font-family:inherit;padding:4px 6px}",
    "#" + PANEL + " .fl-bp-head button:hover{color:#fff}",
    "#" + PANEL + " .fl-bp-row{display:flex;gap:11px;padding:12px 15px;border-bottom:1px solid var(--border-color);cursor:pointer;transition:background .15s ease}",
    "#" + PANEL + " .fl-bp-row:hover{background:rgba(255,255,255,.04)}",
    "#" + PANEL + " .fl-bp-row.unread{background:rgba(255,0,72,.06)}",
    "#" + PANEL + " .fl-bp-ico{width:34px;height:34px;border-radius:11px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;",
      "background:rgba(255,0,72,.14);color:var(--primary-red);font-size:13px}",
    "#" + PANEL + " .fl-bp-t{font-size:13.5px;font-weight:700;color:#fff;margin:0 0 2px}",
    "#" + PANEL + " .fl-bp-b{font-size:12.5px;color:var(--text-secondary);margin:0;line-height:1.5}",
    "#" + PANEL + " .fl-bp-w{font-size:11px;color:var(--text-secondary);margin-top:4px;opacity:.8}",
    "#" + PANEL + " .fl-bp-empty{padding:38px 20px;text-align:center;color:var(--text-secondary);font-size:13.5px}",
    "@media (max-width:600px){#" + PANEL + "{top:auto;bottom:0;left:0;right:0;width:100%;max-height:76vh;border-radius:18px 18px 0 0}}"
  ].join("");

  function styles() {
    if (document.getElementById("flBellStyles")) return;
    var st = document.createElement("style");
    st.id = "flBellStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function inject() {
    if (document.getElementById(BELL)) return;
    var auth = document.getElementById("authView");
    if (auth && auth.classList.contains("active")) return;
    var bar = document.querySelector(".top-bar");
    if (!bar) return;

    var b = document.createElement("button");
    b.id = BELL;
    b.type = "button";
    b.title = "Notifications";
    b.setAttribute("aria-label", "Notifications");
    b.innerHTML = '<i class="fas fa-bell"></i><span class="fl-bell-dot">0</span>';
    b.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });

    var coin = bar.querySelector(".coin-display");
    if (coin && coin.parentNode === bar) bar.insertBefore(b, coin);
    else bar.appendChild(b);

    var panel = document.createElement("div");
    panel.id = PANEL;
    document.body.appendChild(panel);

    document.addEventListener("click", function (e) {
      var p = document.getElementById(PANEL);
      if (!p || !p.classList.contains("on")) return;
      if (e.target.closest && (e.target.closest("#" + PANEL) || e.target.closest("#" + BELL))) return;
      p.classList.remove("on");
    });
  }

  function paintBadge() {
    var b = document.getElementById(BELL);
    if (!b) return;
    var dot = b.querySelector(".fl-bell-dot");
    if (dot) dot.textContent = unread > 99 ? "99+" : String(unread);
    b.classList.toggle("has", unread > 0);
  }

  function poll() {
    if (!token()) return;
    api("/api/notifications/count").then(function (d) {
      if (!d) return;
      unread = d.unread || 0;
      paintBadge();
    });
  }

  function render(list) {
    var p = document.getElementById(PANEL);
    if (!p) return;
    var rows = (list || []).map(function (n) {
      var href = n.link || "";
      return '<div class="fl-bp-row' + (n.read ? "" : " unread") + '" data-href="' + esc(href) + '">' +
        '<div class="fl-bp-ico"><i class="fas ' + (ICONS[n.type] || ICONS.system) + '"></i></div>' +
        "<div style=\"min-width:0\"><p class=\"fl-bp-t\">" + esc(n.title) + "</p>" +
        (n.body ? '<p class="fl-bp-b">' + esc(n.body) + "</p>" : "") +
        '<div class="fl-bp-w">' + ago(n.createdAt) + " ago</div></div></div>";
    }).join("");

    p.innerHTML =
      '<div class="fl-bp-head"><i class="fas fa-bell"></i> Notifications' +
        '<button type="button" id="flBellClear">Clear all</button></div>' +
      (rows || '<div class="fl-bp-empty"><i class="fas fa-bell-slash" style="font-size:22px;opacity:.5"></i><p>Nothing yet. Follow a creator and their updates land here.</p></div>');

    Array.prototype.forEach.call(p.querySelectorAll(".fl-bp-row"), function (r) {
      r.addEventListener("click", function () {
        var href = r.getAttribute("data-href");
        p.classList.remove("on");
        if (!href) return;
        // in-app links open the right page instead of reloading
        var m = String(href).match(/^\/([a-z-]+)\/(.+)$/i);
        if (m && window.FearLauncherProject) {
          if (m[1] === "player") {
            if (window.FearLauncherPlayerLookup) window.FearLauncherPlayerLookup.open(decodeURIComponent(m[2]));
            return;
          }
          if (typeof window.showSection === "function") window.showSection(m[1] === "fearlauncher" ? "fearlauncher" : m[1]);
          setTimeout(function () {
            var a = (window.__flAllAssets || []).filter(function (x) {
              return String(x.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === m[2];
            })[0];
            if (a) window.FearLauncherProject.open(a);
          }, 500);
          return;
        }
        location.href = href;
      });
    });

    var clear = document.getElementById("flBellClear");
    if (clear) clear.addEventListener("click", function (e) {
      e.stopPropagation();
      api("/api/notifications", { method: "DELETE" }).then(function () {
        unread = 0; paintBadge(); render([]);
      });
    });
  }

  function toggle() {
    var p = document.getElementById(PANEL);
    if (!p) return;
    if (p.classList.contains("on")) { p.classList.remove("on"); return; }
    p.classList.add("on");
    p.innerHTML = '<div class="fl-bp-head"><i class="fas fa-bell"></i> Notifications</div>' +
      '<div class="fl-bp-empty">Loading…</div>';
    api("/api/notifications").then(function (d) {
      if (!d) { render([]); return; }
      render(d.notifications || []);
      unread = 0;
      paintBadge();
      api("/api/notifications/read", { method: "POST", body: "{}" });
    });
  }

  function init() { styles(); inject(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  [400, 1200, 2600].forEach(function (t) { setTimeout(init, t); });
  setInterval(init, 3000);
  if (!timer) timer = setInterval(poll, 30000);
  setTimeout(poll, 1500);
})();
