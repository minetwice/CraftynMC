/* CraftynMC — pixel loader (Phase 2)
 * ------------------------------------------------------------------
 * A crimson pixel monster builds itself on first paint, then dissolves and
 * gets out of the way. Pure injection: no markup changes, no data touched.
 *
 * Safety: it removes itself no matter what, and never shows twice.
 */
(function () {
  "use strict";
  if (window.__flPixelLoader) return;
  window.__flPixelLoader = true;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var COLS = 14, ROWS = 9;
  var MONSTER = [
    "..............",
    ".##........##.",
    "####......####",
    "#####....#####",
    ".####....####.",
    "..##......##..",
    ".+#+#+#+#+#+#.",
    "#+#+#+#+#+#+#+",
    ".+#+#+#+#+#+#."
  ];

  function build() {
    if (document.getElementById("flPxLoader")) return;

    var st = document.createElement("style");
    st.id = "flPxLoaderCss";
    st.textContent =
      "#flPxLoader{position:fixed;inset:0;z-index:99999;background:#07080c;display:grid;place-items:center;" +
        "transition:opacity .45s ease}" +
      "#flPxLoader.gone{opacity:0;pointer-events:none}" +
      "#flPxGrid{display:grid;grid-template-columns:repeat(" + COLS + ",1fr);gap:5px;" +
        "width:min(300px,62vw);aspect-ratio:14/9}" +
      "#flPxGrid i{display:block;border-radius:2px;background:rgba(255,255,255,.05);" +
        "transform:scale(.7);opacity:0;animation:flPxIn .34s cubic-bezier(.2,.8,.2,1) forwards}" +
      "#flPxGrid i.lit{background:linear-gradient(140deg,#ff2d63,#a8002e);" +
        "box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}" +
      "#flPxGrid i.dim{background:rgba(255,92,134,.22);box-shadow:inset 0 0 0 1px rgba(255,92,134,.2)}" +
      "#flPxGrid i.out{animation:flPxOut .3s ease forwards}" +
      "#flPxBrand{position:absolute;bottom:12%;left:50%;transform:translateX(-50%);" +
        "font:500 10px/1 ui-monospace,monospace;letter-spacing:.34em;text-transform:uppercase;" +
        "color:#6a7182;opacity:0;animation:flPxBrand .5s .5s forwards}" +
      "@keyframes flPxIn{to{transform:scale(1);opacity:1}}" +
      "@keyframes flPxOut{to{transform:scale(.4);opacity:0}}" +
      "@keyframes flPxBrand{to{opacity:1}}";
    document.head.appendChild(st);

    var wrap = document.createElement("div");
    wrap.id = "flPxLoader";
    wrap.setAttribute("aria-hidden", "true");
    var grid = document.createElement("div");
    grid.id = "flPxGrid";
    var brand = document.createElement("div");
    brand.id = "flPxBrand";
    brand.textContent = "CraftynMC";
    wrap.appendChild(grid);
    wrap.appendChild(brand);
    document.body.appendChild(wrap);

    var cells = [], lit = [], dim = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var el = document.createElement("i");
        el.style.animationDelay = (c * 18 + r * 14) + "ms";
        grid.appendChild(el);
        var idx = cells.push(el) - 1;
        var ch = (MONSTER[r] || "")[c] || ".";
        if (ch === "#") lit.push({ i: idx, c: c, r: r });
        else if (ch === "+") dim.push({ i: idx, c: c, r: r });
      }
    }
    lit.sort(function (a, b) { return (a.c - b.c) || (a.r - b.r); });
    lit.forEach(function (o, n) { setTimeout(function () { cells[o.i].classList.add("lit"); }, 260 + n * 26); });
    dim.sort(function (a, b) { return (a.c - b.c) || (a.r - b.r); });
    dim.forEach(function (o, n) { setTimeout(function () { cells[o.i].classList.add("dim"); }, 420 + n * 16); });

    setTimeout(function () {
      for (var cc = 0; cc < COLS; cc++) {
        for (var rr = 0; rr < ROWS; rr++) {
          (function (cell, delay) {
            setTimeout(function () { if (cell) cell.classList.add("out"); }, delay);
          })(cells[rr * COLS + cc], cc * 14 + rr * 3);
        }
      }
      setTimeout(function () {
        wrap.classList.add("gone");
        setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 500);
      }, 460);
    }, 1250);
  }

  // the loader must never trap the page
  setTimeout(function () {
    var w = document.getElementById("flPxLoader");
    if (w && w.parentNode) w.parentNode.removeChild(w);
  }, 4200);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
