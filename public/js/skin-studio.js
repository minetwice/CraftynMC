/* CraftynMC — Skin studio (Phase 2)
 * ------------------------------------------------------------------
 * Puts a real 3D character next to the skin/cape upload controls, laid out
 * like the design preview: model on the left, controls on the right.
 *
 * Pure injection: index.html is untouched, and no account data is modified.
 * The 3D model only READS the player's skin.
 */
(function () {
  "use strict";
  if (window.__flSkinStudio) return;
  window.__flSkinStudio = true;

  var FALLBACK_SKIN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAACinX6EAAAE6ElEQVRogeWX30/bVhTH/UjtxCVVp0Z2MKVJjQNBDoU9JFEXKOVHp6rViJhaPJUKJkhDEVIEm9QKBVYEpJO6PUUKSjOpUqUIberD2u2hYo97yv/03cPNNdfGjilFDaOWvnLie3zj7+fec3zCcR5HT4cfPR1+RIJtYD9Hgm3obBewOq43ldf8p/6ghvXO89A7z1sARIJtWB3XkRuKYyszaJ63MoNnCwA1r0q8K4BwOGxRbih+NgDQ1benAb125gGwZlWJhyrxlnT4LAA4mfcCMKmpZwcANR4N+aBKPDrbhUMAnHRmAFDjrOjO+N+/BjWZhyYTU92ygGjIh2vhdvRdJtIv+9GrkDqghQREgm1QJR69CgFA466F2xEN+dAtC1AlMqcm8/DqI1rt3wJAlXjEFBHRkA+9ih8DkQB6Fb+pgUgAN3ouIN3zBWKKCC0kmDHRkA8xRTTnYQE06yNa7Z+LKSLUIFk1YlyEJguIBHkTxF/Fx9h/kce/pXXs/5zH/osV/P7DNAavXkA05EMkyEOTBfQ24KkSDzUoIKaI8OojWu2f7ADJj74OkayqTFIhpojQrwSwtzaPt5tL2Fubxx/rS6jkv8P7Yh6VR7dReXQb+pUAYoqIblmAJpMd1NchQpP80GQeXn1Eq/2bKUDSwIfwpXPYvpdEZW4USe0i3m4uAQAmrxfx7ukC3hfzmLxeBADsrc0jqV1EZW4U2/eSCF86B1XygZ3Tq49otf8DAJK/sW0D2JzsR2lmGDvTCVTmxvDn01n8/VPefL39s/MYr3LjWM8MYmc6gdLMMDYn+xFTAlCDgrn6bBF06yNa7Z+j276vQ8TsiI6XubvYnbtp/qH59cEISjND+PHGlxb98uArbGQSWB3XsZUZxO7cTbzM3cXsiE5SoJEOXn1Eq/1z9N8bNV1ZmEBpZhjP76ewMqFjeTSGpZEebGQS2Mgk8OTOAJ5NpfBsKoUndwawMqHj+f0UfsveQmVhArvff03OjfkoSHsfQcG12v+h49tbdbDSNM0izwnqdfemqF4H9/Bhc3kdtRqZp14HV6shNxTHN/1XzfOpAODWGp8IAGq+oc8bQK1mMZ8bip8OAJ8yBT4aQFzLI67loXYZiGt5jCVfW8SO2ceT/UVwhcKBDANcuQyuWsVGJoFXuXGzeHLVKhEbXyiQa7Xagd68IaLf3eJpjH2c3k91FABql3EsAGPJ1+RHs1miQuHgwRsQTPP0gdj4bNZqmhWdh42lBuk9FKh9/DgA3Ax6AnB6QPqQ1SrZEaxJNj6bdTbPzuEEmI1pOQDDOHgAw7D+OAXAXnOLp3G1mvWz3SC7mz7VDmBjkv1Fi0wjVOWy1TT9TK+zsRSA3TRzf2lm2NT2VAp7a/MWbU+lLDH28WMBoObYHeAKgDWTzVoBOBljgdEUcLqnsdWdAJSWDdMgvX6iAD64BtgBsKvPVmwWAFsDbKZZIKw5O4DSsuEIoLRsmDFHAsDqo98CXgDsbwGnWBcA9hW2A3BKkRMB0Gy8aRGyvwHsAJyKlk2sOTcAzWqEJ4B0Oo10Ou0JgMYtLi5aZBqijQhdPfvquwFg4x3qAWvOKcdZAGwK0PORAbgZ9BpnU0TtMg4BNDtGBoC98TILKk2Tctkswm4AqEmnHdIyAE47yAKhXPZurctlyzX7ClsK4LLhWCM+BMB/aG3tAxSVGg8AAAAASUVORK5CYII=";
  var CDN = "https://cdn.jsdelivr.net/npm/skinview3d@3.0.0/bundles/skinview3d.bundle.js";

  var CSS = [
    ".flstudio{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:20px;align-items:start}",
    "@media (max-width:820px){.flstudio{grid-template-columns:1fr}}",
    ".flstudio-stage{position:relative;border:1px solid rgba(255,255,255,.13);border-radius:18px;",
      "background:radial-gradient(420px 260px at 50% 18%,rgba(255,30,92,.18),transparent 70%),rgba(255,255,255,.055);",
      "-webkit-backdrop-filter:blur(20px) saturate(1.5);backdrop-filter:blur(20px) saturate(1.5);",
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 22px 44px -26px rgba(0,0,0,.9);",
      "display:flex;align-items:center;justify-content:center;min-height:360px;overflow:hidden}",
    ".flstudio-stage canvas{display:block;width:100%;height:360px;touch-action:pan-y;cursor:grab}",
    ".flstudio-stage canvas:active{cursor:grabbing}",
    ".flstudio-cap{position:absolute;bottom:10px;left:0;right:0;text-align:center;",
      "font:500 10px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#6a7182}",
    ".flstudio-msg{grid-column:1/-1;font-size:12px;color:#6a7182;text-align:center;margin-top:4px}"
  ].join("");

  function style() {
    if (document.getElementById("flStudioCss")) return;
    var st = document.createElement("style");
    st.id = "flStudioCss";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken() || ""; } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) {}
    return "";
  }
  function me() {
    try {
      var u = JSON.parse(localStorage.getItem("userInfo") || "{}");
      return u.username || u.displayName || "";
    } catch (e) { return ""; }
  }

  function loadCdn(cb) {
    if (window.skinview3d) return cb();
    if (document.getElementById("flSkinCdn")) {
      document.getElementById("flSkinCdn").addEventListener("load", cb);
      return;
    }
    var s = document.createElement("script");
    s.id = "flSkinCdn";
    s.src = CDN;
    s.async = true;
    s.onload = cb;
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  function mySkin(cb) {
    var name = me();
    if (!name) return cb(FALLBACK_SKIN);
    var t = token();
    fetch("/api/player/" + encodeURIComponent(name), {
      headers: t ? { Authorization: "Bearer " + t } : {}
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var u = (d && (d.player || d.user || d)) || {};
        var skin = u.skinUrl || u.skin || (u.skins && u.skins[0]) || "";
        cb(skin || FALLBACK_SKIN);
      })
      .catch(function () { cb(FALLBACK_SKIN); });
  }

  var built = false;

  function build() {
    if (built) return;
    var sec = document.getElementById("profile");
    if (!sec || !sec.classList.contains("active")) return;

    // the card that holds the skin uploader
    var skinInput = document.getElementById("skinFile");
    if (!skinInput) return;
    var card = skinInput.closest(".card") || skinInput.parentNode;
    if (!card || card.__flStudio) return;
    card.__flStudio = true;

    var parent = card.parentNode;
    var wrap = document.createElement("div");
    wrap.className = "flstudio";
    parent.insertBefore(wrap, card);

    var stage = document.createElement("div");
    stage.className = "flstudio-stage";
    var cv = document.createElement("canvas");
    stage.appendChild(cv);
    var cap = document.createElement("div");
    cap.className = "flstudio-cap";
    cap.textContent = "Drag to rotate";
    stage.appendChild(cap);
    wrap.appendChild(stage);
    wrap.appendChild(card);

    built = true;

    loadCdn(function () {
      if (!window.skinview3d) { cap.textContent = "3D needs a connection"; return; }
      mySkin(function (skin) {
        try {
          cv.width = 300; cv.height = 360;
          var v = new window.skinview3d.SkinViewer({
            canvas: cv, width: 300, height: 360, skin: skin
          });
          v.autoRotate = true;
          v.autoRotateSpeed = 0.55;
          v.background = null;
          if (v.controls) { v.controls.enableZoom = false; v.controls.enablePan = false; }
          if (window.skinview3d.IdleAnimation) v.animation = new window.skinview3d.IdleAnimation();
          window.__flSkinViewer = v;
        } catch (e) {
          cap.textContent = "3D unavailable";
        }
      });
    });
  }

  function tick() { style(); build(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 2500);
})();
