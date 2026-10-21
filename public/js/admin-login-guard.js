/* CraftynMC / FearLauncher — Admin login guard + security-code reveal
 * ------------------------------------------------------------------
 * The admin security code is checked SERVER-side against the
 * ADMIN_SECURITY_CODE env var — nothing in this file knows the value.
 *
 * Flow (exactly how it should feel):
 *   1) The login form shows only Username + Password — clean, for everyone.
 *   2) An admin types their username + password and presses Log In.
 *   3) The server answers "this account is an admin, give me the code".
 *      ONLY THEN does the "Admin security code" field appear, with a note.
 *   4) They type the code and press Log In again -> they are in.
 *
 * The separate "Admin Portal" button is hidden (everyone signs in normally).
 *
 * NOTE: upload-guard.js resets window.fetch to native a few times after load,
 * which would silently kill our wrapper. So we re-install ours on a timer and
 * again in the CAPTURE phase of a click/keydown, which always runs before the
 * page's own handler.
 */
(function () {
  "use strict";

  var FIELD_ID = "flSecCode";
  var WRAP_ID = "flSecWrap";
  var NOTE_ID = "flSecNote";

  var nativeFetch = window.fetch;   // the true native, captured before we wrap

  /* ---------- hide the separate Admin Portal button ---------- */
  function hideAdminButton() {
    var b = document.getElementById("adminLoginBtn");
    if (b) b.style.display = "none";
    var m = document.getElementById("adminLoginModal");
    if (m) m.style.display = "none";
  }

  /* ---------- the code field (built hidden, revealed on demand) ---------- */
  function buildField() {
    if (document.getElementById(WRAP_ID)) return true;
    var pw = document.getElementById("loginPassword");
    if (!pw || !pw.parentNode) return false;

    var wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.cssText = "margin-top:12px;text-align:left;display:none";
    wrap.innerHTML =
      '<div id="' + NOTE_ID + '" style="display:none;margin-bottom:8px;padding:10px 12px;border-radius:11px;' +
        'background:rgba(255,0,72,.1);border:1px solid rgba(255,0,72,.35);color:#ff9bb4;font-size:12px;line-height:1.5"></div>' +
      '<label for="' + FIELD_ID + '" style="display:block;font-size:11px;font-weight:700;letter-spacing:.5px;' +
        'color:var(--text-secondary);margin-bottom:6px">ADMIN SECURITY CODE</label>' +
      '<input id="' + FIELD_ID + '" type="password" autocomplete="off" placeholder="Enter the admin security code" ' +
        'style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;' +
        'border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;' +
        'font-size:14px;font-family:inherit;letter-spacing:1px" />' +
      '<p style="margin:6px 0 0;font-size:11px;color:var(--text-secondary);line-height:1.5">' +
        'Then press Log In again.</p>';
    pw.parentNode.insertBefore(wrap, pw.nextSibling);
    return true;
  }

  function reveal(message) {
    if (!buildField()) return;
    var w = document.getElementById(WRAP_ID);
    if (w) w.style.display = "block";
    var note = document.getElementById(NOTE_ID);
    if (note) {
      note.textContent = message || "";
      note.style.display = message ? "block" : "none";
    }
    var f = document.getElementById(FIELD_ID);
    try { if (f) f.focus(); } catch (e) {}
  }

  function codeValue() {
    var f = document.getElementById(FIELD_ID);
    return f && typeof f.value === "string" ? f.value.trim() : "";
  }

  /* ---------- attach the code to /login requests ---------- */
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

  /* ---------- watch the login: reveal the field only when an admin logs in ---------- */
  function loginFlow(url, opts) {
    var send = withCode(opts, codeValue());
    return nativeFetch.call(window, url, send).then(function (res) {
      if (res.status !== 403) return res;
      return res.clone().json().then(function (d) {
        if (!d || !d.codeRequired) return res;      // normal player -> nothing extra
        reveal(codeValue()
          ? "Wrong code — check it and press Log In again."
          : "This is an admin account. Enter the security code below, then press Log In again.");
        return res;
      }).catch(function () { return res; });
    });
  }

  var wrapped = function (url, opts) {
    if (isLoginPost(url, opts)) return loginFlow(url, opts);
    return nativeFetch.apply(this, arguments);
  };

  function install() {
    try {
      if (window.fetch !== wrapped) window.fetch = wrapped;
    } catch (e) {}
  }

  /* ---------- boot ---------- */
  function init() {
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
