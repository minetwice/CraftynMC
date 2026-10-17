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
    ".flc-skip.ready{background:linear-gradient(135deg,#00ff88,#009955);color:#04160d;font-weight:700;cursor:pointer}"
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
    var left = Math.max(0, (st.dailyLimit || 10) - (st.watchedToday || 0));
    var ready = left > 0 && !(st.cooldownSeconds > 0);
    el.innerHTML =
      '<div class="flc-wrap"><div class="flc-card">' +
        '<h2 style="font-family:\'Outfit\',sans-serif;color:#fff;margin:0 0 6px;text-align:center">Earn Coins</h2>' +
        '<div class="flc-bal"><i class="fas fa-coins"></i> <span id="flcBalance">' + (st.coins || 0) + "</span></div>" +
        '<div class="flc-sub">Watch a short sponsored ad to earn <b style="color:gold">+' + (st.coinsPerAd || 50) + " coins</b>" +
          (st.adStreak ? ' &middot; <b style="color:gold">&#128293; ' + st.adStreak + "-day streak</b>" : "") + "</div>" +
        '<button type="button" class="flc-btn" id="flcWatch"' + (ready ? "" : " disabled") + ">" +
          '<i class="fas fa-play"></i> ' + (st.cooldownSeconds > 0 ? ("Wait " + st.cooldownSeconds + "s…") : (left > 0 ? "Watch ad & earn coins" : "Daily limit reached")) +
        "</button>" +
        '<div class="flc-meta"><span>Watched today: ' + (st.watchedToday || 0) + "/" + (st.dailyLimit || 10) +
          '</span><span>' + (st.cooldownSeconds > 0 ? ("Next ad in " + st.cooldownSeconds + "s") : "Ready") + "</span></div>" +
        '<div class="flc-msg" id="flcMsg"></div>' +
      "</div></div>";

    var btn = document.getElementById("flcWatch");
    if (btn && ready) btn.addEventListener("click", watchAd);
  }

  function refresh() {
    var t = token();
    if (!t) return;
    api("/api/coins/ad-status").then(function (r) { if (r.ok) render(r.data); });
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
