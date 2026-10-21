/* CraftynMC / FearLauncher — deep links (shareable page links)
 * ------------------------------------------------------------------
 * Every section gets its own URL, e.g.
 *   craftynmc.onrender.com/#plugins
 *   craftynmc.onrender.com/#player-lookup
 *
 *   - Opening such a link lands straight on that page (waiting for login if
 *     the player is not signed in yet).
 *   - A "copy link" button in the top bar copies the current page's link,
 *     ready to paste in Discord / WhatsApp / YouTube.
 *   - Browser Back / Forward move between pages.
 *
 * NOTE: this only touches location.hash, which does NOT reload the page — so
 * the ads already on screen are never re-requested (a reload would kill them).
 */
(function () {
  "use strict";

  var BTN_ID = "flShareBtn";
  var SKIP = { authView: 1 };   // never link to the login screen

  var pending = null;   // a #link we still have to open (e.g. before login)
  var last = "";        // last page we wrote into the URL

  /* ---------- helpers ---------- */
  function hashId() {
    return String(location.hash || "").replace(/^#\/?/, "");
  }

  function sectionIds() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll(".section"), function (s) {
      if (s.id && !SKIP[s.id]) out.push(s.id);
    });
    return out;
  }

  function currentSection() {
    var a = document.querySelector(".nav-item[data-section].active");
    if (a) {
      var id = a.getAttribute("data-section");
      if (id && !SKIP[id]) return id;
    }
    var s = document.querySelector(".section.active");
    return (s && s.id && !SKIP[s.id]) ? s.id : "";
  }

  function loggedIn() {
    var auth = document.getElementById("authView");
    return !(auth && auth.classList.contains("active"));
  }

  function highlight(id) {
    var a = document.querySelector('.nav-item[data-section="' + id + '"]');
    if (!a) return;
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (i) { i.classList.remove("active"); });
    a.classList.add("active");
  }

  /* ---------- open the page named in the URL ---------- */
  function tryApply() {
    if (!pending) return;
    if (sectionIds().indexOf(pending) === -1) return;   // that page does not exist
    if (!loggedIn()) return;                            // wait until after login
    var id = pending;
    pending = null;
    if (typeof window.showSection === "function") window.showSection(id);
    highlight(id);
    last = id;
  }

  /* ---------- keep the URL in step with the page ---------- */
  function syncHash() {
    if (pending) return;                 // a link is still waiting to be opened
    var id = currentSection();
    if (!id || id === last) return;
    last = id;
    if (hashId() === id) return;
    try {
      location.hash = id;                // pushes history, so Back/Forward work
    } catch (e) {
      try { history.replaceState(null, "", "#" + id); } catch (e2) {}
    }
  }

  /* ---------- copy the current page link ---------- */
  function pageUrl() {
    var id = currentSection();
    return location.origin + location.pathname + (id ? "#" + id : "");
  }

  function toast(text) {
    var t = document.getElementById("flShareToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "flShareToast";
      t.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:10095;" +
        "background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font:600 13px system-ui,sans-serif;" +
        "padding:11px 18px;border-radius:12px;box-shadow:0 14px 36px rgba(0,0,0,.6);opacity:0;transition:opacity .2s;" +
        "max-width:90vw;word-break:break-all;text-align:center";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.style.opacity = "1";
    clearTimeout(t.__hide);
    t.__hide = setTimeout(function () { t.style.opacity = "0"; }, 2000);
  }

  function legacyCopy(url) {
    try {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, url.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyLink() {
    var url = pageUrl();
    function ok() { toast("🔗 Link copied — paste it anywhere!"); }
    function fallback() { if (legacyCopy(url)) ok(); else toast(url); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok).catch(fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  /* ---------- the button in the top bar ---------- */
  function injectButton() {
    if (document.getElementById(BTN_ID)) return;
    if (!loggedIn()) return;                       // not on the login screen
    var bar = document.querySelector(".top-bar");
    if (!bar) return;

    var b = document.createElement("button");
    b.id = BTN_ID;
    b.type = "button";
    b.title = "Copy a link to this page";
    b.setAttribute("aria-label", "Copy a link to this page");
    b.innerHTML = '<i class="fas fa-link"></i><span>Copy link</span>';
    b.style.cssText = "display:inline-flex;align-items:center;justify-content:center;gap:7px;" +
      "width:auto;padding:10px 14px;border-radius:12px;border:1px solid var(--border-color);" +
      "background:rgba(255,255,255,.05);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer";
    b.addEventListener("click", copyLink);

    var coin = bar.querySelector(".coin-display");
    if (coin && coin.parentNode === bar) bar.insertBefore(b, coin);
    else bar.appendChild(b);
  }

  /* ---------- boot ---------- */
  function boot() {
    var h = hashId();
    if (h) pending = h;          // remember the incoming link
    injectButton();
    tryApply();
    syncHash();
  }

  window.addEventListener("hashchange", function () {
    var h = hashId();
    if (h && h !== currentSection()) pending = h;   // Back/Forward, or a pasted link
    tryApply();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // After login the sections appear — keep trying the pending link, then keep
  // the URL honest. Stops after ~20s so nothing runs forever.
  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    injectButton();
    tryApply();
    syncHash();
    if (tries > 16) clearInterval(timer);
  }, 1200);

  window.FearLauncherLinks = {
    copy: copyLink,
    url: pageUrl,
    open: function (id) { pending = id; tryApply(); }
  };
})();
