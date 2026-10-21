/* CraftynMC — project extras: licence, environment, links
 * ------------------------------------------------------------------
 * Modrinth-style project metadata:
 *   - Licence      (e.g. MIT, All Rights Reserved)   -> shown in "Details"
 *   - Environment  (Client / Server / Both)          -> shown in "Compatibility"
 *   - Links        (Label|https://url rows)          -> shown in "Links"
 *
 * The upload form is plain HTML owned by the page, so we inject the fields and
 * then attach their values to the upload request. upload-guard.js resets
 * window.fetch a few times after load, so the wrapper is re-installed on a
 * timer and again in the capture phase of the click.
 */
(function () {
  "use strict";

  var LICENCES = [
    "All Rights Reserved", "MIT", "Apache-2.0", "GPL-3.0", "LGPL-3.0",
    "MPL-2.0", "CC-BY-4.0", "CC-BY-SA-4.0", "CC0 / Public Domain", "Custom"
  ];
  var ENVS = [
    { v: "", t: "Not specified" },
    { v: "client", t: "Client-side" },
    { v: "server", t: "Server-side" },
    { v: "both", t: "Client and server" }
  ];

  window.FearLauncherLicences = LICENCES;

  function opts(list, selected, valueKey, textKey) {
    return list.map(function (x) {
      var v = valueKey ? x[valueKey] : x;
      var t = textKey ? x[textKey] : x;
      return '<option value="' + v + '"' + (v === selected ? " selected" : "") + ">" + t + "</option>";
    }).join("");
  }

  var CSS = [
    ".flx-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}",
    "@media (max-width:600px){.flx-grid{grid-template-columns:1fr}}",
    ".flx-field label{display:block;font-size:11px;font-weight:700;letter-spacing:.4px;color:var(--text-secondary);margin-bottom:6px}",
    ".flx-field select,.flx-field input,.flx-field textarea{width:100%;box-sizing:border-box;padding:11px 13px;border-radius:12px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-family:inherit;font-size:13.5px}",
    ".flx-field textarea{min-height:74px;resize:vertical}",
    ".flx-hint{margin:6px 0 0;font-size:11px;color:var(--text-secondary);line-height:1.5}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flxStyles")) return;
    var st = document.createElement("style");
    st.id = "flxStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function blockHTML(p) {
    p = p || {};
    return '<div class="flx-grid">' +
        '<div class="flx-field"><label>LICENCE</label>' +
          '<select id="assetLicence">' + opts(LICENCES, p.licence || "", null, null) + "</select>" +
          '<p class="flx-hint">What others may do with your project — <a href="/legal/licence" target="_blank" style="color:#ff7a9c">see Licensing</a>.</p>' +
        "</div>" +
        '<div class="flx-field"><label>SUPPORTED ENVIRONMENT</label>' +
          '<select id="assetEnvironment">' + opts(ENVS, p.environment || "", "v", "t") + "</select>" +
        "</div>" +
      "</div>" +
      '<div class="flx-field" style="margin-top:12px"><label>LINKS <span style="opacity:.7;font-weight:400">(one per line, Label|https://url)</span></label>' +
        '<textarea id="assetLinks" placeholder="Source code|https://github.com/you/project&#10;Report issues|https://github.com/you/project/issues">' +
          (Array.isArray(p.links) ? p.links.join("\n") : "") +
        "</textarea>" +
      "</div>";
  }

  /* ---------- the upload form ---------- */
  function injectUpload() {
    if (document.getElementById("flxUpload")) return;
    var file = document.getElementById("assetFile");
    if (!file || !file.parentNode) return;

    var wrap = document.createElement("div");
    wrap.id = "flxUpload";
    wrap.style.marginTop = "6px";
    wrap.innerHTML = blockHTML();
    var lbl = file.previousElementSibling;
    if (lbl && lbl.tagName === "LABEL") file.parentNode.insertBefore(wrap, lbl);
    else file.parentNode.insertBefore(wrap, file);
  }

  /* ---------- the edit modal (built when an admin opens it) ---------- */
  function injectEdit() {
    if (document.getElementById("flxEdit")) return;
    var modal = document.querySelector("#flEditOverlay, #flEditModal, .fl-edit-modal");
    if (!modal) return;
    var anchor = modal.querySelector("textarea, input[type='text']");
    if (!anchor || !anchor.parentNode) return;
    var wrap = document.createElement("div");
    wrap.id = "flxEdit";
    wrap.style.marginTop = "6px";
    wrap.innerHTML = blockHTML();
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
  }

  // .value on a <select> is reliable in real browsers, but fall back to the
  // selected <option> so this never silently sends an empty licence.
  function selVal(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    if (el.value) return String(el.value);
    var o = el.options && el.options[el.selectedIndex];
    return o ? String(o.value || o.textContent || "") : "";
  }

  function read() {
    function v(id) { var el = document.getElementById(id); return el ? String(el.value == null ? "" : el.value) : ""; }
    return {
      licence: selVal("assetLicence"),
      environment: selVal("assetEnvironment"),
      links: v("assetLinks")
    };
  }

  /* ---------- attach the values to the upload request ---------- */
  var nativeFetch = window.fetch;

  function isAssetWrite(url, o) {
    var u = String(url || "");
    var m = String((o && o.method) || "").toUpperCase();
    if (m !== "POST" && m !== "PUT" && m !== "PATCH") return false;
    return u.indexOf("/admin/assets") !== -1;
  }

  var wrapped = function (url, o) {
    if (isAssetWrite(url, o) && o && o.body && typeof o.body.append === "function") {
      var d = read();
      if (d.licence) { try { o.body.append("licence", d.licence); } catch (e) {} }
      if (d.environment) { try { o.body.append("environment", d.environment); } catch (e) {} }
      if (d.links) { try { o.body.append("links", d.links); } catch (e) {} }
    }
    return nativeFetch.apply(this, arguments);
  };

  function install() {
    try { if (window.fetch !== wrapped) window.fetch = wrapped; } catch (e) {}
  }

  function init() {
    injectStyles();
    injectUpload();
    injectEdit();
    install();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  [200, 600, 1300, 2600].forEach(function (t) { setTimeout(init, t); });
  setInterval(init, 2000);
  document.addEventListener("click", init, true);
})();
