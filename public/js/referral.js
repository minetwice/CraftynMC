/* CraftynMC / FearLauncher — referral signup
 * ------------------------------------------------------------------
 * 1) Adds an optional "Referral code" field to the register form.
 * 2) Prefills it from a shared link like  https://site/?ref=CODE
 * 3) Attaches the code to the /register request (both sides get coins).
 */
(function () {
  "use strict";

  var INPUT_ID = "regRefCode";

  function codeFromUrl() {
    try {
      var m = String(location.search || "").match(/[?&]ref=([A-Za-z0-9_-]+)/);
      return m ? m[1].toUpperCase() : "";
    } catch (e) { return ""; }
  }

  function inject() {
    var btn = document.getElementById("registerBtn");
    if (!btn || document.getElementById(INPUT_ID)) return;

    var inp = document.createElement("input");
    inp.id = INPUT_ID;
    inp.type = "text";
    inp.placeholder = "Referral code (optional)";
    inp.value = codeFromUrl();
    inp.style.marginTop = "8px";
    btn.parentNode.insertBefore(inp, btn);

    if (inp.value) {
      var hint = document.createElement("div");
      hint.className = "msg";
      hint.style.cssText = "font-size:12px;color:#00ff88";
      hint.textContent = "Referral code applied — you'll both get +200 coins!";
      btn.parentNode.insertBefore(hint, btn);
    }
  }

  // Attach the code to the /register request body.
  if (!window.__flRefGuard && typeof window.fetch === "function") {
    window.__flRefGuard = true;
    var origFetch = window.fetch;
    window.fetch = function (url, opts) {
      var u = String(url || "");
      var isRegister = u.indexOf("/register") !== -1 && opts && String(opts.method || "").toUpperCase() === "POST";
      if (isRegister && opts.body && typeof opts.body === "string") {
        var el = document.getElementById(INPUT_ID);
        var code = (el && el.value) ? el.value.trim().toUpperCase() : codeFromUrl();
        if (code) {
          try {
            var b = JSON.parse(opts.body);
            b.ref = code;
            var o = {};
            for (var k in opts) o[k] = opts[k];
            o.body = JSON.stringify(b);
            return origFetch.call(this, url, o);
          } catch (e) {}
        }
      }
      return origFetch.apply(this, arguments);
    };
  }

  function init() {
    inject();
    setInterval(inject, 1500);   // the register form may be re-rendered
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
