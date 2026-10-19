/* CraftynMC / FearLauncher — "How to download the launcher" guided tour
 * ------------------------------------------------------------------
 * 1) ALWAYS AVAILABLE: a permanent "How to Download" item in the sidebar
 *    starts the walkthrough whenever the player wants it.
 * 2) FIRST VISIT: the main dashboard also shows a one-time popup
 *    ("How to download the launcher?" -> Yes / No / Skip).
 *
 * The walkthrough dims the page, pulses a ring around the exact element to
 * click, and advances when the player actually clicks it (or with Next).
 * Back / Next / Skip, progress bar, Esc to close, and a "show me again"
 * at the end.
 */
(function () {
  "use strict";

  var KEY = "flLauncherTour";          // "done" | "skipped"
  var FAB_KEY = "flTourFab";           // "mini" once the player collapses the board
  var NAV_SEL = '.nav-item[data-section="fearlauncher"]';
  var FAB_ID = "flTourFab";
  var CARD = '#fearlauncherContainer .mr-card';
  var DL = ".mr-download-btn";

  var steps = [
    {
      sel: null,
      title: "👋 Welcome to CraftynMC",
      text: "Let's get the launcher on your device in a few quick steps. I'll highlight exactly what to click — follow the <b>red ring</b>.",
      next: "Let's go"
    },
    {
      sel: NAV_SEL,
      title: "Step 1 — Open the launcher page",
      text: "In the sidebar, click <b>FearLauncher Client</b>. This is where you download the launcher.",
      clickAdvance: true,
      place: "right"
    },
    {
      sel: CARD,
      title: "Step 2 — Open the launcher",
      text: "Click the <b>FearLauncher Client</b> card to open its page.",
      clickAdvance: true,
      place: "bottom"
    },
    {
      sel: DL,
      title: "Step 3 — Hit Download",
      text: "Now click <b>Download</b>. The installer will be saved to your device.",
      clickAdvance: true,
      place: "top"
    },
    {
      sel: null,
      title: "🎉 You're all set!",
      text: "Run the installer, log in with your <b>CraftynMC account</b>, and press <b>Play</b>.<br><br>Need this again? Click <b>How to Download</b> in the sidebar anytime.",
      final: true
    }
  ];

  var idx = 0;
  var spot = null;
  var tip = null;
  var current = null;
  var advanceEl = null;
  var advanceFn = null;

  var CSS = [
    ".flt-spot{position:fixed;z-index:10080;pointer-events:none;border-radius:16px;border:2px solid #ff0048;box-shadow:0 0 0 9999px rgba(4,5,10,.84),0 0 34px rgba(255,0,72,.6);transition:left .22s ease,top .22s ease,width .22s ease,height .22s ease;animation:fltPulse 1.6s ease-in-out infinite}",
    "@keyframes fltPulse{0%,100%{box-shadow:0 0 0 9999px rgba(4,5,10,.84),0 0 26px rgba(255,0,72,.45)}50%{box-shadow:0 0 0 9999px rgba(4,5,10,.84),0 0 44px rgba(255,0,72,.85)}}",
    ".flt-tip{position:fixed;z-index:10081;width:min(360px,88vw);background:linear-gradient(180deg,#161923,#101219);border:1px solid rgba(255,0,72,.35);border-radius:18px;padding:18px;box-shadow:0 26px 70px rgba(0,0,0,.8)}",
    ".flt-tip h4{margin:0 0 8px;font-family:'Outfit',sans-serif;font-size:16px;color:#fff}",
    ".flt-tip p{margin:0;font-size:13.5px;line-height:1.65;color:#c9cbd6}",
    ".flt-tip b{color:#fff}",
    ".flt-bar{height:4px;border-radius:4px;background:rgba(255,255,255,.09);overflow:hidden;margin:0 0 12px}",
    ".flt-bar>i{display:block;height:100%;background:linear-gradient(90deg,#ff0048,#ff7a9c);transition:width .3s ease}",
    ".flt-row{display:flex;align-items:center;gap:8px;margin-top:16px}",
    ".flt-btn{padding:10px 16px;border:none;border-radius:11px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}",
    ".flt-btn:hover{filter:brightness(1.12)}",
    ".flt-ghost{background:rgba(255,255,255,.06);color:#e8e8ee;border:1px solid var(--border-color)}",
    ".flt-skip{margin-left:auto;background:none;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;font-family:inherit}",
    ".flt-count{font-size:11px;color:var(--text-secondary);letter-spacing:.4px;margin-bottom:6px;text-transform:uppercase}",
    ".flt-hint{margin-top:10px;font-size:11.5px;color:#8b8ea0;display:flex;align-items:center;gap:6px}",
    ".flt-ask{position:fixed;inset:0;background:rgba(4,5,10,.9);z-index:10090;display:flex;align-items:center;justify-content:center;padding:20px}",
    ".flt-ask-card{background:linear-gradient(180deg,#161923,#101219);border:1px solid rgba(255,0,72,.35);border-radius:22px;width:min(440px,100%);padding:28px;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.85)}",
    ".flt-ask-card h3{margin:0 0 8px;font-family:'Outfit',sans-serif;color:#fff;font-size:20px}",
    ".flt-ask-card p{margin:0 0 20px;font-size:13.5px;color:var(--text-secondary);line-height:1.65}",
    ".flt-ask-icon{font-size:40px;margin-bottom:12px;filter:drop-shadow(0 0 18px rgba(255,0,72,.5))}",
    ".flt-ask-row{display:flex;gap:10px}",
    ".flt-ask-row button{flex:1;padding:14px;border-radius:13px;border:none;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}",
    ".flt-yes{background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff}",
    ".flt-no{background:rgba(255,255,255,.07);color:#fff}",
    ".flt-skipall{display:block;margin:16px auto 0;background:none;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;font-family:inherit;text-decoration:underline}",
    ".flt-fab{position:fixed;left:16px;bottom:100px;z-index:10070}",
    ".flt-fab-card{position:relative;width:248px;background:linear-gradient(180deg,#161923,#101219);border:1px solid rgba(255,0,72,.4);border-radius:18px;padding:16px 16px 14px;box-shadow:0 22px 55px rgba(0,0,0,.7);animation:fltPop .5s cubic-bezier(.2,1.5,.4,1)}",
    "@keyframes fltPop{0%{transform:scale(.6) translateY(26px);opacity:0}60%{transform:scale(1.03) translateY(0);opacity:1}100%{transform:scale(1) translateY(0)}}",
    ".flt-fab-icon{font-size:24px;margin-bottom:6px}",
    ".flt-fab-title{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#fff;line-height:1.35;margin-bottom:4px}",
    ".flt-fab-text{font-size:12px;color:var(--text-secondary);line-height:1.5;margin-bottom:12px}",
    ".flt-fab-go{width:100%;padding:11px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}",
    ".flt-fab-min{position:absolute;top:8px;right:10px;background:none;border:none;color:var(--text-secondary);font-size:18px;line-height:1;cursor:pointer;font-family:inherit}",
    ".flt-fab-mini{width:54px;height:54px;border-radius:50%;border:none;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 12px 30px rgba(255,0,72,.5);animation:fltPop .4s ease}",
    ".flt-fab.mini .flt-fab-card{display:none}",
    ".flt-fab:not(.mini) .flt-fab-mini{display:none}",
    "@media (max-width:600px){.flt-fab{left:10px;bottom:84px}.flt-fab-card{width:220px}}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("fltStyles")) return;
    var st = document.createElement("style");
    st.id = "fltStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- ALWAYS-AVAILABLE floating board ---------- */
  function injectFab() {
    if (document.getElementById(FAB_ID)) return;
    // Not on the login screen.
    var auth = document.getElementById("authView");
    if (auth && auth.classList.contains("active")) return;

    var wrap = document.createElement("div");
    wrap.id = FAB_ID;
    wrap.className = "flt-fab" + (localStorage.getItem(FAB_KEY) === "mini" ? " mini" : "");
    wrap.innerHTML =
      '<div class="flt-fab-card">' +
        '<button type="button" class="flt-fab-min" id="fltFabMin" title="Minimise">&minus;</button>' +
        '<div class="flt-fab-icon">🚀</div>' +
        '<div class="flt-fab-title">How to download the launcher?</div>' +
        '<div class="flt-fab-text">New here? I\'ll show you exactly where to click — takes 30 seconds.</div>' +
        '<button type="button" class="flt-fab-go" id="fltFabGo"><i class="fas fa-play"></i> Show me</button>' +
      "</div>" +
      '<button type="button" class="flt-fab-mini" id="fltFabMini" title="How to download the launcher"><i class="fas fa-circle-question"></i></button>';
    document.body.appendChild(wrap);

    wrap.querySelector("#fltFabGo").addEventListener("click", function () { start(); });
    wrap.querySelector("#fltFabMin").addEventListener("click", function () {
      localStorage.setItem(FAB_KEY, "mini");
      wrap.classList.add("mini");
    });
    wrap.querySelector("#fltFabMini").addEventListener("click", function () {
      localStorage.removeItem(FAB_KEY);
      wrap.classList.remove("mini");
    });
  }

  /* ---------- tour engine ---------- */
  function detachAdvance() {
    if (advanceEl && advanceFn) {
      try { advanceEl.removeEventListener("click", advanceFn, true); } catch (e) {}
    }
    advanceEl = null;
    advanceFn = null;
  }

  function clearTour() {
    detachAdvance();   // never leave a stale "click to advance" listener behind
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

    var tw = tip.offsetWidth || 360, th = tip.offsetHeight || 190;
    var vw = window.innerWidth, vh = window.innerHeight;
    var place = (steps[idx] && steps[idx].place) || "bottom";
    var left, top;

    if (place === "right") { left = r.right + 20; top = r.top - 6; }
    else if (place === "top") { left = r.left; top = r.top - th - 20; }
    else { left = r.left; top = r.bottom + 20; }

    if (left + tw > vw - 12) left = vw - tw - 12;
    if (left < 12) left = 12;
    if (top + th > vh - 12) top = Math.max(12, r.top - th - 20);
    if (top < 12) top = 12;

    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function next() { if (idx < steps.length - 1) { idx++; clearTour(); runStep(); } else finish(); }
  function back() { if (idx > 0) { idx--; clearTour(); runStep(); } }

  function buildTip(st, el) {
    tip = document.createElement("div");
    tip.className = "flt-tip";
    var pct = Math.round(((idx + 1) / steps.length) * 100);
    tip.innerHTML =
      '<div class="flt-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="flt-count">Step ' + (idx + 1) + " of " + steps.length + "</div>" +
      "<h4>" + st.title + "</h4>" +
      "<p>" + st.text + "</p>" +
      '<div class="flt-row">' +
        (idx > 0 ? '<button type="button" class="flt-btn flt-ghost" id="fltBack">Back</button>' : "") +
        (st.final
          ? '<button type="button" class="flt-btn" id="fltRestart"><i class="fas fa-rotate-right"></i> Show me again</button>' +
            '<button type="button" class="flt-btn flt-ghost" id="fltDone">Done</button>'
          : '<button type="button" class="flt-btn" id="fltNext">Next</button>') +
        '<button type="button" class="flt-skip" id="fltEnd">Skip tour</button>' +
      "</div>" +
      (st.clickAdvance && el ? '<div class="flt-hint"><i class="fas fa-hand-pointer"></i> Click the highlighted item, or press Next</div>' : "");
    document.body.appendChild(tip);

    var b = tip.querySelector("#fltBack"); if (b) b.addEventListener("click", back);
    var n = tip.querySelector("#fltNext"); if (n) n.addEventListener("click", next);
    var d = tip.querySelector("#fltDone"); if (d) d.addEventListener("click", finish);
    var r2 = tip.querySelector("#fltRestart"); if (r2) r2.addEventListener("click", function () { clearTour(); start(); });
    var s = tip.querySelector("#fltEnd"); if (s) s.addEventListener("click", function () { localStorage.setItem(KEY, "done"); clearTour(); });

    if (st.clickAdvance && el) {
      advanceEl = el;
      advanceFn = function () {
        detachAdvance();
        setTimeout(next, 500);
      };
      el.addEventListener("click", advanceFn, true);
    }
  }

  function showCenter(st) {
    clearTour();
    tip = document.createElement("div");
    tip.className = "flt-tip";
    tip.style.left = "50%";
    tip.style.top = "50%";
    tip.style.transform = "translate(-50%,-50%)";
    var pct = Math.round(((idx + 1) / steps.length) * 100);
    tip.innerHTML =
      '<div class="flt-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="flt-count">Step ' + (idx + 1) + " of " + steps.length + "</div>" +
      "<h4>" + st.title + "</h4><p>" + st.text + "</p>" +
      '<div class="flt-row">' +
        (idx > 0 ? '<button type="button" class="flt-btn flt-ghost" id="fltBack">Back</button>' : "") +
        (st.final
          ? '<button type="button" class="flt-btn" id="fltRestart"><i class="fas fa-rotate-right"></i> Show me again</button>' +
            '<button type="button" class="flt-btn flt-ghost" id="fltDone">Done</button>'
          : '<button type="button" class="flt-btn" id="fltNext">' + (st.next || "Next") + "</button>") +
        '<button type="button" class="flt-skip" id="fltEnd">Skip tour</button>' +
      "</div>";
    document.body.appendChild(tip);
    var b = tip.querySelector("#fltBack"); if (b) b.addEventListener("click", back);
    var n = tip.querySelector("#fltNext"); if (n) n.addEventListener("click", next);
    var d = tip.querySelector("#fltDone"); if (d) d.addEventListener("click", finish);
    var r2 = tip.querySelector("#fltRestart"); if (r2) r2.addEventListener("click", function () { clearTour(); start(); });
    var s = tip.querySelector("#fltEnd"); if (s) s.addEventListener("click", function () { localStorage.setItem(KEY, "done"); clearTour(); });
  }

  function finish() { localStorage.setItem(KEY, "done"); clearTour(); }

  function runStep() {
    injectStyles();
    var st = steps[idx];
    if (!st) return finish();
    if (!st.sel) return showCenter(st);

    waitFor(st.sel, 5000, function (el) {
      if (!el) {   // target missing -> skip it, but never skip the whole tour
        if (idx < steps.length - 1) { idx++; return runStep(); }
        return showCenter(steps[steps.length - 1]);
      }
      try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
      setTimeout(function () {
        current = el;
        spot = document.createElement("div");
        spot.className = "flt-spot";
        document.body.appendChild(spot);
        buildTip(st, el);
        position();
        setTimeout(position, 380);
      }, 300);
    });
  }

  function start() { injectStyles(); idx = 0; clearTour(); runStep(); }

  /* ---------- first-visit popup ---------- */
  function ask() {
    if (localStorage.getItem(KEY)) return;
    if (document.getElementById("fltAsk")) return;
    if (tip) return;   // a tour is already running — don't stack a popup on it
    injectStyles();
    var ov = document.createElement("div");
    ov.className = "flt-ask";
    ov.id = "fltAsk";
    ov.innerHTML =
      '<div class="flt-ask-card">' +
        '<div class="flt-ask-icon">🚀</div>' +
        "<h3>How to download the launcher?</h3>" +
        "<p>Want a quick 30-second guide that shows you exactly where to click? (You can reopen it anytime from <b>How to Download</b> in the sidebar.)</p>" +
        '<div class="flt-ask-row">' +
          '<button type="button" class="flt-yes" id="fltYes"><i class="fas fa-play"></i> Yes, show me</button>' +
          '<button type="button" class="flt-no" id="fltNo">No</button>' +
        "</div>" +
        '<button type="button" class="flt-skipall" id="fltSkip">Skip — don\'t ask again</button>' +
      "</div>";
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.querySelector("#fltYes").addEventListener("click", function () { close(); start(); });
    ov.querySelector("#fltNo").addEventListener("click", close);
    ov.querySelector("#fltSkip").addEventListener("click", function () { localStorage.setItem(KEY, "skipped"); close(); });
  }

  function watch() {
    var dash = document.getElementById("dashboard");
    if (dash && dash.classList.contains("active")) {
      if (!window.__fltAsked) { window.__fltAsked = true; setTimeout(ask, 1400); }
    } else {
      window.__fltAsked = false;
    }
  }

  document.addEventListener("keydown", function (e) {
    if (!tip) return;
    if (e.key === "Escape") { localStorage.setItem(KEY, "done"); clearTour(); }
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") back();
  });

  window.addEventListener("scroll", position, true);
  window.addEventListener("resize", position);
  window.FearLauncherTour = { start: start, ask: ask };

  function init() {
    injectStyles();
    injectFab();
    watch();
    setInterval(function () { injectFab(); watch(); }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
