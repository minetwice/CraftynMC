/* CraftynMC / FearLauncher — Upload guard (safety net + diagnostics)
 * ------------------------------------------------------------------
 * Loaded FIRST, before the other enhancement scripts, so it can:
 *
 *   1. Capture the page's native fetch before anything wraps it, then
 *      restore it once everything has loaded. This removes any request
 *      wrapper that could interfere with API calls (like the upload POST).
 *
 *   2. Capture the page's ORIGINAL "Publish Asset" handler early and
 *      re-bind the button to call it directly — so the upload always
 *      works even if another enhancement left the handler broken.
 *
 *   3. If anything throws, show it in the form's message area (instead of
 *      silently doing nothing) and log it to the console.
 */
(function () {
  "use strict";

  var nativeFetch = window.fetch; // captured before any wrapper runs

  function showUploadMsg(text) {
    var msg = document.getElementById("assetUploadMsg");
    if (msg) {
      msg.textContent = text;
      msg.className = "msg error";
    }
  }

  function captureOriginal() {
    var b = document.getElementById("uploadAssetBtn");
    if (b && !window.__flOrigUpload && typeof b.onclick === "function") {
      window.__flOrigUpload = b.onclick;
    }
    return b;
  }

  captureOriginal();

  window.addEventListener("error", function (e) {
    if (e && e.message) showUploadMsg("JS error: " + e.message);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    showUploadMsg("Error: " + (r && r.message ? r.message : r));
  });

  function restoreFetch() {
    try {
      if (typeof nativeFetch === "function" && window.fetch !== nativeFetch) {
        window.fetch = nativeFetch;
      }
    } catch (e) {}
  }

  function rebindButton() {
    var b = captureOriginal();
    if (!b || b.__flGuarded) return;
    b.__flGuarded = true;
    b.onclick = function () {
      if (typeof window.__flOrigUpload !== "function") {
        showUploadMsg("Upload handler not ready — please reload the page.");
        return;
      }
      try {
        return window.__flOrigUpload.apply(this, arguments);
      } catch (err) {
        showUploadMsg("Upload error: " + (err && err.message ? err.message : err));
        console.error("[fl] upload error:", err);
      }
    };
  }

  function rewrap() {
    restoreFetch();
    rebindButton();
  }

  // Run a few times after everything has loaded, so we take over whatever
  // was bound last (and undo any fetch wrapper).
  function schedule() {
    rewrap();
    setTimeout(rewrap, 300);
    setTimeout(rewrap, 1200);
  }

  if (document.readyState === "complete") schedule();
  else {
    window.addEventListener("DOMContentLoaded", schedule);
    window.addEventListener("load", schedule);
  }
})();
