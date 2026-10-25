/* CraftynMC / FearLauncher — Download Gate
 * ------------------------------------------------------------------
 * Before an asset download starts, the visitor is shown a short gate:
 * three sponsored steps. Each step shows an ad, cycling through the
 * units in AD_UNITS, and only after all steps does the download run.
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
  var VAST_TAG = "/api/vast"; // HilltopAds Video VAST, proxied same-origin by the server

  // Adsterra banner units removed; the gate now plays the HilltopAds Video VAST
  // (proxied at /api/vast). Kept as an empty pool so the gate falls back to a
  // placeholder if the video can't load.
  var AD_UNITS = [];

  var NATIVE_BASE = "https://pl30828915.profitableratecpmnetwork.com/";
  var IFRAME_BASE = "https://www.highrevenueformat.com/";

  // Keep this SHORT. A download must never feel blocked — one quick ad, and
  // the skip is available almost immediately.
  var SECONDS_PER_AD = 10;    // the ad runs for 10 seconds (live timer shown)
  var STEPS = 1;              // a single short ad before the download unlocks
  var MAX_VIDEO_SECONDS = 10; // cap the video ad at 10s too
  var SKIP_AFTER = 3;         // "Skip" becomes clickable after just 3 seconds

  // ---- quiet mode ---------------------------------------------------------
  // While the gate is open we lift the ad-network scripts out of the page, so a
  // popunder cannot steal the click that was meant for "Download". They go back
  // afterwards. (An already-armed popunder can still fire once — that is the
  // network's behaviour, not ours — so keep only ONE popunder network.)
  var pausedScripts = [];
  var AD_SCRIPT_SELECTOR = 'script[src*="affectionatestorage"],script[src*="peacefulbicycle"],' +
    'script[src*="second-director"],script[src*="nap5k"],script[src*="quge5"]';

  function quietOn() {
    try {
      Array.prototype.forEach.call(document.querySelectorAll(AD_SCRIPT_SELECTOR), function (s) {
        pausedScripts.push({ node: s, parent: s.parentNode, next: s.nextSibling });
        if (s.parentNode) s.parentNode.removeChild(s);
      });
    } catch (e) {}
  }

  function quietOff() {
    try {
      pausedScripts.forEach(function (p) {
        if (p.parent && !p.node.parentNode) p.parent.insertBefore(p.node, p.next || null);
      });
    } catch (e) {}
    pausedScripts = [];
  }

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
    ".dg-download{width:100%;padding:16px;border-radius:13px;border:none;background:var(--gradient-main);color:#fff;font-weight:800;font-size:15.5px;cursor:pointer;box-shadow:0 6px 20px rgba(255,0,72,.35);font-family:inherit;transition:filter .15s ease,transform .12s ease}",
    ".dg-download:not(:disabled):hover{filter:brightness(1.08)}",
    ".dg-download:not(:disabled):active{transform:scale(.99)}",
    ".dg-download:disabled{opacity:.55;cursor:not-allowed;background:rgba(255,255,255,.1);box-shadow:none}",
    ".dg-cancel{margin-top:12px;background:none;border:none;color:var(--text-secondary);font-size:12px;cursor:pointer;box-shadow:none;padding:6px}",
    ".dg-cancel:hover{color:#fff;transform:none;box-shadow:none}",
    ".dg-note{margin:14px 0 0;font-size:11.5px;line-height:1.6;color:var(--text-secondary);text-align:left;background:rgba(255,255,255,.04);border:1px solid var(--border-color);border-radius:11px;padding:10px 12px}",
    ".dg-note b{color:#fff}",
    ".dg-skip{width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid var(--border-color);background:rgba(255,255,255,.04);color:var(--text-secondary);font-weight:600;font-size:13px;cursor:not-allowed;font-family:inherit;opacity:.65}",
    ".dg-skip.ready{opacity:1;cursor:pointer;color:#fff;border-color:var(--border-hover);background:rgba(255,255,255,.1)}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("dgStyles")) return;
    var st = document.createElement("style");
    st.id = "dgStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---- ad loading ---------------------------------------------------

  function loadVastAd(step) {
    if (!VAST_TAG) return Promise.resolve(null);
    var url = VAST_TAG + (VAST_TAG.indexOf("?") === -1 ? "?" : "&") + "i=" + (step || 0);
    return fetch(url, { credentials: "omit", cache: "no-store" })
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
  var skipTimer = null;

  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function clearSkipTimer() { if (skipTimer) { clearInterval(skipTimer); skipTimer = null; } }

  // Once someone has watched the ad for a file, do not make them watch it again
  // for a while. Without this, coming back to the page re-opened the gate — which
  // is exactly the "it keeps asking me to watch the ad again" loop.
  var PASS_KEY = "flGatePassed";
  var PASS_MS = 15 * 60 * 1000;   // 15 minutes per project

  function markPassed(id) {
    if (!id) return;
    try {
      var map = JSON.parse(sessionStorage.getItem(PASS_KEY) || "{}") || {};
      map[id] = Date.now() + PASS_MS;
      sessionStorage.setItem(PASS_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function hasPassed(id) {
    if (!id) return false;
    try {
      var map = JSON.parse(sessionStorage.getItem(PASS_KEY) || "{}") || {};
      return !!(map[id] && map[id] > Date.now());
    } catch (e) { return false; }
  }

  function closeGate() {
    clearTimer();
    clearSkipTimer();
    var o = document.getElementById("dgOverlay");
    if (o && o.parentNode) o.parentNode.removeChild(o);
    gateOpen = false;

    // Keep the ad networks quiet for a few more seconds: the download link opens
    // a new tab (often Google Drive) and a popunder landing on top of it is what
    // made people lose the file. Then they come back.
    setTimeout(quietOff, 8000);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // A small confirmation, because the file opens in another tab (usually Google
  // Drive) and people were losing track of it behind a popunder.
  function toast(text) {
    try {
      var t = document.getElementById("dgToast");
      if (!t) {
        t = document.createElement("div");
        t.id = "dgToast";
        t.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:10090;" +
          "max-width:92vw;text-align:center;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;" +
          "font:600 13px/1.5 system-ui,sans-serif;padding:12px 18px;border-radius:14px;" +
          "box-shadow:0 16px 40px rgba(0,0,0,.6);opacity:0;transition:opacity .22s ease";
        document.body.appendChild(t);
      }
      t.innerHTML = text;
      t.style.opacity = "1";
      clearTimeout(t.__hide);
      t.__hide = setTimeout(function () { t.style.opacity = "0"; }, 6000);
    } catch (e) {}
  }

  // Is an ad-free pass active? (bought with coins in the Coin Shop)
  function checkAdFree(cb) {
    var t = "";
    try { t = (typeof window.getToken === "function") ? window.getToken() : (localStorage.getItem("token") || ""); } catch (e) {}
    if (!t) return cb(false);
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; cb(false); } }, 2500);
    fetch("/api/coins/ad-status", { headers: { Authorization: "Bearer " + t } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!done) { done = true; clearTimeout(timer); cb(!!(d && d.adFree)); } })
      .catch(function () { if (!done) { done = true; clearTimeout(timer); cb(false); } });
  }

  function openGate(assetName, onComplete, assetId) {
    if (gateOpen) return;

    // Already watched this ad for this file recently — just hand over the file.
    if (hasPassed(assetId)) { try { onComplete(); } catch (e) {} return; }

    var units = activeUnits();
    if (!VAST_TAG && !units.length) { try { onComplete(); } catch (e) {} return; }

    // Ad-free pass (bought with coins): skip the sponsored gate entirely.
    checkAdFree(function (adFree) {
      if (adFree) { try { onComplete(); } catch (e) {} return; }
      runGate(assetName, onComplete, units, assetId);
    });
  }

  function runGate(assetName, onComplete, units, assetId) {
    if (gateOpen) return;
    injectStyles();
    gateOpen = true;
    quietOn();   // no popunder may steal the download click

    var overlay = document.createElement("div");
    overlay.className = "dg-overlay";
    overlay.id = "dgOverlay";
    overlay.innerHTML =
      '<div class="dg-modal" role="dialog" aria-modal="true">' +
        '<div class="dg-head">' +
          '<i class="fas fa-download"></i>' +
          '<div><h3>Your download is almost ready</h3>' +
            '<p class="dg-sub">' + (assetName ? esc(assetName) + " — " : "") +
            "one short ad keeps CraftynMC free. You can skip it in a few seconds.</p></div>" +
        "</div>" +
        '<div class="dg-steps"></div>' +
        '<div class="dg-ad" id="dgAd"></div>' +
        '<div class="dg-progress"><div class="dg-bar" id="dgBar"></div></div>' +
        '<div class="dg-status" id="dgStatus"></div>' +
        '<button type="button" class="dg-download" id="dgDownload" disabled><i class="fas fa-lock"></i> Please wait…</button>' +
        '<button type="button" class="dg-skip" id="dgSkip" disabled></button>' +
        '<button type="button" class="dg-cancel" id="dgCancel">Cancel download</button>' +
        // Big files live on Google Drive, and Drive shows its own "can not scan
        // for viruses" page for anything over ~100 MB. Say so up front, so nobody
        // thinks the file is unsafe.
        '<p class="dg-note">If Google Drive shows a &ldquo;can&rsquo;t scan for viruses&rdquo; page, ' +
          'just tap <b>Download anyway</b> &mdash; that is normal for large files and does not mean ' +
          'the file is unsafe.</p>' +
      "</div>";
    document.body.appendChild(overlay);

    var adBox = overlay.querySelector("#dgAd");
    var stepsBox = overlay.querySelector(".dg-steps");
    var bar = overlay.querySelector("#dgBar");
    var status = overlay.querySelector("#dgStatus");
    var dlBtn = overlay.querySelector("#dgDownload");
    var skipBtn = overlay.querySelector("#dgSkip");

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
      ready.innerHTML = '<i class="fas fa-circle-check"></i><span>Thanks! Starting your download…</span>';
      adBox.appendChild(ready);
      for (var i = 0; i < dots.length; i++) { dots[i].classList.add("done"); dots[i].classList.remove("active"); }
      bar.style.width = "100%";
      status.textContent = "Starting automatically — if nothing happens, tap the button.";
      dlBtn.disabled = false;
      dlBtn.innerHTML = '<i class="fas fa-download"></i> Download now';

      // Remember it, so this file never asks for another ad for the next 15 min.
      markPassed(assetId);

      // Start it for them. One less thing to do, and nothing to get stuck on.
      setTimeout(function () {
        if (!gateOpen) return;
        try { dlBtn.click(); } catch (e) {}
        setTimeout(function () {
          toast("Download opened in a new tab \u2014 if you do not see it, check your tabs. " +
                "You will not have to watch another ad for this file.");
        }, 1400);
      }, 900);
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
      loadVastAd(i).then(function (ad) {
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

    // Timer-gated Skip: the button counts down, then becomes clickable.
    var skipLeft = SKIP_AFTER;
    if (skipLeft > 0) {
      skipBtn.textContent = "Skip ads in " + skipLeft + "s";
      skipTimer = setInterval(function () {
        skipLeft--;
        if (skipLeft <= 0) {
          clearSkipTimer();
          skipBtn.disabled = false;
          skipBtn.classList.add("ready");
          skipBtn.innerHTML = '<i class="fas fa-forward"></i> Skip ads';
          return;
        }
        skipBtn.textContent = "Skip ads in " + skipLeft + "s";
      }, 1000);
    } else {
      skipBtn.disabled = false;
      skipBtn.classList.add("ready");
      skipBtn.innerHTML = '<i class="fas fa-forward"></i> Skip ads';
    }
    skipBtn.addEventListener("click", function () {
      if (skipBtn.disabled) return;
      finish();
    });

    startStep(0);
  }

  // ---- hook into the page's download function -----------------------
  // ------------------------------------------------------------------
  // ONE SWITCH. Set to true to put the sponsored ad back in front of a
  // download; leave it false and tapping Download starts the file instantly,
  // which is what people actually want. Ads still earn from the four banner
  // slots, the popunder, the in-page push and the video slider either way.
  var GATE_ENABLED = false;

  function init() {
    injectStyles();

    var orig = window.purchaseAndDownloadAsset;
    if (typeof orig !== "function" || orig.__flGated) return;

    // Gate off: start the file immediately, but still keep the ad networks quiet
    // for a few seconds so a popunder cannot steal the tab the download opens in.
    if (!GATE_ENABLED) {
      var instant = function (id) {
        quietOn();
        try { orig.call(window, id); } finally { setTimeout(quietOff, 8000); }
      };
      instant.__flGated = true;
      window.purchaseAndDownloadAsset = instant;
      window.FearLauncherGate = { open: openGate, close: closeGate, enabled: false };
      return;
    }

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
      openGate(name, function () { orig.call(window, id); }, id);
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
