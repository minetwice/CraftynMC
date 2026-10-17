/* CraftynMC / FearLauncher — Admin login guard
 * ------------------------------------------------------------------
 * 1) Hides the separate "Admin Portal" button: admins sign in from the
 *    normal login form.
 * 2) When the server answers a login with { codeRequired: true } (i.e. the
 *    account is an admin and no/incorrect security code was sent), it shows
 *    a security-code board and retries the SAME login with the code.
 *
 * The code itself is never stored in this file — it is verified server-side
 * against the ADMIN_SECURITY_CODE environment variable.
 */
(function () {
  "use strict";

  var MAX_TRIES = 3;

  function hideAdminButton() {
    var b = document.getElementById("adminLoginBtn");
    if (b) b.style.display = "none";
    var m = document.getElementById("adminLoginModal");
    if (m) m.style.display = "none";
  }

  function askCode(wrong) {
    return new Promise(function (resolve) {
      var old = document.getElementById("flCodeOverlay");
      if (old && old.parentNode) old.parentNode.removeChild(old);

      var ov = document.createElement("div");
      ov.id = "flCodeOverlay";
      ov.style.cssText = "position:fixed;inset:0;background:rgba(4,5,10,.94);z-index:10060;display:flex;align-items:center;justify-content:center;padding:20px";
      ov.innerHTML =
        '<div style="background:var(--bg-card);border:1px solid var(--border-hover);border-radius:20px;width:min(440px,100%);padding:26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.8)">' +
          '<div style="font-size:34px;color:var(--primary-red);margin-bottom:8px"><i class="fas fa-user-shield"></i></div>' +
          '<h3 style="margin:0 0 6px;font-family:\'Outfit\',sans-serif;color:#fff">Admin security check</h3>' +
          '<p style="margin:0 0 14px;font-size:12px;color:var(--text-secondary)">Enter the admin security code to continue.</p>' +
          (wrong ? '<p style="margin:0 0 10px;font-size:12px;color:#ff6b8b">Wrong code — try again.</p>' : "") +
          '<input id="flCodeInput" type="password" autocomplete="off" placeholder="Security code" ' +
            'style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-size:14px;letter-spacing:2px;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace" />' +
          '<button type="button" id="flCodeGo" style="width:100%;margin-top:12px;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;cursor:pointer;font-family:inherit">Unlock admin</button>' +
          '<button type="button" id="flCodeCancel" style="width:100%;margin-top:8px;padding:10px;border:none;background:none;color:var(--text-secondary);cursor:pointer;font-family:inherit;font-size:12px">Cancel</button>' +
        "</div>";
      document.body.appendChild(ov);

      var input = ov.querySelector("#flCodeInput");
      try { input.focus(); } catch (e) {}

      function done(val) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        resolve(val);
      }
      ov.querySelector("#flCodeGo").addEventListener("click", function () { done(input.value); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") done(input.value); });
      ov.querySelector("#flCodeCancel").addEventListener("click", function () { done(null); });
    });
  }

  function withCode(baseOpts, code) {
    var o = {};
    for (var k in baseOpts) o[k] = baseOpts[k];
    try {
      var b = JSON.parse(baseOpts.body);
      b.securityCode = code;
      o.body = JSON.stringify(b);
    } catch (e) { return null; }
    return o;
  }

  if (!window.__flAdminLoginGuard && typeof window.fetch === "function") {
    window.__flAdminLoginGuard = true;
    var origFetch = window.fetch;

    function tryLogin(url, opts, tries) {
      return origFetch.call(window, url, opts).then(function (res) {
        if (res.status !== 403) return res;
        return res.clone().json().then(function (d) {
          if (!d || !d.codeRequired || tries <= 0) return res;
          return askCode(tries < MAX_TRIES).then(function (code) {
            if (code == null || code === "") return res;   // cancelled
            var next = withCode(opts, code);
            if (!next) return res;
            return tryLogin(url, next, tries - 1);
          });
        });
      });
    }

    window.fetch = function (url, opts) {
      var u = String(url || "");
      var isLogin = u.indexOf("/login") !== -1 && u.indexOf("/register") === -1 &&
        opts && String(opts.method || "").toUpperCase() === "POST";
      if (!isLogin) return origFetch.apply(this, arguments);
      return tryLogin(url, opts, MAX_TRIES);
    };
  }

  function init() {
    hideAdminButton();
    setInterval(hideAdminButton, 1000);   // in case the button is re-rendered
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
