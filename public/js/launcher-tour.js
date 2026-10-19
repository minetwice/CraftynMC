/* CraftynMC / FearLauncher — "How to download the launcher" guided tour
 * ------------------------------------------------------------------
 * 1) The first time a player lands on the main dashboard, a popup asks
 *    "How to download the launcher?"  ->  Yes / No / Skip
 * 2) Yes starts a spotlight walkthrough that dims the page, rings the exact
 *    element to click, and tells them what to do. It advances when they
 *    actually click it (or with the Next button).
 *
 * Nothing here depends on the page's internals — it only reads the DOM, so
 * it keeps working if the layout changes.
 */
(function () {
  "use strict";

  var KEY = "flLauncherTour";          // "done" | "skipped"
  var NAV = '.nav-item[data-section="fearlauncher"]';
  var CARD = '#fearlauncherContainer .mr-card';
  var DL = ".mr-download-btn";

  var steps = [
    {
      sel: NAV,
      title: "Step 1 of 3 — Open the launcher page",
      text: "In the sidebar, click <b>FearLauncher Client</b>. That is where you download the launcher.",
      clickAdvance: true,
      place: "right"
    },
    {
      sel: CARD,
      title: "Step 2 of 3 — Open the launcher project",
      text: "Click the <b>FearLauncher Client</b> card to open it.",
      clickAdvance: true,
      place: "bottom"
    },
    {
      sel: DL,
      title: "Step 3 of 3 — Hit Download",
      text: "Now click <b>Download</b>. The installer will be saved to your device.",
      clickAdvance: true,
      place: "top"
    },
    {
      sel: null,
      title: "You're all set! 🎉",
      text: "Run the installer, log in with your <b>CraftynMC account</b>, and press <b>Play</b>. To do this again later, open <b>FearLauncher Client</b> from the sidebar.",
      final: true
    }
  ];

  var idx = 0;
  var spot = null;
  var tip = null;
  var current = null;

  var CSS = [
    ".flt-spot{position:fixed;z-index:10080;pointer-events:none;border-radius:14px;border:2px solid #ff0048;box-shadow:0 0 0 9999px rgba(4,5,10,.82),0 0 30px rgba(255,0,72,.55);transition:all .22s ease}",
    ".flt-tip{position:fixed;z-index:10081;width:min(340px,86vw);background:#12141c;border:1px solid var(--border-hover);border-radius:16px;padding:16px 18px;box-shadow:0 24px 60px rgba(0,0,0,.75)}",
    ".flt-tip h4{margin:0 0 6px;font-family:'Outfit',sans-serif;font-size:15px;color:#fff}",
    ".flt-tip p{margin:0;font-size:13px;line-height:1.6;color:#cfd0d8}",
    ".flt-tip b{color:#fff}",
    ".flt-row{display:flex;align-items:center;gap:8px;margin-top:14px}",
    ".flt-btn{padding:10px 16px;border:none;border-radius:11px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}",
    ".flt-ghost{background:transparent;color:var(--text-secondary);border:1px solid var(--border-color)}",
    ".flt-dots{margin-left:auto;display:flex;gap:5px}",
    ".flt-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.2)}",
    ".flt-dot.on{background:#ff0048}",
    ".flt-ask{position:fixed;inset:0;background:rgba(4,5,10,.9);z-index:10090;display:flex;align-items:center;justify-content:center;padding:20px}",
    ".flt-ask-card{background:#12141c;border:1px solid var(--border-hover);border-radius:20px;width:min(430px,100%);padding:26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.85)}",
    ".flt-ask-card h3{margin:0 0 8px;font-family:'Outfit',sans-serif;color:#fff;font-size:19px}",
    ".flt-ask-card p{margin:0 0 18px;font-size:13px;color:var(--text-secondary);line-height:1.6}",
    ".flt-ask-icon{font-size:38px;color:#ff0048;margin-bottom:10px}",
    ".flt-ask-row{display:flex;gap:10px}",
    ".flt-ask-row button{flex:1;padding:13px;border-radius:13px;border:none;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}",
    ".flt-yes{background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff}",
    ".flt-no{background:rgba(255,255,255,.07);color:#fff}",
    ".flt-skip{display:block;margin:14px auto 0;background:none;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;font-family:inherit;text-decoration:underline}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("fltStyles")) return;
    var st = document.createElement("style");
    st.id = "fltStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function clearTour() {
    if (spot && spot.parentNode) spot.parentNode.removeChild(spot);
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    spot = null;
    tip = null;
    current = null;
  }

  function waitFor(sel, timeout, cb) {
    var started = Date.now();
    (function poll() {
      var el = document.querySelector(sel);
      if (el && el.getBoundingClientRect().width > 0) return cb(el);
      if (Date.now() - started > timeout) return cb(null);
      setTimeout(poll, 250);
    })();
  }

  function position() {
    if (!current || !spot || !tip) return;
    var r = current.getBoundingClientRect();
    var pad = 6;
    spot.style.left = (r.left - pad) + "px";
    spot.style.top = (r.top - pad) + "px";
    spot.style.width = (r.width + pad * 2) + "px";
    spot.style.height = (r.height + pad * 2) + "px";

    var tw = tip.offsetWidth || 340;
    var th = tip.offsetHeight || 160;
    var vw = window.innerWidth, vh = window.innerHeight;
    var left, top;
    var place = (steps[idx] && steps[idx].place) || "bottom";

    if (place === "right") { left = r.right + 18; top = r.top; }
    else if (place === "top") { left = r.left; top = r.top - th - 18; }
    else { left = r.left; top = r.bottom + 18; }

    if (left + tw > vw - 12) left = vw - tw - 12;
    if (left < 12) left = 12;
    if (top + th > vh - 12) top = Math.max(12, r.top - th - 18);
    if (top < 12) top = 12;

    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function dots() {
    var out = "";
    for (var i = 0; i < steps.length; i++) out += '<span class="flt-dot' + (i === idx ? " on" : "") + '"></span>';
    return out;
  }

  function next() {
    idx++;
    clearTour();
    runStep();
  }

  function buildTip(st, el) {
    tip = document.createElement("div");
    tip.className = "flt-tip";
    tip.innerHTML =
      "<h4>" + st.title + "</h4>" +
      "<p>" + st.text + "</p>" +
      '<div class="flt-row">' +
        (st.clickAdvance ? '<button type="button" class="flt-btn" id="fltNext">Next</button>' : '<button type="button" class="flt-btn" id="fltDone">Got it</button>') +
        '<button type="button" class="flt-btn flt-ghost" id="fltEnd">Skip tour</button>' +
        '<span class="flt-dots">' + dots() + "</span>" +
      "</div>";
    document.body.appendChild(tip);

    var nx = tip.querySelector("#fltNext");
    if (nx) nx.addEventListener("click", next);
    var dn = tip.querySelector("#fltDone");
    if (dn) dn.addEventListener("click", finish);
    var en = tip.querySelector("#fltEnd");
    if (en) en.addEventListener("click", function () { localStorage.setItem(KEY, "done"); clearTour(); });

    if (st.clickAdvance && el) {
      el.addEventListener("click", function once() {
        el.removeEventListener("click", once, true);
        setTimeout(next, 450);   // let the page react first
      }, true);
    }
  }

  function showCenter(st) {
    clearTour();
    tip = document.createElement("div");
    tip.className = "flt-tip";
    tip.style.left = "50%";
    tip.style.top = "50%";
    tip.style.transform = "translate(-50%,-50%)";
    tip.innerHTML =
      "<h4>" + st.title + "</h4><p>" + st.text + "</p>" +
      '<div class="flt-row"><button type="button" class="flt-btn" id="fltDone">Got it</button></div>';
    document.body.appendChild(tip);
    tip.querySelector("#fltDone").addEventListener("click", finish);
  }

  function finish() {
    localStorage.setItem(KEY, "done");
    clearTour();
  }

  function runStep() {
    var st = steps[idx];
    if (!st) return finish();
    if (!st.sel) return showCenter(st);

    waitFor(st.sel, 5000, function (el) {
      if (!el) { idx++; return runStep(); }   // target missing -> move on
      try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
      setTimeout(function () {
        current = el;
        spot = document.createElement("div");
        spot.className = "flt-spot";
        document.body.appendChild(spot);
        buildTip(st, el);
        position();
        setTimeout(position, 350);   // after the smooth scroll settles
      }, 300);
    });
  }

  function start() {
    injectStyles();
    idx = 0;
    runStep();
  }

  function ask() {
    if (localStorage.getItem(KEY)) return;   // already done / skipped
    if (document.getElementById("fltAsk")) return;
    injectStyles();

    var ov = document.createElement("div");
    ov.className = "flt-ask";
    ov.id = "fltAsk";
    ov.innerHTML =
      '<div class="flt-ask-card">' +
        '<div class="flt-ask-icon"><i class="fas fa-rocket"></i></div>' +
        "<h3>How to download the launcher?</h3>" +
        "<p>Want a quick 20-second guide that shows you exactly where to click?</p>" +
        '<div class="flt-ask-row">' +
          '<button type="button" class="flt-yes" id="fltYes"><i class="fas fa-check"></i> Yes, show me</button>' +
          '<button type="button" class="flt-no" id="fltNo">No</button>' +
        "</div>" +
        '<button type="button" class="flt-skip" id="fltSkip">Skip — don\'t ask again</button>' +
      "</div>";
    document.body.appendChild(ov);

    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.querySelector("#fltYes").addEventListener("click", function () { close(); start(); });
    ov.querySelector("#fltNo").addEventListener("click", close);   // asked again next visit
    ov.querySelector("#fltSkip").addEventListener("click", function () { localStorage.setItem(KEY, "skipped"); close(); });
  }

  // Show the popup once the MAIN DASHBOARD is on screen (i.e. after login).
  function watch() {
    var dash = document.getElementById("dashboard");
    if (dash && dash.classList.contains("active")) {
      if (!window.__fltAsked) { window.__fltAsked = true; setTimeout(ask, 1400); }
    } else {
      window.__fltAsked = false;
    }
  }

  window.addEventListener("scroll", position, true);
  window.addEventListener("resize", position);
  window.FearLauncherTour = { start: start, ask: ask };

  function init() {
    watch();
    setInterval(watch, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
