/* CraftynMC / FearLauncher — Site banner placements + rotation
 * ------------------------------------------------------------------
 * Places the display units GLOBALLY, so they show on every page/section
 * (dashboard, mods, plugins, resources, shaders, skins, capes, shop,
 * rewards, achievements, admin pages...), not just the Dashboard:
 *
 *   - a 728x90 leaderboard right below the top bar (hidden on narrow
 *     screens where it would not fit)
 *   - a native banner block at the end of the main content
 *
 * ROTATION
 *   Each pool below can hold several unit keys of the SAME size.
 *   - On every page load, one key is picked at random.
 *   - If a pool has MORE THAN ONE key, the slot also swaps to a different
 *     one every ROTATE_MS while the visitor stays on the page.
 *   To get variety, create 2-3 units of the same size in Adsterra and add
 *   their keys to the matching pool. With a single key there is nothing to
 *   rotate, so you will keep seeing the same campaign.
 *
 * (The popunder and the Social Bar are injected inline in the served
 * HTML by src/index.js, so they are not handled here.)
 */
(function () {
  "use strict";

  // ---- config -------------------------------------------------------
  // 728x90 units — add more keys (same size) for variety:
  var LEADERBOARD_POOL = [
    "c844f1c2d7fff773c672de46429ab900"
  ];
  // Native banner units — add more keys for variety:
  var NATIVE_POOL = [
    "b7d2a30aebdc4de83b457d2055d399a3"
  ];

  var LEADERBOARD_SIZE = { width: 728, height: 90 };

  // Re-load a different unit every this many ms (only when a pool has 2+ keys).
  // Never set this below 30000: ad networks treat very fast reloads as invalid.
  var ROTATE_MS = 60000;

  var IFRAME_BASE = "https://www.highrevenueformat.com/";
  var NATIVE_BASE = "https://pl30828915.profitableratecpmnetwork.com/";

  // ---- styles -------------------------------------------------------
  function injectStyles() {
    if (document.getElementById("flBannerStyles")) return;
    var st = document.createElement("style");
    st.id = "flBannerStyles";
    st.textContent = [
      ".fl-banner{display:flex;flex-direction:column;align-items:center;justify-content:center;margin:18px auto;padding:10px;border:1px solid var(--border-color);border-radius:16px;background:rgba(10,12,18,.5);overflow:hidden;max-width:100%}",
      ".fl-banner-inner{display:flex;align-items:center;justify-content:center;width:100%}",
      ".fl-banner-label{display:block;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--text-secondary);opacity:.55;text-align:center;margin-bottom:6px}",
      "@media (max-width:767px){.fl-banner[data-kind=\"leaderboard\"]{display:none}}"
    ].join("");
    document.head.appendChild(st);
  }

  // ---- ad rendering -------------------------------------------------
  function pick(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderInner(inner, type, key, size) {
    inner.innerHTML = "";
    var container = document.createElement("div");
    container.id = "container-" + key;
    inner.appendChild(container);

    if (type === "iframe") {
      try {
        window.atOptions = {
          key: key,
          format: "iframe",
          height: (size && size.height) || 90,
          width: (size && size.width) || 728,
          params: {}
        };
      } catch (e) {}
      var s = document.createElement("script");
      s.async = true;
      s.setAttribute("data-cfasync", "false");
      s.src = IFRAME_BASE + key + "/invoke.js";
      inner.appendChild(s);
    } else {
      var n = document.createElement("script");
      n.async = true;
      n.setAttribute("data-cfasync", "false");
      n.src = NATIVE_BASE + key + "/invoke.js";
      inner.appendChild(n);
    }
  }

  function build(type, key, size) {
    var wrap = document.createElement("div");
    wrap.className = "fl-banner";

    var label = document.createElement("span");
    label.className = "fl-banner-label";
    label.textContent = "Advertisement";
    wrap.appendChild(label);

    var inner = document.createElement("div");
    inner.className = "fl-banner-inner";
    wrap.appendChild(inner);

    renderInner(inner, type, key, size);
    return wrap;
  }

  function startRotation(inner, pool, type, size) {
    if (!ROTATE_MS || pool.length < 2) return;
    setInterval(function () {
      if (document.hidden) return;               // don't reload in a hidden tab
      renderInner(inner, type, pick(pool), size);
    }, ROTATE_MS);
  }

  function mainEl() {
    return document.querySelector("main.main-content") || document.querySelector("main");
  }

  function place() {
    var main = mainEl();
    if (!main) return;

    // 728x90 leaderboard: right below the top bar (visible on every section).
    if (!document.getElementById("flLeaderboard") && LEADERBOARD_POOL.length) {
      var lb = build("iframe", pick(LEADERBOARD_POOL), LEADERBOARD_SIZE);
      lb.id = "flLeaderboard";
      lb.setAttribute("data-kind", "leaderboard");
      var tb = main.querySelector(".top-bar");
      if (tb && tb.parentNode === main && tb.nextSibling) main.insertBefore(lb, tb.nextSibling);
      else if (tb && tb.parentNode === main) main.appendChild(lb);
      else main.insertBefore(lb, main.firstChild);
      startRotation(lb.querySelector(".fl-banner-inner"), LEADERBOARD_POOL, "iframe", LEADERBOARD_SIZE);
    }

    // Native banner: at the end of the main content (after the active section).
    if (!document.getElementById("flNativeBlock") && NATIVE_POOL.length) {
      var nb = build("native", pick(NATIVE_POOL), {});
      nb.id = "flNativeBlock";
      nb.setAttribute("data-kind", "native");
      main.appendChild(nb);
      startRotation(nb.querySelector(".fl-banner-inner"), NATIVE_POOL, "native", {});
    }
  }

  function init() {
    injectStyles();
    place();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
