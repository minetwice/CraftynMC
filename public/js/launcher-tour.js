/* CraftynMC / FearLauncher — guided tour board
 * ------------------------------------------------------------------
 * A floating BOARD at the top-centre of the screen (so everyone notices it)
 * with a dropdown of every feature. Pick one, press "Show me", and a
 * spotlight walkthrough teaches it step by step.
 *
 * If the sidebar is closed (mobile / collapsed), the tour first points at the
 * menu button and asks the player to open it.
 *
 * The first visit to the main dashboard still shows a one-time popup.
 */
(function () {
  "use strict";

  var KEY = "flLauncherTour";   // "done" | "skipped"
  var FAB_KEY = "flTourFab";    // "mini" once collapsed

  function nav(sec) { return '.nav-item[data-section="' + sec + '"]'; }

  /* ---------------- feature tours ---------------- */
  var FEATURES = {
    launcher: {
      label: "Download the launcher",
      steps: [
        { sel: nav("fearlauncher"), title: "Open the launcher page", text: "Click <b>FearLauncher Client</b> in the sidebar — that's where you download the launcher.", clickAdvance: true, place: "right" },
        { sel: "#fearlauncherContainer .mr-card", title: "Open the launcher project", text: "Click the <b>FearLauncher Client</b> card to open its page.", clickAdvance: true, place: "bottom" },
        { sel: ".mr-download-btn", title: "Hit Download", text: "Now click <b>Download</b> — the installer saves to your device.", clickAdvance: true, place: "top" }
      ]
    },
    mods: {
      label: "Browse & download mods",
      steps: [
        { sel: nav("mods"), title: "Open the store", text: "Click <b>Mods</b> (or Plugins / Resources / Shaders) in the sidebar.", clickAdvance: true, place: "right" },
        { sel: "#mrSearch_mods", title: "Search projects", text: "Type here to instantly filter projects by name.", clickAdvance: false, place: "bottom" },
        { sel: "#modsContainer .mr-card", title: "Open a project", text: "Click any card to read it, see the rating and reviews, and download.", clickAdvance: true, place: "bottom" }
      ]
    },
    coins: {
      label: "Earn coins by watching ads",
      steps: [
        { sel: nav("earn-coins"), title: "Open Earn Coins", text: "Click <b>Earn Coins</b> in the sidebar.", clickAdvance: true, place: "right" },
        { sel: "#flcWatch", title: "Watch an ad", text: "Press <b>Watch ad &amp; earn coins</b> — a short ad plays and coins are added. Keep a daily streak for bonus coins!", clickAdvance: false, place: "bottom" }
      ]
    },
    shop: {
      label: "Spend coins in the Coin Shop",
      steps: [
        { sel: nav("coin-shop"), title: "Open the Coin Shop", text: "Click <b>Coin Shop</b> in the sidebar.", clickAdvance: true, place: "right" },
        { sel: ".fls-buy", title: "Buy something", text: "Spend your coins — <b>Premium badge</b>, <b>feature your project</b>, or an <b>ad-free pass</b>.", clickAdvance: false, place: "bottom" }
      ]
    },
    rewards: {
      label: "Daily rewards & streak",
      steps: [
        { sel: nav("daily-rewards"), title: "Open Daily Rewards", text: "Click <b>Daily Rewards</b> in the sidebar.", clickAdvance: true, place: "right" },
        { sel: "#claimRewardBtn", title: "Claim your reward", text: "Claim once a day — Day 1 gives 100 coins, all the way up to <b>1500 on Day 10</b>.", clickAdvance: false, place: "top" }
      ]
    },
    leaderboard: {
      label: "Weekly leaderboard",
      steps: [
        { sel: nav("leaderboard"), title: "Open the Leaderboard", text: "Click <b>Leaderboard</b> in the sidebar.", clickAdvance: true, place: "right" },
        { sel: ".flb-table", title: "Climb the board", text: "Top 3 coin earners each week win <b>500 / 300 / 150</b> bonus coins.", clickAdvance: false, place: "bottom" }
      ]
    },
    lookup: {
      label: "Player Lookup (3D skins)",
      steps: [
        { sel: nav("player-lookup"), title: "Open Player Lookup", text: "Click <b>Player Lookup</b> in the sidebar.", clickAdvance: true, place: "right" },
        { sel: "#flpName", title: "Search any player", text: "Type a username — suggestions appear. Pick one to see their <b>3D character</b>, skin, cape and cosmetics, and download the skin PNG.", clickAdvance: false, place: "bottom" }
      ]
    },
    profile: {
      label: "Customise your profile",
      steps: [
        { sel: nav("profile"), title: "Open your profile", text: "Click <b>Customize Profile</b> in the sidebar.", clickAdvance: true, place: "right" },
        { sel: "#uploadSkinBtn", title: "Upload your skin", text: "Upload a 64×64 PNG skin — it shows on your 3D character and in-game.", clickAdvance: false, place: "top" }
      ]
    }
  };

  var ORDER = ["launcher", "mods", "coins", "shop", "rewards", "leaderboard", "lookup", "profile"];

  var steps = [];
  var feature = "launcher";
  var idx = 0;
  var spot = null, tip = null, current = null;
  var advanceEl = null, advanceFn = null;

  /* ---------------- styles ---------------- */
  var CSS = [
    ".flt-spot{position:fixed;z-index:10080;pointer-events:none;border-radius:16px;border:2px solid #ff0048;box-shadow:0 0 0 9999px rgba(4,5,10,.84),0 0 34px rgba(255,0,72,.6);transition:left .22s ease,top .22s ease,width .22s ease,height .22s ease;animation:fltPulse 1.6s ease-in-out infinite}",
    "@keyframes fltPulse{0%,100%{box-shadow:0 0 0 9999px rgba(4,5,10,.84),0 0 26px rgba(255,0,72,.45)}50%{box-shadow:0 0 0 9999px rgba(4,5,10,.84),0 0 44px rgba(255,0,72,.85)}}",
    ".flt-tip{position:fixed;z-index:10081;width:min(360px,88vw);background:linear-gradient(180deg,#161923,#101219);border:1px solid rgba(255,0,72,.35);border-radius:18px;padding:18px;box-shadow:0 26px 70px rgba(0,0,0,.8)}",
    ".flt-tip h4{margin:0 0 8px;font-family:'Outfit',sans-serif;font-size:16px;color:#fff}",
    ".flt-tip p{margin:0;font-size:13.5px;line-height:1.65;color:#c9cbd6}",
    ".flt-tip b{color:#fff}",
    ".flt-bar{height:4px;border-radius:4px;background:rgba(255,255,255,.09);overflow:hidden;margin:0 0 12px}",
    ".flt-bar>i{display:block;height:100%;background:linear-gradient(90deg,#ff0048,#ff7a9c);transition:width .3s ease}",
    ".flt-row{display:flex;align-items:center;gap:8px;margin-top:16px;flex-wrap:wrap}",
    ".flt-btn{padding:10px 16px;border:none;border-radius:11px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}",
    ".flt-btn:hover{filter:brightness(1.12)}",
    ".flt-ghost{background:rgba(255,255,255,.06);color:#e8e8ee;border:1px solid var(--border-color)}",
    ".flt-skip{margin-left:auto;background:none;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;font-family:inherit}",
    ".flt-count{font-size:11px;color:var(--text-secondary);letter-spacing:.4px;margin-bottom:6px;text-transform:uppercase}",
    ".flt-hint{margin-top:10px;font-size:11.5px;color:#8b8ea0;display:flex;align-items:center;gap:6px}",

    /* top-centre board */
    ".flt-fab{position:fixed;top:74px;left:50%;transform:translateX(-50%);z-index:10070;display:flex;justify-content:center}",
    ".flt-fab-card{position:relative;width:min(430px,92vw);background:linear-gradient(180deg,#161923,#101219);border:1px solid rgba(255,0,72,.4);border-radius:18px;padding:16px 18px 14px;box-shadow:0 22px 60px rgba(0,0,0,.75);animation:fltPop .5s cubic-bezier(.2,1.5,.4,1)}",
    "@keyframes fltPop{0%{transform:scale(.7) translateY(-22px);opacity:0}60%{transform:scale(1.03) translateY(0);opacity:1}100%{transform:scale(1) translateY(0)}}",
    ".flt-fab-head{display:flex;align-items:center;gap:9px;margin-bottom:10px}",
    ".flt-fab-head b{font-family:'Outfit',sans-serif;font-size:15px;color:#fff}",
    ".flt-fab-row{display:flex;gap:8px;align-items:stretch}",
    ".flt-fab-row select{flex:1;min-width:0;padding:11px 12px;border-radius:12px;border:1px solid var(--border-color);background:rgba(10,12,18,.7);color:#fff;font-family:inherit;font-size:13.5px;cursor:pointer}",
    ".flt-fab-go{padding:11px 18px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;font-family:inherit;white-space:nowrap}",
    ".flt-fab-min{position:absolute;top:9px;right:12px;background:none;border:none;color:var(--text-secondary);font-size:18px;line-height:1;cursor:pointer;font-family:inherit}",
    ".flt-fab-mini{padding:10px 16px;border-radius:30px;border:1px solid rgba(255,0,72,.45);background:linear-gradient(135deg,#161923,#101219);color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.6);animation:fltPop .4s ease;display:inline-flex;align-items:center;gap:8px}",
    ".flt-fab.mini .flt-fab-card{display:none}",
    ".flt-fab:not(.mini) .flt-fab-mini{display:none}",
    "body.flt-touring .flt-fab{display:none}",
    "#sidebarToggleBtn{display:flex !important}",
    "#flNavBurger{display:flex !important}",

    /* first-visit popup */
    ".flt-ask{position:fixed;inset:0;background:rgba(4,5,10,.9);z-index:10090;display:flex;align-items:center;justify-content:center;padding:20px}",
    ".flt-ask-card{background:linear-gradient(180deg,#161923,#101219);border:1px solid rgba(255,0,72,.35);border-radius:22px;width:min(440px,100%);padding:28px;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.85)}",
    ".flt-ask-card h3{margin:0 0 8px;font-family:'Outfit',sans-serif;color:#fff;font-size:20px}",
    ".flt-ask-card p{margin:0 0 20px;font-size:13.5px;color:var(--text-secondary);line-height:1.65}",
    ".flt-ask-icon{font-size:40px;margin-bottom:12px;filter:drop-shadow(0 0 18px rgba(255,0,72,.5))}",
    ".flt-ask-row{display:flex;gap:10px}",
    ".flt-ask-row button{flex:1;padding:14px;border-radius:13px;border:none;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}",
    ".flt-yes{background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff}",
    ".flt-no{background:rgba(255,255,255,.07);color:#fff}",
    ".flt-skipall{display:block;margin:16px auto 0;background:none;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;font-family:inherit;text-decoration:underline}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("fltStyles")) return;
    var st = document.createElement("style");
    st.id = "fltStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- sidebar helpers ---------------- */
  function sidebarOpen() {
    var sb = document.getElementById("sidebar");
    if (!sb) return true;
    if (window.innerWidth <= 1024) return sb.classList.contains("mobile-open");
    return !document.body.classList.contains("sidebar-collapsed");
  }

  // The ☰ lives in the top bar, top-left — always use THAT one (the floating
  // bottom-right button is a different, secondary toggle).
  function menuButtonSel() {
    // With the Modrinth-style top navbar the sidebar is hidden, so the menu
    // button the player actually taps is the one in that navbar.
    if (document.getElementById("flNavBurger") && document.body.classList.contains("fl-topnav")) return "#flNavBurger";
    if (document.getElementById("sidebarToggleBtn")) return "#sidebarToggleBtn";
    return "#mobileNavToggle";
  }

  /* ---------------- top-centre board ---------------- */
  function injectFab() {
    if (document.getElementById("flTourFab")) return;
    var auth = document.getElementById("authView");
    if (auth && auth.classList.contains("active")) return;   // not on the login screen

    var wrap = document.createElement("div");
    wrap.id = "flTourFab";
    wrap.className = "flt-fab" + (localStorage.getItem(FAB_KEY) === "mini" ? " mini" : "");

    var opts = ORDER.map(function (k) {
      return '<option value="' + k + '">' + FEATURES[k].label + "</option>";
    }).join("");

    wrap.innerHTML =
      '<div class="flt-fab-card">' +
        '<button type="button" class="flt-fab-min" id="fltFabMin" title="Minimise">&minus;</button>' +
        '<div class="flt-fab-head"><span style="font-size:20px">🚀</span><b>How do I&hellip;? &mdash; pick a feature</b></div>' +
        '<div class="flt-fab-row">' +
          '<select id="fltFeature">' + opts + "</select>" +
          '<button type="button" class="flt-fab-go" id="fltFabGo"><i class="fas fa-play"></i> Show me</button>' +
        "</div>" +
      "</div>" +
      '<button type="button" class="flt-fab-mini" id="fltFabMini"><i class="fas fa-circle-question"></i> How do I&hellip;?</button>';
    document.body.appendChild(wrap);

    var sel = wrap.querySelector("#fltFeature");
    try { sel.value = localStorage.getItem("flTourFeature") || "launcher"; } catch (e) {}
    sel.addEventListener("change", function () { localStorage.setItem("flTourFeature", sel.value); });
    wrap.querySelector("#fltFabGo").addEventListener("click", function () { start(sel.value); });
    wrap.querySelector("#fltFabMin").addEventListener("click", function () {
      localStorage.setItem(FAB_KEY, "mini");
      wrap.classList.add("mini");
    });
    wrap.querySelector("#fltFabMini").addEventListener("click", function () {
      localStorage.removeItem(FAB_KEY);
      wrap.classList.remove("mini");
    });
  }

  /* ---------------- tour engine ---------------- */
  function detachAdvance() {
    if (advanceEl && advanceFn) { try { advanceEl.removeEventListener("click", advanceFn, true); } catch (e) {} }
    advanceEl = null;
    advanceFn = null;
  }

  function clearTour() {
    detachAdvance();
    if (spot && spot.parentNode) spot.parentNode.removeChild(spot);
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    spot = null; tip = null; current = null;
    document.body.classList.remove("flt-touring");
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

  // The message box always stays at the TOP CENTRE of the screen; only the
  // red ring moves to the target. That way it never "goes down" the page.
  function position() {
    if (!current || !spot || !tip) return;
    var r = current.getBoundingClientRect();
    var pad = 6;
    spot.style.left = (r.left - pad) + "px";
    spot.style.top = (r.top - pad) + "px";
    spot.style.width = (r.width + pad * 2) + "px";
    spot.style.height = (r.height + pad * 2) + "px";

    var vw = window.innerWidth;
    var tb = document.querySelector(".top-bar");
    var tbBottom = tb ? tb.getBoundingClientRect().bottom : 0;
    var top = Math.max(14, tbBottom + 14);
    if (window.innerWidth <= 600) top = Math.max(14, tbBottom + 10);

    tip.style.left = "50%";
    tip.style.transform = "translateX(-50%)";
    tip.style.top = top + "px";
    tip.style.maxWidth = Math.min(420, vw - 24) + "px";
  }

  function next() { if (idx < steps.length - 1) { idx++; clearTour(); runStep(); } else finish(); }
  function back() { if (idx > 0) { idx--; clearTour(); runStep(); } }

  function buttons(st) {
    return '<div class="flt-row">' +
      (idx > 0 ? '<button type="button" class="flt-btn flt-ghost" id="fltBack">Back</button>' : "") +
      (st.final
        ? '<button type="button" class="flt-btn" id="fltRestart"><i class="fas fa-rotate-right"></i> Show me again</button>' +
          '<button type="button" class="flt-btn flt-ghost" id="fltDone">Done</button>'
        : '<button type="button" class="flt-btn" id="fltNext">' + (st.next || "Next") + "</button>") +
      '<button type="button" class="flt-skip" id="fltEnd">Skip</button>' +
    "</div>";
  }

  function wireButtons(el) {
    var b = el.querySelector("#fltBack"); if (b) b.addEventListener("click", back);
    var n = el.querySelector("#fltNext"); if (n) n.addEventListener("click", next);
    var d = el.querySelector("#fltDone"); if (d) d.addEventListener("click", finish);
    var r = el.querySelector("#fltRestart"); if (r) r.addEventListener("click", function () { clearTour(); start(feature); });
    var s = el.querySelector("#fltEnd"); if (s) s.addEventListener("click", function () { localStorage.setItem(KEY, "done"); clearTour(); });
  }

  function buildTip(st, el) {
    document.body.classList.add("flt-touring");   // hide the board while touring
    tip = document.createElement("div");
    tip.className = "flt-tip";
    var pct = Math.round(((idx + 1) / steps.length) * 100);
    tip.innerHTML =
      '<div class="flt-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="flt-count">Step ' + (idx + 1) + " of " + steps.length + "</div>" +
      "<h4>" + st.title + "</h4><p>" + st.text + "</p>" +
      buttons(st) +
      (st.clickAdvance && el ? '<div class="flt-hint"><i class="fas fa-hand-pointer"></i> Click the highlighted item, or press Next</div>' : "");
    document.body.appendChild(tip);
    wireButtons(tip);

    if (st.clickAdvance && el) {
      advanceEl = el;
      advanceFn = function () { detachAdvance(); setTimeout(next, 500); };
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
      "<h4>" + st.title + "</h4><p>" + st.text + "</p>" + buttons(st);
    document.body.appendChild(tip);
    wireButtons(tip);
  }

  function finish() { localStorage.setItem(KEY, "done"); clearTour(); }

  function runStep() {
    injectStyles();
    var st = steps[idx];
    if (!st) return finish();
    if (!st.sel) return showCenter(st);

    waitFor(st.sel, 5000, function (el) {
      if (!el) {
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

  function start(key) {
    injectStyles();
    feature = FEATURES[key] ? key : "launcher";
    var f = FEATURES[feature];

    steps = [{ sel: null, title: "👋 " + f.label, text: "I'll highlight exactly what to click. Follow the <b>red ring</b>.", next: "Let's go" }];

    // If the sidebar is shut, teach opening it first.
    if (!sidebarOpen()) {
      steps.push({
        sel: menuButtonSel(),
        title: "First — open the menu",
        text: "Tap the <b>☰ menu button</b> to open the sidebar. Everything lives in there.",
        clickAdvance: true,
        place: "bottom"
      });
    }

    f.steps.forEach(function (s) { steps.push(s); });
    steps.push({
      sel: null,
      title: "🎉 That's it!",
      text: "You're all set. Open this board anytime from the top of the screen to learn another feature.",
      final: true
    });

    idx = 0;
    clearTour();
    runStep();
  }

  /* ---------------- first-visit popup ---------------- */
  function ask() {
    if (localStorage.getItem(KEY)) return;
    if (document.getElementById("fltAsk")) return;
    if (tip) return;
    injectStyles();
    var ov = document.createElement("div");
    ov.className = "flt-ask";
    ov.id = "fltAsk";
    ov.innerHTML =
      '<div class="flt-ask-card">' +
        '<div class="flt-ask-icon">🚀</div>' +
        "<h3>New here? Want a quick tour?</h3>" +
        "<p>I can walk you through <b>downloading the launcher</b>, earning coins, the store and more. You can reopen this anytime from the board at the top.</p>" +
        '<div class="flt-ask-row">' +
          '<button type="button" class="flt-yes" id="fltYes"><i class="fas fa-play"></i> Yes, show me</button>' +
          '<button type="button" class="flt-no" id="fltNo">No</button>' +
        "</div>" +
        '<button type="button" class="flt-skipall" id="fltSkip">Skip — don\'t ask again</button>' +
      "</div>";
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.querySelector("#fltYes").addEventListener("click", function () { close(); start("launcher"); });
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
  window.FearLauncherTour = { start: start, ask: ask, features: FEATURES };

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
