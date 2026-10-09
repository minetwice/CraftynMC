/* CraftynMC / FearLauncher — Upload guard (safety net + diagnostics)
 * ------------------------------------------------------------------
 * Guarantees the "Publish Asset" button always does something:
 *
 *   - It captures the page's ORIGINAL upload handler early (before any
 *     other script wraps it) and re-binds the button to call it directly.
 *     So even if another enhancement leaves the handler in a broken state,
 *     uploading still works.
 *   - If the handler throws, the error is shown in the form's message
 *     area (instead of silently doing nothing) and logged to the console,
 *     which makes problems easy to spot.
 */
(function () {
  "use strict";

  function showUploadMsg(text) {
    var msg = document.getElementById("assetUploadMsg");
    if (msg) {
      msg.textContent = text;
      msg.className = "msg error";
    }
  }

  // Capture the page's own handler as early as possible.
  function captureOriginal() {
    var b = document.getElementById("uploadAssetBtn");
    if (b && !window.__flOrigUpload && typeof b.onclick === "function") {
      window.__flOrigUpload = b.onclick;
    }
    return b;
  }

  captureOriginal();

  // Surface otherwise-silent failures in the message area.
  window.addEventListener("error", function (e) {
    if (e && e.message) showUploadMsg("JS error: " + e.message);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    showUploadMsg("Error: " + (r && r.message ? r.message : r));
  });

  function rewrap() {
    var b = captureOriginal();
    if (!b) return;
    if (b.__flGuarded) return;
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

  // Run again after every script (and the page) has finished loading, so we
  // take over whatever handler was bound last.
  if (document.readyState === "complete") setTimeout(rewrap, 0);
  else window.addEventListener("load", function () { setTimeout(rewrap, 0); });
  window.addEventListener("DOMContentLoaded", function () { setTimeout(rewrap, 0); });
})();
