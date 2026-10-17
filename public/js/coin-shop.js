/* CraftynMC / FearLauncher — Coin Shop
 * ------------------------------------------------------------------
 * A sidebar section where players SPEND the coins they earned by watching
 * ads. No payments anywhere — coins only.
 *   - Premium Badge (1000 coins, permanent)
 *   - Feature a project (500 coins, 7 days) — pick one of your own projects
 * Data: GET /api/coins/shop, POST /api/coins/shop/buy
 */
(function () {
  "use strict";

  var SEC_ID = "coin-shop";
  var NAV_ID = "flShopNav";

  function token() {
    try { if (typeof window.getToken === "function") return window.getToken(); } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) { return ""; }
  }

  function me() {
    try { return JSON.parse(localStorage.getItem("userInfo") || "{}"); } catch (e) { return {}; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function api(path, opts) {
    var t = token();
    var o = opts || {};
    o.headers = o.headers || {};
    o.headers.Authorization = "Bearer " + t;
    return fetch(path, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; });
    });
  }

  var CSS = [
    ".fls-wrap{max-width:820px}",
    ".fls-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}",
    ".fls-bal{font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;color:gold}",
    ".fls-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}",
    ".fls-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:8px}",
    ".fls-card h4{margin:0;font-family:'Outfit',sans-serif;font-size:16px;color:#fff}",
    ".fls-cost{color:gold;font-weight:700;font-size:14px}",
    ".fls-desc{color:var(--text-secondary);font-size:12px;line-height:1.5;flex:1}",
    ".fls-buy{margin-top:6px;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:700;cursor:pointer;font-family:inherit}",
    ".fls-buy[disabled]{opacity:.45;cursor:not-allowed}",
    ".fls-sel{width:100%;padding:10px;border-radius:10px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-family:inherit;font-size:13px}",
    ".fls-msg{margin-top:12px;font-size:13px;min-height:18px}",
    ".fls-ok{color:#00ff88}",
    ".fls-err{color:#ff6b8b}",
    ".fls-owned{display:inline-block;background:rgba(255,215,0,.15);color:gold;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("flsStyles")) return;
    var st = document.createElement("style");
    st.id = "flsStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var myProjects = [];

  function render(data) {
    var el = document.getElementById(SEC_ID);
    if (!el) return;
    var coins = data.coins || 0;

    var cards = (data.items || []).map(function (it) {
      var owned = it.id === "premium" && data.premium;
      var afford = coins >= it.cost;
      var picker = "";
      if (it.needsAsset) {
        picker = myProjects.length
          ? '<select class="fls-sel" id="flsAsset_' + it.id + '">' + myProjects.map(function (p) {
              return '<option value="' + esc(p._id) + '">' + esc(p.name) + " (" + esc(p.category) + ")</option>";
            }).join("") + "</select>"
          : '<div class="fls-desc">You have not uploaded any projects yet.</div>';
      }
      var disabled = owned || !afford || (it.needsAsset && !myProjects.length);
      return '<div class="fls-card">' +
        '<h4>' + esc(it.label) + (owned ? ' <span class="fls-owned">OWNED</span>' : "") + "</h4>" +
        '<div class="fls-cost"><i class="fas fa-coins"></i> ' + it.cost + " coins</div>" +
        '<div class="fls-desc">' + esc(it.desc) + "</div>" +
        picker +
        '<button type="button" class="fls-buy" data-item="' + esc(it.id) + '" data-needs-asset="' + (it.needsAsset ? "1" : "0") + '"' +
          (disabled ? " disabled" : "") + ">" +
          (owned ? "Already owned" : (afford ? "Buy" : "Need " + (it.cost - coins) + " more coins")) + "</button>" +
      "</div>";
    }).join("");

    el.innerHTML =
      '<div class="fls-wrap">' +
        '<div class="fls-head">' +
          '<h2 style="font-family:\'Outfit\',sans-serif;color:#fff;margin:0">Coin Shop</h2>' +
          '<div class="fls-bal"><i class="fas fa-coins"></i> <span id="flsBalance">' + coins + "</span></div>" +
        "</div>" +
        '<p class="fls-desc" style="margin:0 0 14px">Spend the coins you earn by watching ads. No real money — ever.</p>' +
        '<div class="fls-grid">' + cards + "</div>" +
        '<div class="fls-msg" id="flsMsg"></div>' +
      "</div>";

    Array.prototype.forEach.call(el.querySelectorAll(".fls-buy"), function (b) {
      if (b.disabled) return;
      b.addEventListener("click", function () {
        var item = b.getAttribute("data-item");
        var needsAsset = b.getAttribute("data-needs-asset") === "1";
        var assetId = needsAsset ? (document.getElementById("flsAsset_" + item) || {}).value : undefined;
        buy(item, assetId, b);
      });
    });
  }

  function buy(item, assetId, btn) {
    if (btn) { btn.disabled = true; btn.textContent = "Buying…"; }
    api("/api/coins/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: item, assetId: assetId }),
    }).then(function (r) {
      // Pass the result into refresh so the re-render does not wipe the message.
      refresh({ ok: r.ok, text: r.ok ? (r.data.message || "Done!") : (r.data.error || "Purchase failed.") });
      try { if (typeof window.loadDashboard === "function") setTimeout(window.loadDashboard, 700); } catch (e) {}
    });
  }

  function refresh(flash) {
    var t = token();
    if (!t) return;
    Promise.all([
      api("/api/coins/shop"),
      fetch("/api/assets").then(function (r) { return r.json(); }).catch(function () { return { assets: [] }; }),
    ]).then(function (out) {
      var shop = out[0];
      if (!shop.ok) return;
      var who = (me().username || "").toLowerCase();
      myProjects = (out[1].assets || []).filter(function (a) { return String(a.uploadedBy || "").toLowerCase() === who; });
      render(shop.data);
      if (flash) {
        var m = document.getElementById("flsMsg");
        if (m) { m.className = "fls-msg " + (flash.ok ? "fls-ok" : "fls-err"); m.textContent = flash.text; }
      }
    });
  }

  function place() {
    var main = document.querySelector("main.main-content") || document.querySelector("main");
    var nav = document.querySelector(".nav-section");
    if (!main || !nav) return;

    if (!document.getElementById(SEC_ID)) {
      var sec = document.createElement("div");
      sec.id = SEC_ID;
      sec.className = "section";
      main.appendChild(sec);
    }
    if (!document.getElementById(NAV_ID)) {
      injectStyles();
      var a = document.createElement("a");
      a.className = "nav-item";
      a.id = NAV_ID;
      a.setAttribute("data-section", SEC_ID);
      a.innerHTML = '<i class="fas fa-store"></i><span>Coin Shop</span>';
      a.addEventListener("click", function () {
        if (typeof window.showSection === "function") window.showSection(SEC_ID);
        document.querySelectorAll(".nav-item").forEach(function (i) { i.classList.remove("active"); });
        a.classList.add("active");
        var sb = document.getElementById("sidebar");
        if (sb) sb.classList.remove("mobile-open");
        refresh();
      });
      nav.appendChild(a);
    }

    var sec = document.getElementById(SEC_ID);
    if (sec && sec.classList.contains("active") && !document.getElementById("flsBalance")) refresh();
  }

  function init() {
    place();
    setInterval(place, 20000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
