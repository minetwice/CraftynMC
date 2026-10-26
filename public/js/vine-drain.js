/* CraftynMC — vine + page-drain (Phase 2, final piece)
 * ------------------------------------------------------------------
 * 1. A red flower vine creeps in from the right edge, on every page.
 * 2. Changing section wipes left-to-right with pixels first, then reveals.
 *
 * Pure injection. index.html untouched, no data read or written.
 */
(function () {
  "use strict";
  if (window.__flVineDrain) return;
  window.__flVineDrain = true;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CSS = [
    /* ---------- vine ---------- */
    "#flVine{position:fixed;right:-6px;top:96px;width:min(52%,460px);height:420px;z-index:9000;",
      "pointer-events:none;opacity:0;contain:paint}",
    "#flVine svg{width:100%;height:100%;display:block;overflow:visible}",
    "#flVine .vp{fill:none;stroke:url(#flVineGrad);stroke-width:1.15;stroke-linecap:round;",
      "stroke-linejoin:round;stroke-dasharray:900;stroke-dashoffset:900;will-change:stroke-dashoffset}",
    "#flVine .vl{fill:rgba(255,30,92,.5);opacity:0}",
    "#flVine .vf{opacity:0;transform-box:fill-box;transform-origin:center}",
    "#flVine .vf circle.p{fill:#ff2d63}",
    "#flVine .vf circle.c{fill:#ffd44a}",
    "#flVine::before{content:\"\";position:absolute;right:-50px;top:-40px;width:130%;height:120%;",
      "background:radial-gradient(closest-side,rgba(255,30,92,.42),rgba(255,30,92,.16) 52%,transparent 78%),",
      "radial-gradient(closest-side,rgba(255,212,74,.14),transparent 70%);",
      "filter:blur(30px);z-index:-1;pointer-events:none}",
    "#flVine.run{animation:flVineShow .6s cubic-bezier(.22,1,.36,1) forwards}",
    "#flVine.run .vp{animation:flVineGrow 3.1s cubic-bezier(.38,0,.5,1) forwards}",
    "#flVine.run .vl{animation:flVineLeaf 1.2s cubic-bezier(.22,1,.36,1) forwards}",
    "#flVine.run .vf{animation:flVineBloom 1s cubic-bezier(.22,1,.36,1) forwards}",
    "#flVine.fade{animation:flVineFade 1s ease forwards}",
    "@keyframes flVineShow{from{opacity:0}to{opacity:1}}",
    "@keyframes flVineGrow{0%{stroke-dashoffset:900}100%{stroke-dashoffset:0}}",
    "@keyframes flVineLeaf{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}",
    "@keyframes flVineBloom{0%{opacity:0;transform:scale(.2) rotate(-40deg)}",
      "60%{opacity:1;transform:scale(1.15) rotate(6deg)}100%{opacity:1;transform:scale(1) rotate(0)}}",
    "@keyframes flVineFade{from{opacity:1}to{opacity:0}}",

    /* ---------- pixel drain ---------- */
    "#flDrain{position:fixed;inset:0;z-index:9998;pointer-events:none;display:none;",
      "grid-template-columns:repeat(22,1fr);grid-template-rows:repeat(12,1fr)}",
    "#flDrain.on{display:grid}",
    "#flDrain i{background:#07080c;transform:scaleY(0);transform-origin:top;display:block}",
    "#flDrain.filling i{animation:flWIn .26s ease forwards}",
    "#flDrain.draining i{transform:scaleY(1);animation:flWOut .3s ease forwards}",
    "@keyframes flWIn{to{transform:scaleY(1)}}",
    "@keyframes flWOut{from{transform:scaleY(1)}to{transform:scaleY(0)}}",

    "@media (prefers-reduced-motion:reduce){#flVine{display:none}#flDrain{display:none!important}}"
  ].join("");
  var st = document.createElement("style");
  st.id = "flVineDrainCss";
  st.textContent = CSS;
  document.head.appendChild(st);
  if (reduce) return;

  /* ---------------- the vine ---------------- */
  var T = [
    ["M356,150 C 300,120 286,170 236,158 S 168,120 132,74", [[300,132,-22,.5],[244,156,-34,.9],[176,116,-28,1.3]], [132,74,1.2]],
    ["M356,176 C 306,168 292,206 238,196 S 176,176 140,132", [[302,182,16,.7],[232,198,-8,1.1]], [140,132,1.4]],
    ["M356,204 C 300,196 296,150 246,132 S 200,86 166,54", [[298,168,-38,.6],[248,132,-50,1]], [166,54,1.3]],
    ["M356,232 C 300,232 268,246 214,240 S 156,232 118,196", [[262,246,6,.8],[180,232,-4,1.2]], null],
    ["M356,258 C 316,262 300,214 264,196 S 236,150 262,110", [[312,236,-28,.9],[266,178,-42,1.25]], [262,110,1.5]],
    ["M356,120 C 318,110 296,96 262,88 S 226,66 198,44", [[300,102,-30,1]], null]
  ];
  var body = "";
  T.forEach(function (t) {
    body += '<path class="vp" d="' + t[0] + '"/>';
    t[1].forEach(function (l) {
      body += '<ellipse class="vl" cx="' + l[0] + '" cy="' + l[1] + '" rx="7" ry="3.4" transform="rotate(' +
        l[2] + ' ' + l[0] + ' ' + l[1] + ')" style="animation-delay:' + l[3] + 's"/>';
    });
    if (t[2]) {
      var f = t[2];
      body += '<g class="vf" transform="translate(' + f[0] + ',' + f[1] + ')" style="animation-delay:' + f[2] + 's">' +
        '<circle class="p" cx="0" cy="-8" r="5.4"/><circle class="p" cx="7.6" cy="-2.6" r="5.4"/>' +
        '<circle class="p" cx="4.8" cy="6.5" r="5.4"/><circle class="p" cx="-4.8" cy="6.5" r="5.4"/>' +
        '<circle class="p" cx="-7.6" cy="-2.6" r="5.4"/><circle class="c" cx="0" cy="0" r="3.2"/></g>';
    }
  });

  var vine = document.createElement("div");
  vine.id = "flVine";
  vine.setAttribute("aria-hidden", "true");
  vine.innerHTML = '<svg viewBox="0 0 360 320" preserveAspectRatio="xMaxYMax meet"><defs>' +
    '<linearGradient id="flVineGrad" x1="1" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#ff1e5c"/><stop offset="55%" stop-color="#ff6f95"/>' +
    '<stop offset="100%" stop-color="#9d0030"/></linearGradient></defs>' + body + "</svg>";
  document.body.appendChild(vine);

  function creep() {
    vine.classList.remove("run", "fade");
    void vine.offsetWidth;
    vine.classList.add("run");
    setTimeout(function () { vine.classList.add("fade"); }, 5200);
  }
  setTimeout(creep, 2400);
  setInterval(creep, 11000);

  /* ---------------- the pixel drain ---------------- */
  var drain = document.createElement("div");
  drain.id = "flDrain";
  for (var r = 0; r < 12; r++) {
    for (var c = 0; c < 22; c++) {
      var cell = document.createElement("i");
      cell.style.animationDelay = (c * 13 + r * 3) + "ms";
      drain.appendChild(cell);
    }
  }
  document.body.appendChild(drain);

  var busy = false;
  function paint(cb) {
    if (busy) { cb(); return; }
    busy = true;
    drain.className = "on filling";
    setTimeout(function () {
      cb();
      drain.className = "on draining";
      setTimeout(function () { drain.className = ""; busy = false; }, 360);
    }, 300);
  }

  // wrap showSection so every page change gets the wipe
  var origShow = window.showSection;
  if (typeof origShow === "function" && !origShow.__flDrained) {
    var wrapped = function () {
      var args = arguments;
      paint(function () { origShow.apply(window, args); });
    };
    wrapped.__flDrained = true;
    window.showSection = wrapped;
  }
})();
