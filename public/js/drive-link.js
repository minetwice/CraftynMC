/* CraftynMC / FearLauncher — Google Drive link support
 * ------------------------------------------------------------------
 *   1. Adds a "Google Drive Link" field to the admin Upload Asset form,
 *      so an admin can publish an asset by pasting a Drive share link
 *      instead of uploading a file (either one works).
 *
 *   2. Replaces the Publish handler with a robust one that sends the
 *      Drive link (plus loaders) along with everything else, and shows
 *      clear errors if something fails.
 *
 *   3. Wraps the download so that, after the ad gate, a Drive asset opens
 *      its direct-download link in a new tab (instead of navigating the
 *      page away).
 */
(function () {
  "use strict";

  var DRIVE_DIRECT = "https://drive.google.com/uc?export=download&id=";

  // Pull the file id out of any common Drive link shape.
  function driveId(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    var marker = "/file/d/";
    var i = u.indexOf(marker);
    if (i !== -1) {
      var id = u.slice(i + marker.length).split("/")[0].split("?")[0].split("&")[0];
      if (id) return id;
    }
    var qi = u.indexOf("id=");
    if (qi !== -1) {
      var id2 = u.slice(qi + 3).split("&")[0].split("?")[0].split("/")[0];
      if (id2) return id2;
    }
    return "";
  }

  function toDirect(url) {
    var id = driveId(url);
    return id ? DRIVE_DIRECT + id : String(url || "");
  }

  function isExternal(url) {
    var u = String(url || "");
    return u.indexOf("http://") === 0 || u.indexOf("https://") === 0;
  }

  /* ---------------------------------------------------------------- */
  /* Styles                                                            */
  /* ---------------------------------------------------------------- */

  function injectStyles() {
    if (document.getElementById("flDriveStyles")) return;
    var st = document.createElement("style");
    st.id = "flDriveStyles";
    st.textContent = [
      ".drive-field{margin-bottom:16px}",
      ".drive-hint{font-size:12px;color:var(--text-secondary);margin-top:6px;line-height:1.5}",
      ".drive-hint i{color:var(--primary-red)}"
    ].join("");
    document.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- */
  /* 1) Drive link field on the admin form                             */
  /* ---------------------------------------------------------------- */

  function addDriveField() {
    var fileInput = document.getElementById("assetFile");
    if (!fileInput || document.getElementById("assetDriveUrl")) return;

    var wrap = document.createElement("div");
    wrap.className = "drive-field";
    wrap.innerHTML =
      '<label class="field-label">Google Drive Link (use this instead of a file)</label>' +
      '<input type="url" id="assetDriveUrl" placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing" />' +
      '<div class="drive-hint"><i class="fas fa-circle-info"></i> Paste a Google Drive share link — then you don’t need to upload a file. ' +
      "Make sure the file is shared as <b>Anyone with the link</b>.</div>";

    var lbl = fileInput.previousElementSibling;
    if (lbl && lbl.tagName === "LABEL") fileInput.parentNode.insertBefore(wrap, lbl);
    else fileInput.parentNode.insertBefore(wrap, fileInput);

    // Optional Drive links for the icon / preview images (survive redeploys).
    if (!document.getElementById("assetIconUrl")) {
      var imgWrap = document.createElement("div");
      imgWrap.className = "drive-field";
      imgWrap.innerHTML =
        '<label class="field-label">Icon image - Google Drive link (optional)</label>' +
        '<input type="url" id="assetIconUrl" placeholder="https://drive.google.com/file/d/IMAGE_ID/view" />' +
        '<label class="field-label" style="margin-top:10px">Preview image - Google Drive link (optional)</label>' +
        '<input type="url" id="assetPreviewUrl" placeholder="https://drive.google.com/file/d/IMAGE_ID/view" />' +
        '<div class="drive-hint"><i class="fas fa-circle-info"></i> Share the images as <b>Anyone with the link</b>. Drive links survive redeploys; uploaded files get wiped on every deploy.</div>';
      wrap.parentNode.insertBefore(imgWrap, wrap.nextSibling);
    }
  }

  /* ---------------------------------------------------------------- */
  /* 2) Robust Publish handler (includes the Drive link)               */
  /* ---------------------------------------------------------------- */

  function say(text, ok) {
    var msg = document.getElementById("assetUploadMsg");
    if (!msg) return;
    if (typeof window.showMsg === "function") window.showMsg(msg, text, ok);
    else { msg.textContent = text; msg.className = "msg " + (ok ? "ok" : "error"); }
  }

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }

  function selectedLoaders() {
    var out = [];
    var chips = document.querySelectorAll("#loaderChips .loader-chip.active");
    Array.prototype.forEach.call(chips, function (c) {
      var l = c.getAttribute("data-loader");
      if (l) out.push(l);
    });
    return out;
  }

  async function uploadHandler() {
    var fileInput = document.getElementById("assetFile");
    var iconInput = document.getElementById("assetIconFile");
    var previewInput = document.getElementById("assetPreviewFile");

    var name = val("assetName");
    var category = val("assetCategory") || "mods";
    var lore = val("assetLore");
    var version = val("assetVersion");
    var supportedVersions = val("assetSupportedVersions");
    var coinCost = val("assetCost");
    var driveUrl = val("assetDriveUrl");
    var iconUrl = val("assetIconUrl");
    var previewUrl = val("assetPreviewUrl");
    var description = val("assetDesc");
    var file = fileInput && fileInput.files && fileInput.files[0];

    if (!name) return say("Asset name is required.", false);
    if (!file && !driveUrl) return say("Upload a file or paste a Google Drive link.", false);

    var fd = new FormData();
    if (file) fd.append("file", file);
    if (iconInput && iconInput.files[0]) fd.append("icon", iconInput.files[0]);
    if (previewInput && previewInput.files[0]) fd.append("preview", previewInput.files[0]);
    fd.append("name", name);
    fd.append("category", category);
    fd.append("lore", lore || "");
    fd.append("version", version || "1.0.0");
    fd.append("supportedVersions", supportedVersions || "1.20.1, 1.20.4, 1.19.4");
    fd.append("coinCost", coinCost || 0);
    fd.append("description", description || "");
    if (driveUrl) fd.append("driveUrl", driveUrl);
    if (iconUrl) fd.append("iconUrl", iconUrl);
    if (previewUrl) fd.append("previewUrl", previewUrl);
    var loaders = selectedLoaders();
    if (loaders.length) fd.append("loaders", loaders.join(","));

    try {
      var token = (typeof window.getToken === "function") ? window.getToken() : localStorage.getItem("token");
      var r = await fetch("/admin/assets", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: fd
      });
      var data = {};
      try { data = await r.json(); } catch (e) {}
      if (!r.ok) return say((data && data.error) || "Upload failed", false);

      say("Asset published successfully!", true);
      ["assetName", "assetLore", "assetVersion", "assetSupportedVersions", "assetCost", "assetDriveUrl"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
      });
      var hidden = document.getElementById("assetDesc");
      if (hidden) hidden.value = "";
      if (window.FearLauncherRichDesc && window.FearLauncherRichDesc.editor) {
        try { window.FearLauncherRichDesc.editor.reset(); } catch (e) {}
      }
      if (fileInput) fileInput.value = "";
      if (iconInput) iconInput.value = "";
      if (previewInput) previewInput.value = "";
      if (typeof window.loadAdminAssets === "function") window.loadAdminAssets();
    } catch (e) {
      say("Network error during upload: " + (e && e.message ? e.message : e), false);
    }
  }

  function wireUpload() {
    var btn = document.getElementById("uploadAssetBtn");
    if (!btn) return;
    // Tell the upload-guard (and anything else) to use THIS handler.
    window.__flUploadHandler = uploadHandler;
    window.__flOrigUpload = uploadHandler;
    btn.onclick = uploadHandler;
  }

  /* ---------------------------------------------------------------- */
  /* 3) Download: open Drive links in a new tab                        */
  /* ---------------------------------------------------------------- */

  function installDownloadOverride() {
    var orig = window.purchaseAndDownloadAsset;
    if (typeof orig !== "function" || orig.__flDriveWrapped) return;

    async function wrapped(id) {
      var token = (typeof window.getToken === "function") ? window.getToken() : null;
      if (!token) return orig.apply(this, arguments);
      try {
        var r = await fetch("/api/assets/" + id + "/download", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }
        });
        var data = {};
        try { data = await r.json(); } catch (e) {}
        if (!r.ok) { alert((data && data.error) || "Failed to initiate download."); return; }

        if (data.userCoins !== undefined) {
          var coinsEl = document.getElementById("dashCoins");
          if (coinsEl) coinsEl.textContent = data.userCoins;
          try {
            var info = JSON.parse(localStorage.getItem("userInfo") || "{}");
            info.coins = data.userCoins;
            localStorage.setItem("userInfo", JSON.stringify(info));
          } catch (e) {}
        }

        var url = data.downloadUrl || "";
        if (isExternal(url)) {
          window.open(toDirect(url), "_blank", "noopener");
        } else {
          var link = document.createElement("a");
          link.href = url;
          link.download = url.split("/").pop();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        alert("Download started successfully!");
      } catch (e) {
        alert("An error occurred during asset download checkout.");
      }
    }
    wrapped.__flDriveWrapped = true;
    window.purchaseAndDownloadAsset = wrapped;
  }

  /* ---------------------------------------------------------------- */

  function init() {
    injectStyles();
    addDriveField();
    wireUpload();
    installDownloadOverride();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
