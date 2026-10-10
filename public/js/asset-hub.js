/* CraftynMC / FearLauncher — Asset Hub
 * ------------------------------------------------------------------
 * Two related pieces, both injected at serve time so index.html stays
 * untouched:
 *
 *  1) ADMIN — a loader picker (Fabric / Forge / Paper ...) on the
 *     "Upload Asset" form. It follows the upload-type tray selection
 *     (Mods -> Fabric/Forge/NeoForge/Quilt, Plugins -> Paper/Spigot/...,
 *     etc.) and appends the chosen loaders to the upload request.
 *
 *  2) PUBLIC — a Modrinth-style storefront. Each category renders as a
 *     grid of project cards; clicking a card opens a detail "dashboard"
 *     modal with the preview image, the formatted description, and a side
 *     panel showing the Minecraft version + loaders the admin picked,
 *     plus the download button.
 */
(function () {
  "use strict";

  /* ================================================================== */
  /* Shared                                                              */
  /* ================================================================== */

  var META = {
    mods: { title: "Mods", icon: "fa-cube" },
    plugins: { title: "Plugins", icon: "fa-plug" },
    resources: { title: "Resource Packs", icon: "fa-box" },
    shaders: { title: "Shaders", icon: "fa-sun" },
    launcher: { title: "FearLauncher Client", icon: "fa-rocket" }
  };

  var LOADERS = {
    mods: ["Fabric", "Forge", "NeoForge", "Quilt"],
    plugins: ["Paper", "Spigot", "Bukkit", "Purpur", "Velocity"],
    resources: ["Vanilla", "OptiFine", "Iris"],
    shaders: ["Iris", "OptiFine"],
    launcher: []
  };

  function meta(category) { return META[category] || { title: category, icon: "fa-cube" }; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Formatted description (reuses the editor's renderer when available).
  function renderDesc(raw, fallback) {
    if (window.FearLauncherRichDesc && typeof window.FearLauncherRichDesc.render === "function") {
      return window.FearLauncherRichDesc.render(raw, fallback);
    }
    var text = String(raw == null ? "" : raw).trim();
    if (!text) return esc(fallback || "");
    return esc(text).replace(/\n/g, "<br>");
  }

  // Plain-text snippet for the card (strips HTML and leftover markdown).
  function plainText(raw, fallback) {
    var text = String(raw == null ? "" : raw).trim();
    if (!text) return fallback || "";
    var t = text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[/]?[a-z][^>]*>/gi, " ")
      .replace(/^\s*#{1,6}\s*/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
      .replace(/\*\*([^*]*)\*\*/g, "$1")
      .replace(/__([^_]*?)__/g, "$1")
      .replace(/[*_~|]/g, " ")
      .replace(/-{3,}/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return t || (fallback || "");
  }

  /* ================================================================== */
  /* Styles                                                              */
  /* ================================================================== */

  var CSS = [
    ".loader-picker{margin-bottom:16px}",
    ".loader-chips{display:flex;flex-wrap:wrap;gap:8px}",
    ".loader-chip{width:auto;min-width:0;padding:8px 14px;border-radius:20px;border:1px solid var(--border-color);background:rgba(255,255,255,.03);color:var(--text-secondary);font-size:13px;font-weight:600;cursor:pointer;box-shadow:none;font-family:inherit}",
    ".loader-chip:hover{color:#fff;border-color:var(--border-hover);transform:none;box-shadow:none}",
    ".loader-chip.active{color:#fff;border-color:var(--primary-red);background:rgba(255,0,72,.2)}",
    ".mr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}",
    ".mr-loading,.mr-empty{grid-column:1/-1;padding:40px;text-align:center;color:var(--text-secondary)}",
    ".mr-empty i{font-size:34px;color:var(--primary-red);margin-bottom:10px;display:block}",
    ".mr-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:18px;padding:18px;cursor:pointer;transition:var(--transition);display:flex;flex-direction:column;gap:12px}",
    ".mr-card:hover{border-color:var(--primary-red);transform:translateY(-4px);box-shadow:0 12px 30px -12px rgba(255,0,72,.5)}",
    ".mr-card-top{display:flex;gap:12px;align-items:center}",
    ".mr-card-icon{width:52px;height:52px;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,0,72,.12);color:var(--primary-red);font-size:22px;flex:0 0 auto;border:1px solid var(--border-color)}",
    ".mr-card-icon img{width:100%;height:100%;object-fit:cover}",
    ".mr-card-head{display:flex;flex-direction:column;gap:2px;min-width:0}",
    ".mr-card-head h4{font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;color:#fff;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".mr-card-ver{font-size:12px;color:var(--primary-red);font-weight:600}",
    ".mr-card-desc{font-size:13px;color:var(--text-secondary);line-height:1.5;margin:0;min-height:38px}",
    ".mr-card-tags{display:flex;flex-wrap:wrap;gap:6px}",
    ".mr-tag{font-size:11px;font-weight:600;padding:3px 9px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid var(--border-color);color:#cfd3de}",
    ".mr-tag-ver{color:#8ff0a4;border-color:rgba(143,240,164,.3)}",
    ".mr-card-foot{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-secondary);border-top:1px solid var(--border-color);padding-top:10px;margin-top:auto}",
    ".mr-price{color:gold;font-weight:700}",
    ".mr-overlay{position:fixed;inset:0;background:rgba(4,5,10,.82);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow:auto}",
    ".mr-modal{background:var(--bg-card);border:1px solid var(--border-hover);border-radius:20px;width:min(1000px,100%);position:relative;box-shadow:0 30px 80px rgba(0,0,0,.7)}",
    ".mr-modal-close{position:absolute;top:14px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid var(--border-color);color:#fff;font-size:20px;line-height:1;cursor:pointer;box-shadow:none;padding:0}",
    ".mr-modal-close:hover{background:rgba(255,0,72,.25);transform:none}",
    ".mr-modal-head{display:flex;gap:16px;align-items:center;padding:24px 24px 16px;border-bottom:1px solid var(--border-color)}",
    ".mr-modal-icon{width:72px;height:72px;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,0,72,.12);color:var(--primary-red);font-size:30px;flex:0 0 auto;border:1px solid var(--border-color)}",
    ".mr-modal-icon img{width:100%;height:100%;object-fit:cover}",
    ".mr-modal-titles h2{font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;color:#fff;margin:0 0 4px}",
    ".mr-modal-lore{color:#ffd700;font-style:italic;font-size:13px;margin:0 0 6px}",
    ".mr-modal-meta{font-size:12px;color:var(--text-secondary)}",
    ".mr-modal-body{display:grid;grid-template-columns:1fr 300px;gap:24px;padding:24px}",
    ".mr-hero{border-radius:16px;overflow:hidden;border:1px solid var(--border-color);margin-bottom:18px;background:rgba(0,0,0,.3)}",
    ".mr-hero img{width:100%;display:block;max-height:340px;object-fit:cover}",
    ".mr-modal-main h3{font-family:'Outfit',sans-serif;color:#fff;font-size:18px;margin:0 0 10px}",
    ".mr-desc{color:var(--text-secondary);font-size:14px;line-height:1.7}",
    ".mr-side-card{background:rgba(10,12,18,.7);border:1px solid var(--border-color);border-radius:16px;padding:16px;margin-bottom:14px}",
    ".mr-side-label{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--text-secondary);font-weight:700;margin:10px 0 6px}",
    ".mr-side-label:first-child{margin-top:0}",
    ".mr-select{width:100%;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.4);color:#fff;border:1px solid var(--border-color);font-size:13px;font-family:inherit}",
    ".mr-loaders{display:flex;flex-wrap:wrap;gap:6px}",
    ".mr-loader-chip{font-size:12px;font-weight:600;padding:5px 11px;border-radius:12px;background:rgba(255,0,72,.15);border:1px solid rgba(255,0,72,.35);color:#fff}",
    ".mr-muted{color:var(--text-secondary);font-size:12px}",
    ".mr-download-btn{width:100%;margin-top:16px;padding:14px;border-radius:12px;border:none;background:var(--gradient-main);color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 6px 20px rgba(255,0,72,.35);font-family:inherit}",
    ".mr-download-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(255,0,72,.5)}",
    ".mr-side-note{font-size:11px;color:var(--text-secondary);text-align:center;margin-top:10px}",
    ".mr-side-note i{color:#00ff88}",
    ".mr-side-value{color:#fff;font-size:14px;font-weight:600}",
    "@media(max-width:760px){.mr-modal-body{grid-template-columns:1fr}.mr-overlay{padding:16px}}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("mrStoreStyles")) return;
    var st = document.createElement("style");
    st.id = "mrStoreStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ================================================================== */
  /* 1) Admin loader picker                                              */
  /* ================================================================== */

  var selectedLoaders = [];

  function installAssetFormInterceptor() {
    if (window.__flAssetFetchWrapped || typeof window.fetch !== "function") return;
    window.__flAssetFetchWrapped = true;
    var origFetch = window.fetch;
    window.fetch = function (url, opts) {
      try {
        var method = (opts && opts.method ? String(opts.method) : "GET").toUpperCase();
        var isAssetUpload = method === "POST" && String(url).indexOf("/admin/assets") !== -1;
        if (isAssetUpload && typeof FormData !== "undefined" && opts.body instanceof FormData) {
          if (selectedLoaders.length && (typeof opts.body.has !== "function" || !opts.body.has("loaders"))) {
            opts.body.append("loaders", selectedLoaders.join(","));
          }
        }
      } catch (e) {}
      return origFetch.apply(this, arguments);
    };
  }

  function buildLoaderPicker() {
    var versionsInput = document.getElementById("assetSupportedVersions");
    var select = document.getElementById("assetCategory");
    if (!versionsInput || !select || document.getElementById("loaderPicker")) return;

    var picker = document.createElement("div");
    picker.className = "loader-picker";
    picker.id = "loaderPicker";
    picker.innerHTML = '<label class="field-label">Loaders - Fabric / Forge / Paper... (select one or more)</label><div class="loader-chips" id="loaderChips"></div>';
    versionsInput.parentNode.insertBefore(picker, versionsInput.nextSibling);

    function render(cat) {
      selectedLoaders = [];
      var list = LOADERS[cat] || [];
      var chips = document.getElementById("loaderChips");
      if (!chips) return;
      if (!list.length) { picker.style.display = "none"; chips.innerHTML = ""; return; }
      picker.style.display = "block";
      chips.innerHTML = list.map(function (l) {
        return '<button type="button" class="loader-chip" data-loader="' + l + '">' + l + "</button>";
      }).join("");
      Array.prototype.forEach.call(chips.querySelectorAll(".loader-chip"), function (b) {
        b.addEventListener("click", function () {
          var l = b.getAttribute("data-loader");
          var i = selectedLoaders.indexOf(l);
          if (i === -1) selectedLoaders.push(l); else selectedLoaders.splice(i, 1);
          b.classList.toggle("active", selectedLoaders.indexOf(l) !== -1);
        });
      });
    }

    render(select.value || "mods");
    // The upload-type tray keeps #assetCategory in sync and fires "change".
    select.addEventListener("change", function () { render(select.value); });
  }

  /* ================================================================== */
  /* 2) Public storefront                                                */
  /* ================================================================== */

  // Broken-image fallback: if an asset icon/preview fails to load (e.g. the
  // uploaded file was lost on a redeploy), swap it for the category icon, or
  // hide the hero image entirely. 'error' does not bubble, so listen in capture.
  function onImgError(img) {
    if (!img || img.tagName !== "IMG") return;
    var fb = img.getAttribute("data-fb");
    if (fb) {
      var holder = img.parentNode;
      if (holder) holder.innerHTML = '<i class="fas ' + fb + '"></i>';
      return;
    }
    if (img.hasAttribute("data-hide-on-error")) {
      var hero = img.closest ? img.closest(".mr-hero") : null;
      if (hero && hero.parentNode) hero.parentNode.removeChild(hero);
    }
  }
  window.__flImgFail = onImgError;
  document.addEventListener("error", function (e) { onImgError(e.target); }, true);

  function cardHtml(a) {
    var m = meta(a.category);
    var img = a.iconUrl || a.previewUrl;
    var iconBlock = img ? '<img src="' + esc(img) + '" alt="" data-fb="' + esc(m.icon) + '" onerror="window.__flImgFail(this)">' : '<i class="fas ' + m.icon + '"></i>';
    var loaderTags = (a.loaders && a.loaders.length)
      ? a.loaders.slice(0, 4).map(function (l) { return '<span class="mr-tag">' + esc(l) + "</span>"; }).join("")
      : "";
    var verTag = (a.supportedVersions && a.supportedVersions.length)
      ? '<span class="mr-tag mr-tag-ver">' + esc(a.supportedVersions.slice(0, 3).join(", ")) + "</span>"
      : "";
    var desc = plainText(a.description, "No description provided.");
    if (desc.length > 120) desc = desc.slice(0, 120) + "...";

    return '<div class="mr-card" data-asset-id="' + esc(a._id) + '">' +
      '<div class="mr-card-top">' +
        '<div class="mr-card-icon">' + iconBlock + "</div>" +
        '<div class="mr-card-head"><h4>' + esc(a.name) + "</h4>" +
          (a.version ? '<span class="mr-card-ver">v' + esc(a.version) + "</span>" : "") +
        "</div>" +
      "</div>" +
      '<p class="mr-card-desc">' + esc(desc) + "</p>" +
      '<div class="mr-card-tags">' + loaderTags + verTag + "</div>" +
      '<div class="mr-card-foot">' +
        '<span class="mr-dl"><i class="fas fa-download"></i> ' + (a.downloadsCount || 0) + "</span>" +
        '<span class="mr-price">' + (a.coinCost > 0 ? '<i class="fas fa-coins"></i> ' + a.coinCost : "Free") + "</span>" +
      "</div>" +
    "</div>";
  }

  function escClose(e) { if (e.key === "Escape") closeDetail(); }

  function closeDetail() {
    var o = document.getElementById("mrOverlay");
    if (o && o.parentNode) o.parentNode.removeChild(o);
    document.body.style.overflow = "";
    document.removeEventListener("keydown", escClose);
  }

  function openDetail(a) {
    closeDetail();
    var m = meta(a.category);
    var hero = a.previewUrl ? '<div class="mr-hero"><img src="' + esc(a.previewUrl) + '" alt="' + esc(a.name) + '" data-hide-on-error="1" onerror="window.__flImgFail(this)"></div>' : "";
    var iconImg = a.iconUrl || a.previewUrl;
    var iconBlock = iconImg ? '<img src="' + esc(iconImg) + '" alt="" data-fb="' + esc(m.icon) + '" onerror="window.__flImgFail(this)">' : '<i class="fas ' + m.icon + '"></i>';

    var versions = (a.supportedVersions && a.supportedVersions.length) ? a.supportedVersions : [];
    var versionOptions = versions.length
      ? versions.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("")
      : '<option value="">Any</option>';
    var loaders = (a.loaders && a.loaders.length) ? a.loaders : [];
    var loaderChips = loaders.length
      ? loaders.map(function (l) { return '<span class="mr-loader-chip">' + esc(l) + "</span>"; }).join("")
      : '<span class="mr-muted">Not specified</span>';

    var overlay = document.createElement("div");
    overlay.className = "mr-overlay";
    overlay.id = "mrOverlay";
    overlay.innerHTML =
      '<div class="mr-modal" role="dialog" aria-modal="true">' +
        '<button type="button" class="mr-modal-close" aria-label="Close">&times;</button>' +
        '<div class="mr-modal-head">' +
          '<div class="mr-modal-icon">' + iconBlock + "</div>" +
          '<div class="mr-modal-titles">' +
            "<h2>" + esc(a.name) + "</h2>" +
            (a.lore ? '<p class="mr-modal-lore">' + esc(a.lore) + "</p>" : "") +
            '<div class="mr-modal-meta">by ' + esc(a.uploadedBy || "System") +
              " &middot; " + (a.downloadsCount || 0) + " downloads &middot; " + esc(m.title) + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="mr-modal-body">' +
          '<div class="mr-modal-main">' +
            hero +
            "<h3>Description</h3>" +
            '<div class="mr-desc">' + renderDesc(a.description, "No description provided.") + "</div>" +
          "</div>" +
          '<aside class="mr-modal-side">' +
            '<div class="mr-side-card">' +
              '<div class="mr-side-label">Minecraft version</div>' +
              '<select class="mr-select" id="mrVersion">' + versionOptions + "</select>" +
              '<div class="mr-side-label">Loader</div>' +
              '<div class="mr-loaders">' + loaderChips + "</div>" +
              '<button type="button" class="mr-download-btn"><i class="fas fa-download"></i> ' +
                (a.coinCost > 0 ? "Buy &amp; Download (" + a.coinCost + " coins)" : "Download") + "</button>" +
              '<div class="mr-side-note"><i class="fas fa-shield-alt"></i> Verified, virus-free file</div>' +
            "</div>" +
            '<div class="mr-side-card">' +
              '<div class="mr-side-label">File version</div>' +
              '<div class="mr-side-value">' + esc(a.version || "1.0.0") + "</div>" +
              '<div class="mr-side-label">Category</div>' +
              '<div class="mr-side-value">' + esc(m.title) + "</div>" +
            "</div>" +
          "</aside>" +
        "</div>" +
      "</div>";

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    overlay.querySelector(".mr-modal-close").addEventListener("click", closeDetail);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeDetail(); });
    overlay.querySelector(".mr-download-btn").addEventListener("click", function () {
      if (typeof window.purchaseAndDownloadAsset === "function") window.purchaseAndDownloadAsset(a._id);
      else if (a.downloadUrl) window.open(a.downloadUrl, "_blank");
    });
    document.addEventListener("keydown", escClose);
  }

  async function loadPublicAssets(category) {
    var target = category === "fearlauncher" ? "launcher" : category;
    var container = document.getElementById(category + "Container");
    if (!container) return;

    container.classList.remove("grid-3");
    container.classList.add("mr-grid");
    container.innerHTML = '<div class="mr-loading">Loading ' + esc(category) + "...</div>";

    try {
      var r = await fetch("/api/assets?category=" + encodeURIComponent(target));
      var data = await r.json();
      var assets = (data && data.assets) || [];

      if (!assets.length) {
        container.innerHTML = '<div class="mr-empty"><i class="fas ' + meta(target).icon + '"></i>' +
          "<p>No " + esc(category) + " available yet. Admins can upload them from the Admin Assets panel.</p></div>";
        return;
      }

      container.innerHTML = assets.map(cardHtml).join("");
      Array.prototype.forEach.call(container.querySelectorAll(".mr-card"), function (c) {
        c.addEventListener("click", function () {
          var id = c.getAttribute("data-asset-id");
          for (var i = 0; i < assets.length; i++) {
            if (assets[i]._id === id) { openDetail(assets[i]); return; }
          }
        });
      });
    } catch (e) {
      container.innerHTML = '<div class="mr-empty"><p>Failed to load ' + esc(category) + ".</p></div>";
    }
  }

  /* ================================================================== */
  /* Boot                                                                */
  /* ================================================================== */

  function init() {
    injectStyles();
    buildLoaderPicker();
    installAssetFormInterceptor();
    window.loadPublicAssets = loadPublicAssets;
    window.FearLauncherStore = { open: openDetail, close: closeDetail };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
