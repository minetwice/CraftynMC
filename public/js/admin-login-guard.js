/* CraftynMC / FearLauncher — Admin login guard + security-code field
 * ------------------------------------------------------------------
 * The admin security code is checked SERVER-side against the
 * ADMIN_SECURITY_CODE env var — nothing in this file knows the value.
 *
 * What it does:
 *   1) Hides the separate "Admin Portal" button; everyone signs in from the
 *      normal login form.
 *   2) Puts a clearly-labelled "Admin security code" input right in the login
 *      form, so an admin always sees exactly where to type it.
 *   3) Sends that code with the /login request.
 *   4) If the server still says it needs a code, shows a popup to enter it.
 *
 * NOTE: upload-guard.js resets window.fetch to native a few times after load,
 * which would silently kill our wrapper. So we re-install ours on a timer and
 * again in the CAPTURE phase of a click/keydown (which always runs before the
 * page's own handler), so the code can never be dropped.
 */
(function () {
  "use strict";

  var FIELD_ID = "flSecCode";
  var WRAP_ID = "flSecWrap";

  var nativeFetch = window.fetch;   // the true native, captured before we wrap

  /* ---------- 1. hide the separate Admin Portal button ---------- */
  function hideAdminButton() {
    var b = document.getElementById("adminLoginBtn");
    if (b) b.style.display = "none";
    var m = document.getElementById("adminLoginModal");
    if (m) m.style.display = "none";
  }

  /* ---------- 2. the visible security-code field ---------- */
  function injectField() {
    if (document.getElementById(WRAP_ID)) return;
    var pw = document.getElementById("loginPassword");
    if (!pw || !pw.parentNode) return;

    var wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.cssText = "margin-top:12px;text-align:left";
    wrap.innerHTML =
      '<label for="' + FIELD_ID + '" style="display:block;font-size:11px;font-weight:700;letter-spacing:.5px;' +
        'color:var(--text-secondary);margin-bottom:6px">ADMIN SECURITY CODE ' +
        '<span style="opacity:.7;font-weight:400">(admins only)</span></label>' +
      '<input id="' + FIELD_ID + '" type="password" autocomplete="off" ' +
        'placeholder="Leave empty if you are a player" ' +
        'style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;' +
        'border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;' +
        'font-size:14px;font-family:inherit;letter-spacing:1px" />' +
      '<p style="margin:6px 0 0;font-size:11px;color:var(--text-secondary);line-height:1.5">' +
        'Normal players do not need this — leave it empty. Admin accounts enter the code ' +
        'set in the server environment.</p>';
    pw.parentNode.insertBefore(wrap, pw.nextSibling);
  }

  function codeValue() {
    var f = document.getElementById(FIELD_ID);
    return f && typeof f.value === "string" ? f.value.trim() : "";
  }

  /* ---------- 3. attach the code to /login requests ---------- */
  function withCode(opts, code) {
    if (!code) return opts;
    var o = {};
    for (var k in opts) o[k] = opts[k];
    try {
      var b = JSON.parse(opts.body);
      b.securityCode = code;
      o.body = JSON.stringify(b);
    } catch (e) { return opts; }
    return o;
  }

  function isLoginPost(url, opts) {
    var u = String(url || "");
    return u.indexOf("/login") !== -1 && u.indexOf("/register") === -1 &&
      opts && String(opts.method || "").toUpperCase() === "POST";
  }

  /* ---------- 4. fallback popup ---------- */
  function askCode(wrong) {
    return new Promise(function (resolve) {
      var old = document.getElementById("flCodeOverlay");
      if (old && old.parentNode) old.parentNode.removeChild(old);

      var ov = document.createElement("div");
      ov.id = "flCodeOverlay";
      ov.style.cssText = "position:fixed;inset:0;background:rgba(4,5,10,.94);z-index:10060;" +
        "display:flex;align-items:center;justify-content:center;padding:20px";
      ov.innerHTML =
        '<div style="background:var(--bg-card);border:1px solid var(--border-hover);border-radius:20px;' +
          'width:min(440px,100%);padding:26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.8)">' +
          '<div style="font-size:34px;color:var(--primary-red);margin-bottom:8px"><i class="fas fa-user-shield"></i></div>' +
          "<h3 style=\"margin:0 0 6px;font-family:'Outfit',sans-serif;color:#fff\">Admin security code</h3>" +
          '<p style="margin:0 0 14px;font-size:12.5px;color:var(--text-secondary);line-height:1.55">' +
            'This account is an admin, so it needs the security code. Type it here — ' +
            'it is also saved into the field on the login form.</p>' +
          (wrong ? '<p style="margin:0 0 10px;font-size:12.5px;color:#ff6b8b">Wrong code — try again.</p>' : "") +
          '<input id="flCodeInput" type="password" autocomplete="off" placeholder="Security code" ' +
            'style="width:100%;box-sizing:border-box;padding:13px 14px;border-radius:12px;' +
            'border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-size:15px;' +
            'letter-spacing:2px;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace" />' +
          '<button type="button" id="flCodeGo" style="width:100%;margin-top:12px;padding:14px;border:none;' +
            'border-radius:12px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;' +
            'cursor:pointer;font-family:inherit">Unlock admin</button>' +
          '<button type="button" id="flCodeCancel" style="width:100%;margin-top:8px;padding:10px;border:none;' +
            'background:none;color:var(--text-secondary);cursor:pointer;font-family:inherit;font-size:12px">Cancel</button>' +
        "</div>";
      document.body.appendChild(ov);

      var input = ov.querySelector("#flCodeInput");
      try { input.focus(); } catch (e) {}

      function done(val) {
        var f = document.getElementById(FIELD_ID);
        if (f && val != null) f.value = val;      // keep the inline field in sync
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        resolve(val);
      }
      ov.querySelector("#flCodeGo").addEventListener("click", function () { done(input.value); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") done(input.value); });
      ov.querySelector("#flCodeCancel").addEventListener("click", function () { done(null); });
    });
  }

  function loginFlow(url, opts, tries) {
    var send = withCode(opts, codeValue());
    return nativeFetch.call(window, url, send).then(function (res) {
      if (res.status !== 403 || tries <= 0) return res;
      return res.clone().json().then(function (d) {
        if (!d || !d.codeRequired) return res;
        return askCode(tries < 2).then(function (code) {
          if (code == null || code === "") return res;
          return loginFlow(url, opts, tries - 1);
        });
      }).catch(function () { return res; });
    });
  }

  var wrapped = function (url, opts) {
    if (isLoginPost(url, opts)) return loginFlow(url, opts, 2);
    return nativeFetch.apply(this, arguments);
  };

  function install() {
    try {
      if (window.fetch !== wrapped) window.fetch = wrapped;
    } catch (e) {}
  }

  /* ---------- boot ---------- */
  function init() {
    injectField();
    install();
    hideAdminButton();
  }

  // upload-guard.js resets fetch at ~0/300/1200ms — keep ours on top.
  function schedule() {
    init();
    [200, 500, 900, 1500, 2500, 4000].forEach(function (t) { setTimeout(init, t); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }

  // Re-install in the capture phase — always runs before the page's handler.
  document.addEventListener("click", init, true);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") init();
  }, true);
  setInterval(init, 2000);
})();
