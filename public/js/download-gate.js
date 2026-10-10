/* CraftynMC / FearLauncher — Download Gate
 * ------------------------------------------------------------------
 * Before an asset download starts, the visitor is shown a short gate:
 * three sponsored steps. Each step shows a different ad, and only after
 * all steps does the download run.
 *
 * Units can be of two kinds:
 *   { type: "native", key }              -> profitableratecpm native banner
 *   { type: "iframe", key, width, height } -> highrevenueformat iframe banner
 *
 * If VAST_TAG is set, steps play a pre-roll VIDEO ad instead (falls back
 * to the units above if the video can't load). Adsterra has no VAST, so
 * it is off by default.
 */
(function () {
  "use strict";

  // ---- config -------------------------------------------------------
  var VAST_TAG = ""; // no VAST available (Adsterra) -> banners only

  var AD_UNITS = [
    { type: "native", key: "b7d2a30aebdc4de83b457d2055d399a3" },
    { type: "iframe", key: "b98c4d477378888b919223fad51d3065", width: 300, height: 250 },
    { type: "iframe", key: "b415f39e30b7579af10b7b86d1434191", width: 468, height: 60 }
  ];

  var NATIVE_BASE = "https://pl30828915.profitableratecpmnetwork.com/";
  var IFRAME_BASE = "https://www.highrevenueformat.com/";

  var SECONDS_PER_AD = 10;   // used for the banner countdown
  var STEPS = 3;
  var MAX_VIDEO_SECONDS = 45; // safety cap so a stuck video can't block the gate

  function activeUnits() {
    var out = [];
    for (var i = 0; i < AD_UNITS.length; i++) if (AD_UNITS[i] && AD_UNITS[i].key) out.push(AD_UNITS[i]);
    return out;
  }

  // ---- styles -------------------------------------------------------
  var CSS = [
    ".dg-overlay{position:fixed;inset:0;background:rgba(4,5,10,.92);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}",
    ".dg-modal{background:var(--bg-card);border:1px solid var(--border-hover);border-radius:20px;width:min(560px,100%);padding:24px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.75);text-align:center}",
    ".dg-head{display:flex;gap:14px;align-items:center;text-align:left;margin-bottom:18px}",
    ".dg-head>i{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,0,72,.15);color:var(--primary-red);font-size:20px;flex:0 0 auto}",
    ".dg-head h3{margin:0 0 3px;font-family:'Outfit',sans-serif;font-size:18px;color:#fff}",
    ".dg-sub{margin:0;font-size:12px;color:var(--text-secondary)}",
    ".dg-steps{display:flex;gap:8px;justify-content:center;margin-bottom:16px}",
    ".dg-dot{width:34px;height:5px;border-radius:3px;background:rgba(255,255,255,.12);transition:background .3s}",
    ".dg-dot.done{background:var(--primary-red)}",
    ".dg-dot.active{background:var(--primary-red);box-shadow:0 0 12px rgba(255,0,72,.7)}",
    ".dg-ad{position:relative;min-height:90px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border-color);border-radius:16px;background:rgba(10,12,18,.6);margin-bottom:16px;overflow:hidden;padding:8px}",
    ".dg-ad .dg-ad-inner{display:flex;align-items:center;justify-content:center;width:100%}",
    ".dg-video{width:100%;display:block;max-height:300px;background:#000}",
    ".dg-video-label{position:absolute;top:8px;left:10px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:8px}",
    ".dg-unmute{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.65);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;box-shadow:none;font-family:inherit}",
    ".dg-placeholder{display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--text-secondary);font-size:13px;padding:40px}",
    ".dg-placeholder i{font-size:34px;opacity:.5}",
    ".dg-ready{display:flex;flex-direction:column;align-items:center;gap:10px;color:#00ff88;font-size:14px;font-weight:600;padding:60px 20px}",
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

  // ---- ad loading ---------------------------------------------------

  function loadVastAd() {
    if (!VAST_TAG) return Promise.resolve(null);
    return fetch(VAST_TAG, { credentials: "omit", cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, "text/xml");
        if (!doc || typeof doc.querySelectorAll !== "function") return null;
        var mfs = doc.querySelectorAll("MediaFile");
        var chosen = null;
        Array.prototype.forEach.call(mfs, function (mf) {
          if (chosen) return;
          var type = mf.getAttribute("type") || "";
          var url = (mf.textContent || "").trim();
          if (!url) return;
          if (type.indexOf("mp4") !== -1 || url.indexOf(".mp4") !== -1) chosen = url;
        });
        if (!chosen && mfs.length) chosen = (mfs[0].textContent || "").trim();
        if (!chosen) return null;
        var imps = [];
        Array.prototype.forEach.call(doc.querySelectorAll("Impression"), function (el) {
          var u = (el.textContent || "").trim();
          if (u) imps.push(u);
        });
        var ct = doc.querySelector("ClickThrough");
        return { url: chosen, impressions: imps, clickThrough: ct ? (ct.textContent || "").trim() : "" };
      })
      .catch(function () { return null; });
  }

  function mountUnit(adBox, unit) {
    adBox.innerHTML = "";
    if (!unit || !unit.key) {
      adBox.innerHTML = '<div class="dg-placeholder"><i class="fas fa-rectangle-ad"></i><span>Ad space reserved</span></div>';
      return;
    }
    var inner = document.createElement("div");
    inner.className = "dg-ad-inner";
    adBox.appendChild(inner);

    if (unit.type === "iframe") {
      // highrevenueformat style: atOptions + invoke.js
      try {
        window.atOptions = {
          key: unit.key,
          format: "iframe",
          height: unit.height || 250,
          width: unit.width || 300,
          params: {}
        };
      } catch (e) {}
      var box = document.createElement("div");
      box.id = "container-" + unit.key;
      inner.appendChild(box);
      var s = document.createElement("script");
      s.async = true;
      s.setAttribute("data-cfasync", "false");
      s.src = IFRAME_BASE + unit.key + "/invoke.js";
      inner.appendChild(s);
      return;
    }

    // profitableratecpm native style: a container div + invoke.js
    var container = document.createElement("div");
    container.id = "container-" + unit.key;
    inner.appendChild(container);
    var script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = NATIVE_BASE + unit.key + "/invoke.js";
    inner.appendChild(script);
  }

  // ---- gate ---------------------------------------------------------
  var gateOpen = false;
  var timer = null;

  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function closeGate() {
    clearTimer();
    var o = document.getElementById("dgOverlay");
    if (o && o.parentNode) o.parentNode.removeChild(o);
    gateOpen = false;
  }

  function openGate(assetName, onComplete) {
    if (gateOpen) return;
    var units = activeUnits();
    if (!VAST_TAG && !units.length) { try { onComplete(); } catch (e) {} return; }

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
            "please watch the sponsored messages to unlock your file.</p></div>" +
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

    var dots = [];
    for (var s = 0; s < STEPS; s++) {
      var d = document.createElement("span");
      d.className = "dg-dot";
      stepsBox.appendChild(d);
      dots.push(d);
    }

    var stepIndex = 0;

    function paintDots() {
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle("done", i < stepIndex);
        dots[i].classList.toggle("active", i === stepIndex);
      }
    }

    function resetBar() {
      bar.style.transition = "none";
      bar.style.width = "0%";
      void bar.offsetWidth;
      bar.style.transition = "width 1s linear";
    }

    function finish() {
      clearTimer();
      adBox.innerHTML = "";
      var ready = document.createElement("div");
      ready.className = "dg-ready";
      ready.innerHTML = '<i class="fas fa-circle-check"></i><span>Your download is ready!</span>';
      adBox.appendChild(ready);
      for (var i = 0; i < dots.length; i++) { dots[i].classList.add("done"); dots[i].classList.remove("active"); }
      bar.style.width = "100%";
      status.textContent = "All set — tap below to start your download.";
      dlBtn.disabled = false;
      dlBtn.innerHTML = '<i class="fas fa-download"></i> Download Now';
    }

    function nextStep() {
      stepIndex++;
      if (stepIndex >= STEPS) { finish(); return; }
      startStep(stepIndex);
    }

    function startUnit(i) {
      clearTimer();
      var unit = units.length ? units[i % units.length] : null;
      mountUnit(adBox, unit);
      resetBar();
      var remaining = SECONDS_PER_AD;
      status.textContent = "Sponsored message " + (i + 1) + " of " + STEPS + " · " + remaining + "s";
      timer = setInterval(function () {
        remaining--;
        bar.style.width = Math.max(0, Math.min(100, ((SECONDS_PER_AD - remaining) / SECONDS_PER_AD) * 100)) + "%";
        if (remaining > 0) {
          status.textContent = "Sponsored message " + (i + 1) + " of " + STEPS + " · " + remaining + "s";
          return;
        }
        clearTimer();
        nextStep();
      }, 1000);
    }

    function startVast(i) {
      status.textContent = "Sponsored message " + (i + 1) + " of " + STEPS + " · loading video...";
      loadVastAd().then(function (ad) {
        if (!ad || !ad.url) { startUnit(i); return; }

        for (var k = 0; k < ad.impressions.length; k++) {
          try { (new Image()).src = ad.impressions[k]; } catch (e) {}
        }

        adBox.innerHTML = "";
        var inner = document.createElement("div");
        inner.className = "dg-ad-inner";
        var label = document.createElement("span");
        label.className = "dg-video-label";
        label.textContent = "Ad " + (i + 1) + "/" + STEPS;
        var v = document.createElement("video");
        v.className = "dg-video";
        v.setAttribute("playsinline", "");
        v.muted = true;
        v.src = ad.url;
        var unmute = document.createElement("button");
        unmute.type = "button";
        unmute.className = "dg-unmute";
        unmute.innerHTML = '<i class="fas fa-volume-xmark"></i> Unmute';
        inner.appendChild(v);
        adBox.appendChild(inner);
        adBox.appendChild(label);
        adBox.appendChild(unmute);
        if (ad.clickThrough) {
          v.style.cursor = "pointer";
          v.addEventListener("click", function () { window.open(ad.clickThrough, "_blank", "noopener"); });
        }

        var advanced = false;
        function advance() { if (advanced) return; advanced = true; clearTimer(); nextStep(); }
        function toUnit() { if (advanced) return; advanced = true; clearTimer(); startUnit(i); }

        v.addEventListener("ended", advance);
        v.addEventListener("error", toUnit);
        unmute.addEventListener("click", function () {
          v.muted = false;
          v.play();
          unmute.innerHTML = '<i class="fas fa-volume-high"></i> Sound on';
        });

        var elapsed = 0;
        timer = setInterval(function () {
          elapsed++;
          if (v.duration && v.currentTime) bar.style.width = Math.min(100, (v.currentTime / v.duration) * 100) + "%";
          status.textContent = "Sponsored message " + (i + 1) + " of " + STEPS + " · video";
          if (elapsed >= MAX_VIDEO_SECONDS) advance();
        }, 1000);

        var p = v.play();
        if (p && p.catch) {
          p.catch(function () {
            v.muted = true;
            try { v.play(); } catch (e) {}
          });
        }
      }).catch(function () { startUnit(i); });
    }

    function startStep(i) {
      stepIndex = i;
      paintDots();
      adBox.innerHTML = "";
      resetBar();
      clearTimer();
      if (VAST_TAG) startVast(i);
      else startUnit(i);
    }

    overlay.querySelector("#dgCancel").addEventListener("click", closeGate);
    dlBtn.addEventListener("click", function () {
      if (dlBtn.disabled) return;
      closeGate();
      try { onComplete(); } catch (e) { console.error(e); }
    });

    startStep(0);
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
