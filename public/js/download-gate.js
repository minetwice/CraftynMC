/* CraftynMC / FearLauncher — Download Gate
 * ------------------------------------------------------------------
 * Before an asset download starts, the visitor is shown a short gate:
 * three sponsored slots, 10 seconds each (30s total), and only then does
 * the real download run.
 *
 * It wraps window.purchaseAndDownloadAsset (defined by the page), so it
 * covers every download path (store cards, the detail dashboard, direct
 * links). Logged-out visitors skip the gate and go straight to the
 * page's own "please log in" flow.
 *
 * To add the remaining two ad units, just fill in AD_UNITS below with the
 * two extra keys from profitableratecpm — nothing else needs changing.
 */
(function () {
  "use strict";

  // ---- config -------------------------------------------------------
  var AD_UNITS = [
    "b7d2a30aebdc4de83b457d2055d399a3",
    "",
    ""
  ];
  var AD_SCRIPT_BASE = "https://pl30828915.profitableratecpmnetwork.com/";
  var SECONDS_PER_AD = 10;

  // ---- styles -------------------------------------------------------
  var CSS = [
    ".dg-overlay{position:fixed;inset:0;background:rgba(4,5,10,.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}",
    ".dg-modal{background:var(--bg-card);border:1px solid var(--border-hover);border-radius:20px;width:min(520px,100%);padding:24px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.75);text-align:center}",
    ".dg-head{display:flex;gap:14px;align-items:center;text-align:left;margin-bottom:18px}",
    ".dg-head>i{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,0,72,.15);color:var(--primary-red);font-size:20px;flex:0 0 auto}",
    ".dg-head h3{margin:0 0 3px;font-family:'Outfit',sans-serif;font-size:18px;color:#fff}",
    ".dg-sub{margin:0;font-size:12px;color:var(--text-secondary)}",
    ".dg-steps{display:flex;gap:8px;justify-content:center;margin-bottom:16px}",
    ".dg-dot{width:34px;height:5px;border-radius:3px;background:rgba(255,255,255,.12);transition:background .3s}",
    ".dg-dot.done{background:var(--primary-red)}",
    ".dg-dot.active{background:var(--primary-red);box-shadow:0 0 12px rgba(255,0,72,.7)}",
    ".dg-ad{min-height:280px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border-color);border-radius:16px;background:rgba(10,12,18,.6);margin-bottom:16px;overflow:hidden;padding:8px}",
    ".dg-step-ad{display:flex;align-items:center;justify-content:center;width:100%}",
    ".dg-placeholder{display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--text-secondary);font-size:13px}",
    ".dg-placeholder i{font-size:34px;opacity:.5}",
    ".dg-ready{display:flex;flex-direction:column;align-items:center;gap:10px;color:#00ff88;font-size:14px;font-weight:600}",
    ".dg-ready i{font-size:40px}",
    ".dg-progress{height:6px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-bottom:12px}",
    ".dg-bar{height:100%;width:0;background:var(--gradient-main)}",
    ".dg-status{font-size:13px;color:var(--text-secondary);margin-bottom:16px;font-weight:600}",
    ".dg-download{width:100%;padding:15px;border-radius:12px;border:none;background:var(--gradient-main);color:#fff;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 6px 20px rgba(255,0,72,.35);font-family:inherit}",
    ".dg-download:disabled{opacity:.55;cursor:not-allowed;background:rgba(255,255,255,.1);box-shadow:none}",
    ".dg-cancel{margin-top:12px;background:none;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;box-shadow:none;padding:6px}",
    ".dg-cancel:hover{color:#fff;transform:none;box-shadow:none}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("dgStyles")) return;
    var st = document.createElement("style");
    st.id = "dgStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---- gate ---------------------------------------------------------
  var gateOpen = false;
  var timer = null;

  function mountAd(wrapper, key) {
    wrapper.innerHTML = "";
    if (!key) {
      wrapper.innerHTML = '<div class="dg-placeholder"><i class="fas fa-rectangle-ad"></i><span>Ad space reserved</span></div>';
      return;
    }
    var container = document.createElement("div");
    container.id = "container-" + key;
    var script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = AD_SCRIPT_BASE + key + "/invoke.js";
    wrapper.appendChild(container);
    wrapper.appendChild(script);
  }

  function closeGate() {
    if (timer) { clearInterval(timer); timer = null; }
    var o = document.getElementById("dgOverlay");
    if (o && o.parentNode) o.parentNode.removeChild(o);
    gateOpen = false;
  }

  function openGate(assetName, onComplete) {
    if (gateOpen) return;
    injectStyles();
    gateOpen = true;

    var overlay = document.createElement("div");
    overlay.className = "dg-overlay";
    overlay.id = "dgOverlay";
    overlay.innerHTML =
      '<div class="dg-modal" role="dialog" aria-modal="true">' +
        '<div class="dg-head">' +
          '<i class="fas fa-download"></i>' +
          '<div><h3>Preparing your download</h3>' +
            '<p class="dg-sub">' + (assetName ? "Unlocking " + assetName + " — " : "") +
            "please view the sponsored messages to unlock your file.</p></div>" +
        "</div>" +
        '<div class="dg-steps"></div>' +
        '<div class="dg-ad" id="dgAd"></div>' +
        '<div class="dg-progress"><div class="dg-bar" id="dgBar"></div></div>' +
        '<div class="dg-status" id="dgStatus"></div>' +
        '<button type="button" class="dg-download" id="dgDownload" disabled><i class="fas fa-lock"></i> Please wait...</button>' +
        '<button type="button" class="dg-cancel" id="dgCancel">Cancel download</button>' +
      "</div>";
    document.body.appendChild(overlay);

    var adBox = overlay.querySelector("#dgAd");
    var stepsBox = overlay.querySelector(".dg-steps");
    var bar = overlay.querySelector("#dgBar");
    var status = overlay.querySelector("#dgStatus");
    var dlBtn = overlay.querySelector("#dgDownload");

    // Build the three slots up front so each ad has time to load.
    var wrappers = [];
    var dots = [];
    AD_UNITS.forEach(function (key, i) {
      var w = document.createElement("div");
      w.className = "dg-step-ad";
      w.style.display = "none";
      mountAd(w, key);
      adBox.appendChild(w);
      wrappers.push(w);

      var d = document.createElement("span");
      d.className = "dg-dot";
      stepsBox.appendChild(d);
      dots.push(d);
    });

    var stepIndex = 0;
    var remaining = SECONDS_PER_AD;

    function paintDots() {
      dots.forEach(function (d, i) {
        d.classList.toggle("done", i < stepIndex);
        d.classList.toggle("active", i === stepIndex);
      });
    }

    function startStep(i) {
      stepIndex = i;
      remaining = SECONDS_PER_AD;
      wrappers.forEach(function (w, idx) { w.style.display = idx === i ? "flex" : "none"; });
      paintDots();
      bar.style.transition = "none";
      bar.style.width = "0%";
      // force reflow so the next width change animates
      void bar.offsetWidth;
      bar.style.transition = "width 1s linear";
      status.textContent = "Sponsored message " + (i + 1) + " of " + AD_UNITS.length + " · " + remaining + "s";
    }

    function finish() {
      if (timer) { clearInterval(timer); timer = null; }
      wrappers.forEach(function (w) { w.style.display = "none"; });
      var ready = document.createElement("div");
      ready.className = "dg-ready";
      ready.innerHTML = '<i class="fas fa-circle-check"></i><span>Your download is ready!</span>';
      adBox.appendChild(ready);
      paintDots();
      dots.forEach(function (d) { d.classList.add("done"); d.classList.remove("active"); });
      bar.style.width = "100%";
      status.textContent = "All set — tap below to start your download.";
      dlBtn.disabled = false;
      dlBtn.innerHTML = '<i class="fas fa-download"></i> Download Now';
    }

    function tick() {
      remaining--;
      var pct = Math.max(0, Math.min(100, ((SECONDS_PER_AD - remaining) / SECONDS_PER_AD) * 100));
      bar.style.width = pct + "%";
      if (remaining > 0) {
        status.textContent = "Sponsored message " + (stepIndex + 1) + " of " + AD_UNITS.length + " · " + remaining + "s";
        return;
      }
      if (stepIndex + 1 < AD_UNITS.length) {
        startStep(stepIndex + 1);
      } else {
        finish();
      }
    }

    overlay.querySelector("#dgCancel").addEventListener("click", closeGate);
    dlBtn.addEventListener("click", function () {
      if (dlBtn.disabled) return;
      closeGate();
      try { onComplete(); } catch (e) { console.error(e); }
    });

    startStep(0);
    timer = setInterval(tick, 1000);
  }

  // ---- hook into the page's download function -----------------------
  function init() {
    injectStyles();
    var orig = window.purchaseAndDownloadAsset;
    if (typeof orig !== "function" || orig.__flGated) return;

    function loggedIn() {
      try { if (typeof window.getToken === "function") return !!window.getToken(); } catch (e) {}
      try { return !!localStorage.getItem("token"); } catch (e) {}
      return true;
    }

    function gated(id) {
      if (!loggedIn()) return orig.apply(this, arguments);
      var name = "";
      var h = document.querySelector("#mrOverlay .mr-modal-titles h2");
      if (h) name = h.textContent.trim();
      openGate(name, function () { orig.call(window, id); });
    }
    gated.__flGated = true;

    window.purchaseAndDownloadAsset = gated;
    window.FearLauncherGate = { open: openGate, close: closeGate };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
