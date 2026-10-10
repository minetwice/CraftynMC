/* CraftynMC / FearLauncher — Site banner placements
 * ------------------------------------------------------------------
 * Places the display units GLOBALLY, so they show on every page/section
 * (dashboard, mods, plugins, resources, shaders, skins, capes, shop,
 * rewards, achievements, admin pages...), not just the Dashboard:
 *
 *   - a 728x90 leaderboard right below the top bar (hidden on narrow
 *     screens where it would not fit)
 *   - a native banner block at the end of the main content
 *
 * (The popunder and the Social Bar are injected inline in the served
 * HTML by src/index.js, so they are not handled here.)
 */
(function () {
  "use strict";

  var LEADERBOARD = { type: "iframe", key: "c844f1c2d7fff773c672de46429ab900", width: 728, height: 90 };
  var NATIVE = { type: "native", key: "b7d2a30aebdc4de83b457d2055d399a3" };

  var IFRAME_BASE = "https://www.highrevenueformat.com/";
  var NATIVE_BASE = "https://pl30828915.profitableratecpmnetwork.com/";

  function injectStyles() {
    if (document.getElementById("flBannerStyles")) return;
    var st = document.createElement("style");
    st.id = "flBannerStyles";
    st.textContent = [
      ".fl-banner{display:flex;align-items:center;justify-content:center;margin:18px auto;padding:10px;border:1px solid var(--border-color);border-radius:16px;background:rgba(10,12,18,.5);overflow:hidden;max-width:100%}",
      ".fl-banner-label{display:block;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--text-secondary);opacity:.55;text-align:center;margin-bottom:6px}",
      "@media (max-width:767px){.fl-banner[data-kind=\"leaderboard\"]{display:none}}"
    ].join("");
    document.head.appendChild(st);
  }

  function makeAd(unit) {
    var wrap = document.createElement("div");
    wrap.className = "fl-banner";

    var label = document.createElement("span");
    label.className = "fl-banner-label";
    label.textContent = "Advertisement";
    wrap.appendChild(label);

    var inner = document.createElement("div");
    inner.style.display = "flex";
    inner.style.alignItems = "center";
    inner.style.justifyContent = "center";
    wrap.appendChild(inner);

    var container = document.createElement("div");
    container.id = "container-" + unit.key;
    inner.appendChild(container);

    if (unit.type === "iframe") {
      try {
        window.atOptions = {
          key: unit.key,
          format: "iframe",
          height: unit.height || 90,
          width: unit.width || 728,
          params: {}
        };
      } catch (e) {}
      var s = document.createElement("script");
      s.async = true;
      s.setAttribute("data-cfasync", "false");
      s.src = IFRAME_BASE + unit.key + "/invoke.js";
      inner.appendChild(s);
    } else {
      var n = document.createElement("script");
      n.async = true;
      n.setAttribute("data-cfasync", "false");
      n.src = NATIVE_BASE + unit.key + "/invoke.js";
      inner.appendChild(n);
    }
    return wrap;
  }

  function mainEl() {
    return document.querySelector("main.main-content") || document.querySelector("main");
  }

  function place() {
    var main = mainEl();
    if (!main) return;

    // 728x90 leaderboard: right below the top bar (visible on every section).
    if (!document.getElementById("flLeaderboard")) {
      var lb = makeAd(LEADERBOARD);
      lb.id = "flLeaderboard";
      lb.setAttribute("data-kind", "leaderboard");
      var tb = main.querySelector(".top-bar");
      if (tb && tb.parentNode === main && tb.nextSibling) main.insertBefore(lb, tb.nextSibling);
      else if (tb && tb.parentNode === main) main.appendChild(lb);
      else main.insertBefore(lb, main.firstChild);
    }

    // Native banner: at the end of the main content (after the active section).
    if (!document.getElementById("flNativeBlock")) {
      var nb = makeAd(NATIVE);
      nb.id = "flNativeBlock";
      nb.setAttribute("data-kind", "native");
      main.appendChild(nb);
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
