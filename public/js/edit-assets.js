/* CraftynMC / FearLauncher — Admin asset editor
 * ------------------------------------------------------------------
 * Lets an admin edit an already-uploaded asset (title, description,
 * lore, category, version, loaders, coin cost, drive link) and replace
 * its icon / preview / file. index.html is untouched: this script adds
 * an "Edit" button to each row of the admin assets table and opens a
 * prefilled modal that PUTs to /admin/assets/:id.
 */
(function () {
  "use strict";

  var CATS = ["mods", "plugins", "resources", "shaders", "capes", "cosmetics", "launcher"];
  var cache = {};

  function getToken() {
    try { if (typeof window.getToken === "function") return window.getToken(); } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) { return ""; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function msg(el, text, ok) {
    if (!el) return;
    el.textContent = text;
    el.style.color = ok ? "#00ff88" : "#ff6b8b";
    el.style.fontSize = "12px";
    el.style.marginTop = "8px";
  }

  function idFromRow(tr) {
    var btn = tr.querySelector("button[onclick*='deleteAsset']");
    if (!btn) return null;
    var m = (btn.getAttribute("onclick") || "").match(/deleteAsset\(['"]([^'"]+)['"]\)/);
    return m ? m[1] : null;
  }

  function fetchAll() {
    return fetch("/api/assets", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { (d.assets || []).forEach(function (a) { cache[a._id] = a; }); })
      .catch(function () {});
  }

  function addEditButtons() {
    var tbody = document.getElementById("assetsTableBody");
    if (!tbody) return;
    var rows = tbody.querySelectorAll("tr");
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      if (tr.__flEdit) continue;
      var id = idFromRow(tr);
      if (!id) continue;
      var cell = tr.lastElementChild;
      if (!cell) continue;
      tr.__flEdit = true;
      (function (assetId) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "fl-edit-btn";
        b.style.cssText = "padding:6px 12px;font-size:12px;margin-right:8px;background:linear-gradient(135deg,#0a84ff,#0055cc);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600";
        b.innerHTML = '<i class="fas fa-pen"></i> Edit';
        b.addEventListener("click", function (e) { e.preventDefault(); openEditor(assetId); });
        cell.insertBefore(b, cell.firstChild);
      })(id);
    }
  }

  function field(label, inner) {
    return '<label style="display:block;font-size:12px;color:var(--text-secondary);margin:10px 0 4px">' + label + "</label>" + inner;
  }

  function inputCss() {
    return "width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-size:13px;font-family:inherit";
  }

  function closeEditor() {
    var ov = document.getElementById("flEditOverlay");
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

  function openEditor(id) {
    var a = cache[id];
    if (!a) { fetchAll().then(function () { openEditor(id); }); return; }
    closeEditor();

    var opts = CATS.map(function (c) {
      return '<option value="' + c + '"' + (c === a.category ? " selected" : "") + ">" + c + "</option>";
    }).join("");

    var ov = document.createElement("div");
    ov.id = "flEditOverlay";
    ov.style.cssText = "position:fixed;inset:0;background:rgba(4,5,10,.92);z-index:10050;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow:auto";
    ov.innerHTML =
      '<div style="background:var(--bg-card);border:1px solid var(--border-hover);border-radius:20px;width:min(660px,100%);padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.75)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<h3 style="margin:0;font-family:\'Outfit\',sans-serif;color:#fff">Edit Asset</h3>' +
          '<button type="button" id="feClose" style="background:none;border:none;color:var(--text-secondary);font-size:20px;cursor:pointer;box-shadow:none">&times;</button>' +
        "</div>" +
        '<p style="margin:0 0 6px;font-size:12px;color:var(--text-secondary)">Update any field and save — the storefront updates immediately.</p>' +
        field("Name", '<input id="feName" style="' + inputCss() + '">') +
        field("Category", '<select id="feCategory" style="' + inputCss() + '">' + opts + "</select>") +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div>' + field("Version", '<input id="feVersion" style="' + inputCss() + '">') + "</div>" +
          '<div>' + field("Coin cost", '<input id="feCost" type="number" min="0" style="' + inputCss() + '">') + "</div>" +
        "</div>" +
        field("Supported versions (comma separated)", '<input id="feVersions" style="' + inputCss() + '">') +
        field("Loaders (comma separated, e.g. fabric, forge)", '<input id="feLoaders" style="' + inputCss() + '">') +
        field("Lore / tagline", '<input id="feLore" style="' + inputCss() + '">') +
        field("Description", '<textarea id="feDesc" rows="5" style="' + inputCss() + ';resize:vertical"></textarea>') +
        field("Google Drive link (optional)", '<input id="feDrive" style="' + inputCss() + '" placeholder="https://drive.google.com/...">') +
        field("Replace icon (optional)", '<input id="feIcon" type="file" accept="image/*" style="' + inputCss() + '">') +
        field("Replace preview (optional)", '<input id="fePreview" type="file" accept="image/*" style="' + inputCss() + '">') +
        field("Replace asset file (optional)", '<input id="feFile" type="file" style="' + inputCss() + '">') +
        '<div id="feMsg"></div>' +
        '<div style="display:flex;gap:10px;margin-top:16px">' +
          '<button type="button" id="feSave" style="flex:1;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;cursor:pointer;font-family:inherit">Save changes</button>' +
          '<button type="button" id="feCancel" style="padding:13px 18px;border:1px solid var(--border-color);border-radius:12px;background:none;color:var(--text-secondary);cursor:pointer;font-family:inherit">Cancel</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(ov);

    var $ = function (s) { return ov.querySelector(s); };
    $("#feName").value = a.name || "";
    $("#feVersion").value = a.version || "";
    $("#feCost").value = a.coinCost != null ? a.coinCost : 0;
    $("#feVersions").value = (a.supportedVersions || []).join(", ");
    $("#feLoaders").value = (a.loaders || []).join(", ");
    $("#feLore").value = a.lore || "";
    $("#feDesc").value = a.description || "";
    $("#feDrive").value = a.driveUrl || "";

    $("#feClose").addEventListener("click", closeEditor);
    $("#feCancel").addEventListener("click", closeEditor);
    ov.addEventListener("click", function (e) { if (e.target === ov) closeEditor(); });

    $("#feSave").addEventListener("click", function () {
      var fd = new FormData();
      fd.append("name", $("#feName").value.trim());
      fd.append("category", $("#feCategory").value);
      fd.append("version", $("#feVersion").value.trim());
      fd.append("supportedVersions", $("#feVersions").value.trim());
      fd.append("loaders", $("#feLoaders").value.trim());
      fd.append("coinCost", $("#feCost").value || "0");
      fd.append("lore", $("#feLore").value.trim());
      fd.append("description", $("#feDesc").value.trim());
      fd.append("driveUrl", $("#feDrive").value.trim());
      var icon = $("#feIcon").files[0]; if (icon) fd.append("icon", icon);
      var prev = $("#fePreview").files[0]; if (prev) fd.append("preview", prev);
      var file = $("#feFile").files[0]; if (file) fd.append("file", file);

      msg($("#feMsg"), "Saving…", true);
      fetch("/admin/assets/" + id, {
        method: "PUT",
        headers: { Authorization: "Bearer " + getToken() },
        body: fd
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) { msg($("#feMsg"), res.d.error || "Update failed", false); return; }
          msg($("#feMsg"), "Saved successfully!", true);
          delete cache[id];
          fetchAll();
          setTimeout(function () {
            closeEditor();
            try { if (typeof window.loadAdminAssets === "function") window.loadAdminAssets(); } catch (e) {}
          }, 500);
        })
        .catch(function () { msg($("#feMsg"), "Network error during update", false); });
    });
  }

  function init() {
    fetchAll();
    addEditButtons();
    setInterval(addEditButtons, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
