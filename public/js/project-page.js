/* CraftynMC / FearLauncher — Modrinth-style project page
 * ------------------------------------------------------------------
 * A full page (not a modal) for one project:
 *   header  : icon + title + tagline + stats + Download
 *   sidebar : Compatibility (versions, platforms, environment) · Links ·
 *             Tags · Creators · Details (Licence, Published, Updated)
 *   main    : tabs — Description · Versions · Gallery · Reviews
 *
 * Reachable at /<category>/<project-name> (deep links), and used by the store
 * when you click a card.
 */
(function () {
  "use strict";

  var SEC_ID = "project-page";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function slugify(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function timeAgo(d) {
    if (!d) return "—";
    var t = new Date(d).getTime();
    if (!t) return "—";
    var s = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (s < 60) return "just now";
    var m = Math.round(s / 60);
    if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    var d2 = Math.round(h / 24);
    if (d2 < 30) return d2 + (d2 === 1 ? " day ago" : " days ago");
    var mo = Math.round(d2 / 30);
    if (mo < 12) return mo + (mo === 1 ? " month ago" : " months ago");
    return Math.round(mo / 12) + " years ago";
  }

  function big(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function meta(cat) {
    var M = {
      mods: { icon: "fa-cube", name: "Mod" },
      plugins: { icon: "fa-plug", name: "Plugin" },
      resources: { icon: "fa-box", name: "Resource Pack" },
      shaders: { icon: "fa-sun", name: "Shader" },
      launcher: { icon: "fa-rocket", name: "Launcher" },
      capes: { icon: "fa-scroll", name: "Cape" },
      cosmetics: { icon: "fa-crown", name: "Cosmetic" }
    };
    return M[cat] || M.mods;
  }

  function envLabel(v) {
    return v === "client" ? "Client-side" : v === "server" ? "Server-side" : v === "both" ? "Client and server" : "";
  }

  function chips(list, cls) {
    if (!list || !list.length) return "";
    return '<div class="pp-chips">' + list.map(function (t) {
      return '<span class="pp-chip ' + (cls || "") + '">' + esc(t) + "</span>";
    }).join("") + "</div>";
  }

  var CSS = [
    ".pp-wrap{max-width:1180px}",
    ".pp-head{display:flex;gap:18px;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap}",
    ".pp-icon{width:104px;height:104px;border-radius:20px;flex:0 0 auto;object-fit:cover;background:#1b1e29;display:flex;align-items:center;justify-content:center;font-size:40px;color:#8b8ea0;box-shadow:0 14px 34px rgba(0,0,0,.5)}",
    ".pp-hinfo{flex:1;min-width:240px}",
    ".pp-title{font-family:'Outfit',sans-serif;font-size:27px;font-weight:800;color:#fff;margin:0 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
    ".pp-tag{font-size:14px;color:var(--text-secondary);margin:0 0 12px;line-height:1.6}",
    ".pp-stats{display:flex;gap:18px;flex-wrap:wrap;font-size:13.5px;color:#fff}",
    ".pp-stats span b{font-weight:800}",
    ".pp-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}",
    ".pp-btn{padding:13px 22px;border:none;border-radius:13px;background:linear-gradient(135deg,#ff0048,#8b0022);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:9px}",
    ".pp-ghost{background:rgba(255,255,255,.06);border:1px solid var(--border-color);color:#fff}",
    ".pp-grid{display:grid;grid-template-columns:300px 1fr;gap:22px;align-items:start}",
    "@media (max-width:900px){.pp-grid{grid-template-columns:1fr}}",
    ".pp-side{display:flex;flex-direction:column;gap:16px}",
    ".pp-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:15px 16px}",
    ".pp-card h4{margin:0 0 10px;font-family:'Outfit',sans-serif;font-size:14px;color:#fff;display:flex;align-items:center;gap:8px}",
    ".pp-sub{font-size:11px;font-weight:700;letter-spacing:.4px;color:var(--text-secondary);text-transform:uppercase;margin:10px 0 6px}",
    ".pp-chips{display:flex;flex-wrap:wrap;gap:6px}",
    ".pp-chip{background:rgba(255,255,255,.06);border:1px solid var(--border-color);border-radius:20px;padding:4px 11px;font-size:12px;color:#fff}",
    ".pp-chip.acc{background:rgba(255,0,72,.14);border-color:rgba(255,0,72,.4);color:#ff9bb4}",
    ".pp-chip.ok{background:rgba(0,255,136,.12);border-color:rgba(0,255,136,.3);color:#00ff88}",
    ".pp-row{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border-color)}",
    ".pp-row:last-child{border-bottom:none}",
    ".pp-row span{color:var(--text-secondary)}",
    ".pp-row b{color:#fff;font-weight:600;text-align:right}",
    ".pp-links a{display:block;font-size:13px;color:#ff7a9c;text-decoration:none;padding:5px 0}",
    ".pp-main{min-width:0}",
    ".pp-tabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--border-color);margin-bottom:16px;padding-bottom:2px}",
    ".pp-tab{padding:10px 14px;border:none;background:none;color:var(--text-secondary);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent}",
    ".pp-tab.on{color:#fff;border-bottom-color:var(--primary-red)}",
    ".pp-panel{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:20px}",
    ".pp-desc{color:#dcdde6;font-size:14.5px;line-height:1.75;word-wrap:break-word}",
    ".pp-desc img{max-width:100%;border-radius:12px}",
    ".pp-desc h1,.pp-desc h2,.pp-desc h3{color:#fff;font-family:'Outfit',sans-serif}",
    ".pp-desc a{color:#ff7a9c}",
    ".pp-desc code{background:rgba(255,255,255,.08);padding:1px 6px;border-radius:6px}",
    ".pp-ver{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px;border:1px solid var(--border-color);border-radius:14px;background:rgba(255,255,255,.02)}",
    ".pp-ver b{color:#fff;font-size:14px}",
    ".pp-ver .pp-muted{font-size:12.5px;color:var(--text-secondary)}",
    ".pp-muted{color:var(--text-secondary)}",
    ".pp-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}",
    ".pp-gal img{width:100%;border-radius:14px;border:1px solid var(--border-color);cursor:pointer}",
    ".pp-rev{padding:11px 0;border-bottom:1px solid var(--border-color)}",
    ".pp-rev-head{display:flex;align-items:center;gap:9px;font-size:13.5px;color:#fff}",
    ".pp-stars i{color:gold;font-size:12px}",
    ".pp-rev p{margin:5px 0 0;font-size:13.5px;color:var(--text-secondary);line-height:1.6}",
    ".pp-star-pick{display:flex;gap:6px;margin:4px 0 10px;cursor:pointer}",
    ".pp-star-pick i{font-size:22px;color:#4a4a55}",
    ".pp-star-pick i.on{color:gold}",
    ".pp-rev-form textarea{width:100%;box-sizing:border-box;padding:11px 13px;border-radius:12px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-family:inherit;font-size:13.5px;resize:vertical;margin-bottom:10px}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("ppStyles")) return;
    var st = document.createElement("style");
    st.id = "ppStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- the page ---------------- */
  var current = null;
  var activeTab = "description";

  function section() {
    var main = document.querySelector("main.main-content") || document.querySelector("main");
    if (!main) return null;
    var sec = document.getElementById(SEC_ID);
    if (!sec) {
      sec = document.createElement("div");
      sec.id = SEC_ID;
      sec.className = "section";
      main.appendChild(sec);
    }
    return sec;
  }

  function headHTML(a) {
    var m = meta(a.category);
    var icon = a.iconUrl || a.previewUrl;
    var rating = a.ratingCount ? (a.ratingAvg || 0) + " <span class='pp-muted'>(" + a.ratingCount + ")</span>" : "—";
    return '<div class="pp-head">' +
        (icon
          ? '<img class="pp-icon" src="' + esc(icon) + '" alt="" onerror="this.style.display=\'none\'">'
          : '<div class="pp-icon"><i class="fas ' + m.icon + '"></i></div>') +
        '<div class="pp-hinfo">' +
          '<h1 class="pp-title">' + esc(a.name) +
            (a.featuredUntil && new Date(a.featuredUntil) > new Date() ? ' <span class="pp-chip" style="background:rgba(255,215,0,.16);color:gold">★ Featured</span>' : "") +
          "</h1>" +
          (a.lore ? '<p class="pp-tag">' + esc(a.lore) + "</p>" : (a.description ? '<p class="pp-tag">' + esc(String(a.description).replace(/[#*`>_]/g, "").slice(0, 160)) + "</p>" : "")) +
          '<div class="pp-stats">' +
            "<span><b>" + big(a.downloadsCount) + "</b> downloads</span>" +
            "<span><b>" + big(a.views) + "</b> views</span>" +
            "<span><b>" + rating + "</b> rating</span>" +
            "<span><b>" + (a.coinCost > 0 ? a.coinCost + " coins" : "Free") + "</b></span>" +
          "</div>" +
          '<div class="pp-actions">' +
            '<button type="button" class="pp-btn" id="ppDownload"><i class="fas fa-download"></i> Download</button>' +
            '<button type="button" class="pp-btn pp-ghost" id="ppCopy"><i class="fas fa-link"></i> Copy link</button>' +
            '<button type="button" class="pp-btn pp-ghost" id="ppBack"><i class="fas fa-arrow-left"></i> Back</button>' +
          "</div>" +
        "</div>" +
      "</div>";
  }

  function sideHTML(a) {
    var m = meta(a.category);
    var links = (a.links || []).map(function (row) {
      var i = String(row).indexOf("|");
      if (i === -1) return "";
      var label = row.slice(0, i), url = row.slice(i + 1);
      return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + " ↗</a>";
    }).join("");

    var env = envLabel(a.environment);
    var tags = [];
    (a.loaders || []).forEach(function (l) { tags.push({ t: l, c: "" }); });
    tags.push({ t: m.name, c: "acc" });
    if (env) tags.push({ t: env, c: "ok" });

    return '<aside class="pp-side">' +
      '<div class="pp-card"><h4><i class="fas fa-gamepad"></i> Compatibility</h4>' +
        '<div class="pp-sub">Minecraft: Java Edition</div>' +
        chips(a.supportedVersions) +
        ((a.loaders || []).length ? '<div class="pp-sub">Platforms</div>' + chips(a.loaders) : "") +
        (env ? '<div class="pp-sub">Supported environments</div>' + chips([env], "ok") : "") +
      "</div>" +
      (links ? '<div class="pp-card"><h4><i class="fas fa-link"></i> Links</h4><div class="pp-links">' + links + "</div></div>" : "") +
      '<div class="pp-card"><h4><i class="fas fa-tags"></i> Tags</h4>' +
        '<div class="pp-chips">' + tags.map(function (t) { return '<span class="pp-chip ' + t.c + '">' + esc(t.t) + "</span>"; }).join("") + "</div>" +
      "</div>" +
      '<div class="pp-card"><h4><i class="fas fa-user"></i> Creators</h4>' +
        '<div class="pp-chips"><span class="pp-chip" style="cursor:pointer" id="ppCreator">' + esc(a.uploadedBy || "Unknown") + "</span></div>" +
      "</div>" +
      '<div class="pp-card"><h4><i class="fas fa-circle-info"></i> Details</h4>' +
        '<div class="pp-row"><span>Licence</span><b>' +
          (a.licence ? '<a href="/legal/licence" target="_blank" style="color:#ff7a9c;text-decoration:none">' + esc(a.licence) + "</a>" : '<span class="pp-muted">Not specified</span>') +
        "</b></div>" +
        '<div class="pp-row"><span>Published</span><b>' + timeAgo(a.createdAt) + "</b></div>" +
        '<div class="pp-row"><span>Updated</span><b>' + timeAgo(a.updatedAt) + "</b></div>" +
        '<div class="pp-row"><span>Version</span><b>' + esc(a.version || "1.0.0") + "</b></div>" +
      "</div>" +
    "</aside>";
  }

  function tabsHTML() {
    var tabs = [["description", "Description"], ["versions", "Versions"], ["gallery", "Gallery"], ["reviews", "Reviews"]];
    return '<div class="pp-tabs">' + tabs.map(function (t) {
      return '<button type="button" class="pp-tab' + (t[0] === activeTab ? " on" : "") + '" data-tab="' + t[0] + '">' + t[1] + "</button>";
    }).join("") + "</div>";
  }

  function panelHTML(a) {
    if (activeTab === "versions") {
      return '<div class="pp-panel"><div class="pp-ver">' +
          '<div style="flex:1;min-width:180px"><b>' + esc(a.version || "1.0.0") + "</b>" +
            '<div class="pp-muted">' + timeAgo(a.updatedAt) + (a.fileSize ? " · " + (a.fileSize / 1048576).toFixed(2) + " MB" : "") + "</div>" +
            '<div class="pp-chips" style="margin-top:8px">' +
              (a.supportedVersions || []).map(function (v) { return '<span class="pp-chip">' + esc(v) + "</span>"; }).join("") +
              (a.loaders || []).map(function (l) { return '<span class="pp-chip acc">' + esc(l) + "</span>"; }).join("") +
            "</div></div>" +
          '<button type="button" class="pp-btn" id="ppVerDownload"><i class="fas fa-download"></i> Download</button>' +
        "</div>" +
        '<p class="pp-muted" style="margin:14px 0 0;font-size:12.5px">Only the latest version is published on CraftynMC. Older builds can be requested from the creator.</p></div>';
    }
    if (activeTab === "gallery") {
      var imgs = [];
      if (a.previewUrl) imgs.push(a.previewUrl);
      if (a.iconUrl && a.iconUrl !== a.previewUrl) imgs.push(a.iconUrl);
      return '<div class="pp-panel">' + (imgs.length
        ? '<div class="pp-gal">' + imgs.map(function (u) { return '<img src="' + esc(u) + '" alt="" loading="lazy">'; }).join("") + "</div>"
        : '<p class="pp-muted">No gallery images yet.</p>') + "</div>";
    }
    if (activeTab === "reviews") {
      return '<div class="pp-panel"><div id="ppReviews"><p class="pp-muted">Loading reviews…</p></div></div>';
    }
    // description
    var body = "";
    try {
      if (window.FearLauncherRichDesc && window.FearLauncherRichDesc.render) {
        body = window.FearLauncherRichDesc.render(a.description || "");
      }
    } catch (e) {}
    if (!body) body = "<p>" + esc(a.description || "No description yet.") + "</p>";
    return '<div class="pp-panel"><div class="pp-desc">' + body + "</div></div>";
  }

  function paint(a) {
    var sec = section();
    if (!sec) return;
    sec.innerHTML = '<div class="pp-wrap">' + headHTML(a) + '<div class="pp-grid">' + sideHTML(a) +
      '<div class="pp-main">' + tabsHTML() + panelHTML(a) + "</div></div></div>";

    var dl = function () { try { window.purchaseAndDownloadAsset(a._id); } catch (e) {} };
    var b1 = document.getElementById("ppDownload"); if (b1) b1.addEventListener("click", dl);
    var b2 = document.getElementById("ppVerDownload"); if (b2) b2.addEventListener("click", dl);
    var cp = document.getElementById("ppCopy");
    if (cp) cp.addEventListener("click", function () {
      if (window.FearLauncherLinks && window.FearLauncherLinks.copy) window.FearLauncherLinks.copy();
    });
    var bk = document.getElementById("ppBack");
    if (bk) bk.addEventListener("click", function () {
      if (typeof window.showSection === "function") window.showSection(a.category === "launcher" ? "fearlauncher" : a.category);
    });
    var cr = document.getElementById("ppCreator");
    if (cr) cr.addEventListener("click", function () {
      if (window.FearLauncherPlayerLookup) window.FearLauncherPlayerLookup.open(a.uploadedBy);
    });

    Array.prototype.forEach.call(sec.querySelectorAll(".pp-tab"), function (t) {
      t.addEventListener("click", function () {
        activeTab = t.getAttribute("data-tab");
        paint(a);
        if (activeTab === "reviews") loadReviews(a._id);
      });
    });

    if (activeTab === "reviews") loadReviews(a._id);
  }

  /* ---------------- reviews ---------------- */
  function stars(n) {
    var out = "";
    for (var i = 1; i <= 5; i++) out += '<i class="fas fa-star' + (i <= Math.round(n) ? "" : "-o") + '"></i>';
    return out;
  }

  function loadReviews(id) {
    var box = document.getElementById("ppReviews");
    if (!box) return;
    var t = "";
    try { t = (typeof window.getToken === "function") ? window.getToken() : ""; } catch (e) {}
    fetch("/api/assets/" + id + "/reviews")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        var list = (d.reviews || []).map(function (rv) {
          return '<div class="pp-rev"><div class="pp-rev-head"><b>' + esc(rv.username) + "</b>" +
            '<span class="pp-stars">' + stars(rv.rating) + "</span></div>" +
            (rv.text ? "<p>" + esc(rv.text) + "</p>" : "") + "</div>";
        }).join("") || '<p class="pp-muted">No reviews yet — be the first!</p>';

        var form = t
          ? '<div class="pp-rev-form"><div class="pp-star-pick" id="ppStarPick">' +
              [1, 2, 3, 4, 5].map(function (n) { return '<i class="fas fa-star" data-n="' + n + '"></i>'; }).join("") +
            '</div><textarea id="ppRevText" rows="3" placeholder="Share what you think (optional)"></textarea>' +
            '<button type="button" class="pp-btn" id="ppRevSave">Post review</button></div>'
          : '<p class="pp-muted">Log in to leave a review.</p>';

        box.innerHTML = (d.count ? '<p class="pp-muted" style="margin:0 0 12px">' + d.avg + " / 5 from " + d.count + " review" + (d.count === 1 ? "" : "s") + "</p>" : "") +
          form + list;

        var pick = document.getElementById("ppStarPick");
        if (!pick) return;
        var chosen = 5;
        Array.prototype.forEach.call(pick.querySelectorAll("i"), function (ic, j) {
          ic.classList.toggle("on", j < chosen);
          ic.addEventListener("click", function () {
            chosen = Number(ic.getAttribute("data-n"));
            Array.prototype.forEach.call(pick.querySelectorAll("i"), function (x, k) { x.classList.toggle("on", k < chosen); });
          });
        });
        var save = document.getElementById("ppRevSave");
        if (save) save.addEventListener("click", function () {
          var txt = (document.getElementById("ppRevText") || {}).value || "";
          save.disabled = true;
          save.textContent = "Posting…";
          fetch("/api/assets/" + id + "/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
            body: JSON.stringify({ rating: chosen, text: txt })
          }).then(function () { loadReviews(id); })
            .catch(function () { save.disabled = false; save.textContent = "Post review"; });
        });
      })
      .catch(function () {});
  }

  /* ---------------- public API ---------------- */
  function open(a) {
    if (!a) return;
    current = a;
    activeTab = "description";
    injectStyles();
    section();
    if (typeof window.showSection === "function") window.showSection(SEC_ID);
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (i) { i.classList.remove("active"); });
    paint(a);
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  window.FearLauncherProject = {
    open: open,
    current: function () { return current; },
    slugOf: slugify
  };
})();
