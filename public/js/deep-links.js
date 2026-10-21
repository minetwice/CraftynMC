/* CraftynMC / FearLauncher — shareable page links (pretty URLs)
 * ------------------------------------------------------------------
 * Every page now has a real path, e.g.
 *   craftynmc.onrender.com/plugins
 *   craftynmc.onrender.com/plugins/Cyclone-Fury     <- one project
 *   craftynmc.onrender.com/player-lookup
 *
 *   - Opening such a link lands straight on that page (or that project), and
 *     STAYS there even though the app calls showSection("dashboard") on login.
 *   - "Copy link" in the top bar copies the current page/project link.
 *   - Browser Back / Forward move between pages.
 *   - Old #hash links still work.
 *
 * NOTE: navigation uses history.pushState, which does NOT reload the page — so
 * the ads already on screen are never re-requested (a reload would kill them).
 */
(function () {
  "use strict";

  var BTN_ID = "flShareBtn";
  var SETTLE_MS = 12000;

  // pages we may link to (must match PAGE_ROUTES in src/index.js)
  var PAGES = {
    dashboard: 1, mods: 1, plugins: 1, resources: 1, shaders: 1, fearlauncher: 1,
    profile: 1, "daily-rewards": 1, achievements: 1, leaderboard: 1,
    "earn-coins": 1, "coin-shop": 1, "player-lookup": 1
  };
  // section id -> asset category (the launcher page shows the "launcher" category)
  function categoryFor(section) { return section === "fearlauncher" ? "launcher" : section; }

  var wantPage = null;      // page the URL asked for
  var wantProject = null;   // project slug the URL asked for
  var wantPlayer = null;    // player username the URL asked for (/player/<name>)
  var settleUntil = 0;
  var lastPath = "";

  /* ---------- helpers ---------- */
  function slugify(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function loggedIn() {
    var auth = document.getElementById("authView");
    return !(auth && auth.classList.contains("active"));
  }

  // The category a project page belongs to ("launcher" shows under fearlauncher).
  function pageOf(cat) { return cat === "launcher" ? "fearlauncher" : cat; }

  function openProjectNow() {
    return window.FearLauncherProject && window.FearLauncherProject.current
      ? window.FearLauncherProject.current() : null;
  }

  function onProjectPage() {
    var pp = document.getElementById("project-page");
    return !!(pp && pp.classList.contains("active"));
  }

  function currentSection() {
    // A full project page still belongs to its category, so the URL keeps
    // /plugins/Some-Project and the "insist on the link" logic stays happy.
    if (onProjectPage()) {
      var proj = openProjectNow();
      if (proj && proj.category) return pageOf(proj.category);
    }
    var s = document.querySelector(".section.active");
    if (s && s.id && PAGES[s.id]) return s.id;
    var a = document.querySelector(".nav-item[data-section].active");
    if (a && PAGES[a.getAttribute("data-section")]) return a.getAttribute("data-section");
    return "";
  }

  function highlight(id) {
    var a = document.querySelector('.nav-item[data-section="' + id + '"]');
    if (!a) return;
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (i) { i.classList.remove("active"); });
    a.classList.add("active");
  }

  function show(id) {
    if (typeof window.showSection === "function") window.showSection(id);
    highlight(id);
  }

  /* ---------- read the URL (path, or an old #hash) ---------- */
  function readUrl() {
    var h = String(location.hash || "").replace(/^#\/?/, "");
    if (h && PAGES[h]) return { page: h, project: null, player: null };   // legacy #plugins

    var parts = String(location.pathname || "/").split("/").filter(Boolean);
    if (!parts.length) return { page: null, project: null, player: null };
    // /player/<name> -> the Player Lookup page, showing that player
    if (parts[0] === "player" && parts[1]) {
      return { page: "player-lookup", project: null, player: decodeURIComponent(parts[1]).replace(/[^A-Za-z0-9_]/g, "") };
    }
    if (!PAGES[parts[0]]) return { page: null, project: null, player: null };
    // slugify so /plugins/Cyclone-Fury and /plugins/cyclone-fury both work
    return { page: parts[0], project: parts[1] ? slugify(decodeURIComponent(parts[1])) : null, player: null };
  }

  /* ---------- open a project by its slug ---------- */
  var projectTries = 0;
  function openProject(section, slug) {
    if (projectTries > 6) return;
    projectTries++;
    if (!(window.FearLauncherStore && window.FearLauncherStore.open)) return;

    fetch("/api/assets?category=" + encodeURIComponent(categoryFor(section)))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var list = (d && d.assets) || [];
        var hit = null;
        for (var i = 0; i < list.length; i++) {
          if (slugify(list[i].name) === slug) { hit = list[i]; break; }
        }
        if (hit) {
          wantProject = null;
          if (window.FearLauncherProject) window.FearLauncherProject.open(hit);
          else if (window.FearLauncherStore) window.FearLauncherStore.open(hit);
        } else if (projectTries <= 6) {
          setTimeout(function () { openProject(section, slug); }, 900);   // the list may still be loading
        }
      })
      .catch(function () {});
  }

  /* ---------- open the page named in the URL ---------- */
  function tryApply() {
    if (!wantPage) return;
    if (!loggedIn()) return;                        // wait until after login
    if (currentSection() !== wantPage) {
      if (Date.now() > settleUntil) { wantPage = null; wantProject = null; return; }
      show(wantPage);
      return;
    }
    // the page is right — now open the project / player, if one was named
    if (wantProject) { openProject(wantPage, wantProject); return; }
    if (wantPlayer) {
      var pl = window.FearLauncherPlayerLookup;
      if (pl && typeof pl.open === "function") {
        var name = wantPlayer;
        wantPlayer = null;
        wantPage = null;
        pl.open(name);
        return;
      }
      return;   // wait for player-lookup.js to load
    }
    wantPage = null;
  }

  /* ---------- keep the URL in step with the page ---------- */
  function currentPath() {
    if (onProjectPage()) {
      var proj = openProjectNow();
      if (proj && proj.name) return "/" + pageOf(proj.category) + "/" + slugify(proj.name);
    }
    var sec = currentSection();
    if (!sec) return "";
    if (sec === "player-lookup") {
      var pl = window.FearLauncherPlayerLookup && window.FearLauncherPlayerLookup.current;
      if (pl) return "/player/" + encodeURIComponent(pl);
      return "/player-lookup";
    }
    var cur = window.FearLauncherStore && window.FearLauncherStore.current;
    var openOnThisPage = cur && document.getElementById("mrOverlay") && slugify(cur.category) === slugify(categoryFor(sec));
    return "/" + sec + (openOnThisPage ? "/" + slugify(cur.name) : "");
  }

  function syncPath() {
    if (wantPage) return;                          // still honouring a link
    var p = currentPath();
    if (!p || p === lastPath) return;
    lastPath = p;
    if (location.pathname === p) return;
    try {
      history.pushState(null, "", p);              // no reload -> ads survive
    } catch (e) {
      try { location.hash = p.slice(1); } catch (e2) {}
    }
  }

  /* ---------- copy the current link ---------- */
  function pageUrl() {
    var p = currentPath();
    return location.origin + (p || "/");
  }

  function toast(text) {
    var t = document.getElementById("flShareToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "flShareToast";
      t.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:10095;" +
        "background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font:600 13px system-ui,sans-serif;" +
        "padding:11px 18px;border-radius:12px;box-shadow:0 14px 36px rgba(0,0,0,.6);opacity:0;transition:opacity .2s;" +
        "max-width:90vw;word-break:break-all;text-align:center";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.style.opacity = "1";
    clearTimeout(t.__hide);
    t.__hide = setTimeout(function () { t.style.opacity = "0"; }, 2000);
  }

  function legacyCopy(url) {
    try {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, url.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyLink() {
    var url = pageUrl();
    function ok() { toast("🔗 Link copied — paste it anywhere!"); }
    function fallback() { if (legacyCopy(url)) ok(); else toast(url); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok).catch(fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  /* ---------- the button in the top bar ---------- */
  function injectButton() {
    if (document.getElementById(BTN_ID)) return;
    if (!loggedIn()) return;
    var bar = document.querySelector(".top-bar");
    if (!bar) return;

    var b = document.createElement("button");
    b.id = BTN_ID;
    b.type = "button";
    b.title = "Copy a link to this page";
    b.setAttribute("aria-label", "Copy a link to this page");
    b.innerHTML = '<i class="fas fa-link"></i><span>Copy link</span>';
    b.style.cssText = "display:inline-flex;align-items:center;justify-content:center;gap:7px;" +
      "width:auto;padding:10px 14px;border-radius:12px;border:1px solid var(--border-color);" +
      "background:rgba(255,255,255,.05);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer";
    b.addEventListener("click", copyLink);

    var coin = bar.querySelector(".coin-display");
    if (coin && coin.parentNode === bar) bar.insertBefore(b, coin);
    else bar.appendChild(b);
  }

  /* ---------- boot ---------- */
  function readAndSet() {
    var u = readUrl();
    if (u.page) {
      wantPage = u.page;
      wantProject = u.project || null;
      wantPlayer = u.player || null;
      projectTries = 0;
      settleUntil = Date.now() + SETTLE_MS;
    }
  }

  function boot() {
    readAndSet();
    injectButton();
    tryApply();
    syncPath();
  }

  window.addEventListener("popstate", function () { readAndSet(); tryApply(); });
  window.addEventListener("hashchange", function () {
    var h = String(location.hash || "").replace(/^#\/?/, "");
    if (h && PAGES[h] && h !== currentSection()) { wantPage = h; wantProject = null; settleUntil = Date.now() + SETTLE_MS; }
    tryApply();
  });

  // If the player taps a sidebar item themselves, stop insisting on the link.
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest(".nav-item[data-section]")) { wantPage = null; wantProject = null; wantPlayer = null; }
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    injectButton();
    tryApply();
    syncPath();
    if (tries > 25) clearInterval(timer);
  }, 700);

  window.FearLauncherLinks = {
    copy: copyLink,
    url: pageUrl,
    open: function (path) {
      try { history.pushState(null, "", path); } catch (e) {}
      readAndSet();
      tryApply();
    }
  };
})();
