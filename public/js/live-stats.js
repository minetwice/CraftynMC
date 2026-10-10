/* CraftynMC / FearLauncher — Live dashboard stats
 * ------------------------------------------------------------------
 * The page sets the dashboard counters (statMods / statResources /
 * statPlugins / statCosmetics) to RANDOM numbers. This script replaces
 * them with the REAL number of available assets per category, fetched
 * from GET /api/assets.
 *
 * It keeps them correct: a MutationObserver re-applies the real value
 * whenever the page writes a random one, plus a slow safety interval.
 */
(function () {
  "use strict";

  var MAP = {
    statMods: "mods",
    statResources: "resources",
    statPlugins: "plugins",
    statCosmetics: "cosmetics"
  };

  var counts = null;

  function apply() {
    if (!counts) return;
    Object.keys(MAP).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var want = String(counts[MAP[id]] || 0);
      if (el.textContent !== want) el.textContent = want;
    });
  }

  function load() {
    fetch("/api/assets", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var arr = (data && data.assets) || (Array.isArray(data) ? data : []);
        var c = { mods: 0, plugins: 0, resources: 0, shaders: 0, capes: 0, cosmetics: 0, launcher: 0 };
        for (var i = 0; i < arr.length; i++) {
          var a = arr[i];
          if (a && a.category && c[a.category] !== undefined) c[a.category]++;
        }
        counts = c;
        apply();
      })
      .catch(function () {});
  }

  function observe() {
    Object.keys(MAP).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.__flLiveStat) return;
      el.__flLiveStat = true;
      var cat = MAP[id];
      try {
        new MutationObserver(function () {
          if (!counts) return;
          var want = String(counts[cat] || 0);
          if (el.textContent !== want) el.textContent = want;
        }).observe(el, { childList: true, characterData: true, subtree: true });
      } catch (e) {}
    });
  }

  function init() {
    load();
    observe();
    setInterval(apply, 2000);   // safety net
    setInterval(load, 30000);   // keep counts fresh
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
