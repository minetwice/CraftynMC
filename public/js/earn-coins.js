/* CraftynMC / FearLauncher — Earn Coins (watch ads)
 * ------------------------------------------------------------------
 * Adds an "Earn Coins" item to the sidebar and a section where a player
 * watches a sponsored ad (HilltopAds VAST via the same-origin /api/vast
 * proxy) to earn coins. No payments anywhere — ads are the coin faucet.
 *
 * Server rules (see src/routes/coins.js):
 *   +50 coins per ad · max 10 ads/day · 45s between ads
 */
(function () {
  "use strict";

  var SEC_ID = "earn-coins";
  var NAV_ID = "flEarnNav";
  var AD_SECONDS = 15;

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken(); } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) { return ""; }
  }

  var CSS = [
    ".flc-wrap{max-width:620px}",
    ".flc-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:18px;padding:20px}",
    ".flc-bal{display:flex;align-items:center;justify-content:center;gap:10px;font-family:'Outfit',sans-serif;font-size:34px;font-weight:800;color:gold;margin:6px 0 2px}",
    ".flc-sub{text-align:center;color:var(--text-secondary);font-size:13px;margin-bottom:16px}",
    ".flc-btn{width:100%;padding:15px;border:none;border-radius:14px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}",
    ".flc-btn[disabled]{opacity:.5;cursor:not-allowed}",
    ".flc-meta{display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-top:12px}",
    ".flc-msg{text-align:center;font-size:13px;margin-top:12px;min-height:18px}",
    ".flc-ok{color:#00ff88}",
    ".flc-err{color:#ff6b8b}",
    ".flc-ov{position:fixed;inset:0;background:rgba(4,5,10,.95);z-index:10070;display:flex;align-items:center;justify-content:center;padding:18px}",
    ".flc-modal{background:var(--bg-card);border:1px solid var(--border-hover);border-radius:20px;width:min(680px,100%);padding:18px;box-shadow:0 30px 80px rgba(0,0,0,.85)}",
    ".flc-modal h3{margin:0 0 4px;font-family:'Outfit',sans-serif;color:#fff;font-size:16px}",
    ".flc-timer{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-secondary);margin-bottom:10px}",
    ".flc-video{width:100%;background:#000;border-radius:12px;min-height:220px;display:block}",
    ".flc-skip{margin-top:12px;width:100%;padding:12px;border:none;border-radius:12px;background:rgba(255,255,255,.06);color:var(--text-secondary);font-family:inherit;font-size:13px;cursor:not-allowed}",
    ".flc-skip.ready{background:linear-gradient(135deg,#00ff88,#009955);color:#04160d;font-weight:700;cursor:pointer}",

    /* ---- redesign: hero, dot progress, big CTA, perks, ad slot ---- */
    ".flc-hero{position:relative;overflow:hidden;border:1px solid var(--border-color);border-radius:20px;padding:26px 20px 22px;text-align:center;",
      "background:radial-gradient(600px 260px at 50% -10%,rgba(255,215,0,.16),transparent 70%),var(--bg-card);margin-bottom:16px}",
    ".flc-lbl{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-secondary);margin:0 0 10px;font-weight:700}",
    ".flc-big{display:flex;align-items:center;justify-content:center;gap:11px;font-family:'Outfit',sans-serif;",
      "font-size:clamp(32px,7vw,46px);font-weight:800;color:gold;line-height:1;margin:0 0 6px}",
    ".flc-cap{font-size:13px;color:var(--text-secondary);margin:0}",
    ".flc-dots{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:18px 0 8px}",
    ".flc-dot{width:19px;height:19px;border-radius:7px;background:rgba(255,255,255,.08);border:1px solid var(--border-color);",
      "display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--text-secondary);transition:all .2s ease}",
    ".flc-dot.on{background:linear-gradient(135deg,#ffd700,#c99a00);border-color:gold;color:#1a1400;font-weight:800}",
    ".flc-left{font-size:12.5px;color:var(--text-secondary);margin:0 0 16px}",
    ".flc-cta{width:100%;padding:17px;border:none;border-radius:15px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;",
      "font-weight:800;font-size:15.5px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;",
      "box-shadow:0 10px 28px -10px var(--primary-glow);transition:filter .15s ease,transform .12s ease}",
    ".flc-cta:hover:not([disabled]){filter:brightness(1.08)}",
    ".flc-cta:active:not([disabled]){transform:scale(.99)}",
    ".flc-cta[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none}",
    ".flc-perks{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}",
    ".flc-perk{font-size:12px;color:#fff;background:rgba(255,255,255,.05);border:1px solid var(--border-color);",
      "border-radius:999px;padding:6px 13px;display:inline-flex;align-items:center;gap:7px}",
    ".flc-perk b{color:gold}",
    ".flc-adslot{margin-top:16px}",
    ".flc-hint{text-align:center;font-size:12px;color:var(--text-secondary);margin:14px 0 0;line-height:1.6}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flcStyles")) return;
    var st = document.createElement("style");
    st.id = "flcStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function api(path, opts) {
    var t = token();
    var o = opts || {};
    o.headers = o.headers || {};
    o.headers.Authorization = "Bearer " + t;
    return fetch(path, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; });
    });
  }

  // Parse the VAST the same way the download gate does (handles <![CDATA[...]]>).
  function vastMedia(i) {
    return fetch("/api/vast?i=" + i)
      .then(function (r) { return r.text(); })
      .then(function (xml) {
        var doc = new DOMParser().parseFromString(String(xml), "text/xml");
        if (!doc || typeof doc.querySelectorAll !== "function") return "";
        var mfs = doc.querySelectorAll("MediaFile");
        var chosen = "";
        Array.prototype.forEach.call(mfs, function (mf) {
          if (chosen) return;
          var type = mf.getAttribute("type") || "";
          var url = (mf.textContent || "").trim();
          if (!url) return;
          if (type.indexOf("mp4") !== -1 || url.indexOf(".mp4") !== -1) chosen = url;
        });
        if (!chosen && mfs.length) chosen = (mfs[0].textContent || "").trim();
        return chosen;
      })
      .catch(function () { return ""; });
  }

  function render(st) {
    var el = document.getElementById(SEC_ID);
    if (!el) return;
    var limit = st.dailyLimit || 10;
    var done = Math.min(limit, st.watchedToday || 0);
    var left = Math.max(0, limit - done);
    var per = st.coinsPerAd || 50;
    var ready = left > 0 && !(st.cooldownSeconds > 0);

    // one square per ad, filled as you go
    var dots = "";
    for (var i = 0; i < limit; i++) {
      dots += '<span class="flc-dot' + (i < done ? " on" : "") + '">' + (i < done ? "\u2713" : i + 1) + "</span>";
    }

    var label = st.cooldownSeconds > 0
      ? '<i class="fas fa-hourglass-half"></i> Next ad in ' + st.cooldownSeconds + "s"
      : (left > 0
          ? '<i class="fas fa-play"></i> Watch an ad \u00b7 earn +' + per + " coins"
          : '<i class="fas fa-check"></i> All ' + limit + " ads watched today");

    var perks =
      '<span class="flc-perk"><i class="fas fa-coins" style="color:gold"></i> <b>+' + per + "</b> per ad</span>" +
      (st.adStreak ? '<span class="flc-perk">\uD83D\uDD25 <b>' + st.adStreak + "</b>-day streak</span>" : "") +
      '<span class="flc-perk"><i class="fas fa-clock"></i> resets daily</span>';

    el.innerHTML =
      '<div class="flc-wrap">' +
        '<div class="flc-hero">' +
          '<p class="flc-lbl">Your balance</p>' +
          '<div class="flc-big"><i class="fas fa-coins"></i><span id="flcBalance">' + (st.coins || 0) + "</span></div>" +
          '<p class="flc-cap">Watch a short sponsored ad \u2014 get coins instantly.</p>' +
          '<div class="flc-dots">' + dots + "</div>" +
          '<p class="flc-left">' + done + " of " + limit + " ads watched today" +
            (left > 0 ? " \u00b7 " + left + " left" : " \u00b7 come back tomorrow") + "</p>" +
          '<button type="button" class="flc-cta" id="flcWatch"' + (ready ? "" : " disabled") + ">" + label + "</button>" +
          '<div class="flc-perks">' + perks + "</div>" +
          '<div class="flc-msg" id="flcMsg"></div>' +
        "</div>" +
        '<div class="flc-adslot" id="flcAd"></div>' +
        '<p class="flc-hint">Ads are what keep CraftynMC free. Watching one gives you coins and supports the project.</p>' +
        referralCard() +
      "</div>";

    fillAdSlot();

    var btn = document.getElementById("flcWatch");
    if (btn && ready) btn.addEventListener("click", watchAd);

    var cp = document.getElementById("flcCopyRef");
    if (cp && referral) cp.addEventListener("click", function () {
      var link = (referral.link || "").indexOf("http") === 0 ? referral.link : (location.origin + "/?ref=" + (referral.code || ""));
      try { navigator.clipboard.writeText(link); } catch (e) {}
      cp.innerHTML = '<i class="fas fa-check"></i> Copied!';
    });
  }

  // A banner inside the Earn Coins page — this is the page where people are
  // already happy to see ads, so it is the best place for one.
  var adTries = 0;
  function fillAdSlot() {
    var el = document.getElementById("flcAd");
    if (!el) return;
    var B = window.FearLauncherBanners;
    if (!B || typeof B.fill !== "function") {
      if (adTries++ < 12) setTimeout(fillAdSlot, 700);
      return;
    }
    B.fill(el, 1);
  }

  var referral = null;
  var lastStatus = null;

  function referralCard() {
    if (!referral) return "";
    return '<div class="flc-card" style="margin-top:14px">' +
      '<h3 style="font-family:\'Outfit\',sans-serif;color:#fff;margin:0 0 6px">Refer &amp; Earn</h3>' +
      '<p class="flc-sub" style="text-align:left;margin:0 0 12px">Share your code — you and your friend each get <b style="color:gold">+' +
        (referral.reward || 200) + " coins</b> when they sign up.</p>" +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<code style="flex:1;min-width:180px;background:rgba(0,0,0,.4);border:1px solid var(--border-color);border-radius:10px;padding:10px 12px;color:gold;font-family:ui-monospace,Menlo,Consolas,monospace">' +
          (referral.code || "") + "</code>" +
        '<button type="button" class="flc-btn" id="flcCopyRef" style="width:auto;padding:10px 16px"><i class="fas fa-copy"></i> Copy link</button>' +
      "</div>" +
      '<div class="flc-meta"><span>Friends joined: ' + (referral.referralCount || 0) +
        '</span><span>Coins earned: ' + (referral.coinsEarned || 0) + "</span></div>" +
    "</div>";
  }

  function refresh() {
    var t = token();
    if (!t) return;
    Promise.all([api("/api/coins/ad-status"), api("/api/referral")]).then(function (out) {
      if (out[0] && out[0].ok) lastStatus = out[0].data;
      if (out[1] && out[1].ok) referral = out[1].data;
      if (lastStatus) render(lastStatus);
    });
  }

  function watchAd() {
    var msg = document.getElementById("flcMsg");
    if (msg) { msg.className = "flc-msg"; msg.textContent = "Loading ad…"; }

    vastMedia(Date.now() % 3).then(function (src) {
      var ov = document.createElement("div");
      ov.className = "flc-ov";
      ov.innerHTML =
        '<div class="flc-modal">' +
          '<h3><i class="fas fa-bullhorn" style="color:var(--primary-red)"></i> Sponsored ad</h3>' +
          '<div class="flc-timer"><span>Watch to the end to earn coins</span><span id="flcCount">' + AD_SECONDS + "s</span></div>" +
          (src
            ? '<video class="flc-video" id="flcVideo" playsinline autoplay></video>'
            : '<div class="flc-video" style="display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:13px">No ad available right now — wait it out to claim.</div>') +
          '<button type="button" class="flc-skip" id="flcSkip">Skip</button>' +
        "</div>";
      document.body.appendChild(ov);

      var done = false;
      var left = AD_SECONDS;
      var countEl = ov.querySelector("#flcCount");
      var skip = ov.querySelector("#flcSkip");
      var video = ov.querySelector("#flcVideo");

      if (video && src) {
        video.src = src;
        if (typeof video.play === "function") {
          var p = video.play();
          if (p && p.catch) p.catch(function () { video.muted = true; try { video.play(); } catch (e) {} });
        }
      }

      function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }

      function finish() {
        if (done) return;
        done = true;
        clearInterval(iv);
        close();
        award();
      }

      var iv = setInterval(function () {
        left--;
        if (countEl) countEl.textContent = Math.max(0, left) + "s";
        if (left <= 5) { skip.classList.add("ready"); skip.textContent = "Skip & claim"; }
        if (left <= 0) finish();
      }, 1000);

      skip.addEventListener("click", function () { if (left <= 5) finish(); });
      if (video) video.addEventListener("ended", finish);
    });
  }

  function award() {
    api("/api/coins/watch-ad", { method: "POST" })
      .then(function (r) {
        var msg = document.getElementById("flcMsg");
        if (r.ok) {
          if (msg) { msg.className = "flc-msg flc-ok"; msg.textContent = r.data.message || "Coins added!"; }
          var b = document.getElementById("flcBalance");
          if (b && typeof r.data.newBalance === "number") b.textContent = r.data.newBalance;
          try { if (typeof window.loadDashboard === "function") setTimeout(window.loadDashboard, 600); } catch (e) {}
          setTimeout(refresh, 1500);
        } else if (msg) {
          msg.className = "flc-msg flc-err";
          msg.textContent = r.data.error || "Could not add coins.";
          refresh();
        }
      })
      .catch(function () { refresh(); });
  }

  function place() {
    var main = document.querySelector("main.main-content") || document.querySelector("main");
    var nav = document.querySelector(".nav-section");
    if (!main || !nav) return;

    if (!document.getElementById(SEC_ID)) {
      var sec = document.createElement("div");
      sec.id = SEC_ID;
      sec.className = "section";
      main.appendChild(sec);
    }
    if (!document.getElementById(NAV_ID)) {
      injectStyles();
      var a = document.createElement("a");
      a.className = "nav-item";
      a.id = NAV_ID;
      a.setAttribute("data-section", SEC_ID);
      a.innerHTML = '<i class="fas fa-coins"></i><span>Earn Coins</span>';
      a.addEventListener("click", function () {
        if (typeof window.showSection === "function") window.showSection(SEC_ID);
        document.querySelectorAll(".nav-item").forEach(function (i) { i.classList.remove("active"); });
        a.classList.add("active");
        var sb = document.getElementById("sidebar");
        if (sb) sb.classList.remove("mobile-open");
        refresh();
      });
      nav.appendChild(a);
    }

    var sec = document.getElementById(SEC_ID);
    if (sec && sec.classList.contains("active") && !document.getElementById("flcWatch")) refresh();
  }

  function init() {
    place();
    setInterval(place, 20000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
