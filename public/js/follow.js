/* CraftynMC — Follow buttons
 * ------------------------------------------------------------------
 * "Follow" / "Following" with live counts, on:
 *   - a Player Lookup profile
 *   - a project page (next to the creator)
 * Followers are what bring players back — the creator gets a notification too.
 */
(function () {
  "use strict";

  var ROW = "flFollowRow";
  var PROJ = "flFollowProj";
  var lastUser = "";
  var lastProj = "";

  function token() {
    try { return (typeof window.getToken === "function") ? window.getToken() : ""; } catch (e) { return ""; }
  }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var t = token();
    if (t) opts.headers.Authorization = "Bearer " + t;
    return fetch(path, opts).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CSS = [
    ".fl-fw-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;margin:0 0 14px;",
      "border:1px solid var(--border-color);border-radius:14px;background:var(--bg-card)}",
    ".fl-fw-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:none;cursor:pointer;",
      "font-family:inherit;font-size:13.5px;font-weight:700;background:var(--gradient-main);color:#fff;",
      "transition:filter .15s ease,transform .12s ease}",
    ".fl-fw-btn:hover{filter:brightness(1.08)}",
    ".fl-fw-btn:active{transform:scale(.98)}",
    ".fl-fw-btn.on{background:rgba(255,255,255,.07);border:1px solid var(--border-hover);color:#fff}",
    ".fl-fw-count{font-size:13px;color:var(--text-secondary)}",
    ".fl-fw-count b{color:#fff;font-weight:800}",
    ".fl-fw-btn.mini{padding:6px 13px;font-size:12px;border-radius:10px}",
    ".fl-fw-note{font-size:12px;color:var(--text-secondary);margin-left:auto}"
  ].join("");

  function styles() {
    if (document.getElementById("flFwStyles")) return;
    var st = document.createElement("style");
    st.id = "flFwStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- profile ---------------- */
  function profileTick() {
    var pl = window.FearLauncherPlayerLookup;
    var u = pl && pl.current;
    if (!u) { lastUser = ""; return; }
    var host = document.getElementById("flpResult");
    if (!host || host.textContent.length < 20) return;
    if (u === lastUser && document.getElementById(ROW)) return;
    lastUser = u;

    var old = document.getElementById(ROW);
    if (old) old.remove();

    api("/api/follow/" + encodeURIComponent(u)).then(function (d) {
      if (!d || !d.success) return;
      var row = document.createElement("div");
      row.id = ROW;
      row.className = "fl-fw-row";
      row.innerHTML =
        '<button type="button" class="fl-fw-btn' + (d.following ? " on" : "") + '" id="flFwBtn">' +
          '<i class="fas ' + (d.following ? "fa-check" : "fa-user-plus") + '"></i>' +
          (d.following ? "Following" : "Follow") +
        "</button>" +
        '<span class="fl-fw-count"><b>' + (d.followersCount || 0) + "</b> followers</span>" +
        '<span class="fl-fw-count"><b>' + (d.followingCount || 0) + "</b> following</span>";
      host.insertBefore(row, host.firstChild);

      var btn = document.getElementById("flFwBtn");
      btn.addEventListener("click", function () {
        if (!token()) { btn.textContent = "Log in to follow"; return; }
        var isOn = btn.classList.contains("on");
        btn.disabled = true;
        api("/api/follow/" + encodeURIComponent(u), { method: isOn ? "DELETE" : "POST" }).then(function (r) {
          btn.disabled = false;
          if (!r || !r.success) return;
          btn.classList.toggle("on", r.following);
          btn.innerHTML = '<i class="fas ' + (r.following ? "fa-check" : "fa-user-plus") + '"></i>' +
            (r.following ? "Following" : "Follow");
          var c = row.querySelector(".fl-fw-count b");
          if (c && typeof r.followersCount === "number") c.textContent = r.followersCount;
        });
      });
    });
  }

  /* ---------------- project page creator ---------------- */
  function projectTick() {
    var pp = document.getElementById("project-page");
    if (!pp || !pp.classList.contains("active")) { lastProj = ""; return; }
    var p = window.FearLauncherProject && window.FearLauncherProject.current && window.FearLauncherProject.current();
    if (!p || !p.uploadedBy) return;
    if (p.uploadedBy === lastProj && document.getElementById(PROJ)) return;
    lastProj = p.uploadedBy;

    var old = document.getElementById(PROJ);
    if (old) old.remove();
    var creator = document.getElementById("ppCreator");
    if (!creator || !creator.parentNode) return;

    api("/api/follow/" + encodeURIComponent(p.uploadedBy)).then(function (d) {
      if (!d || !d.success) return;
      var b = document.createElement("button");
      b.id = PROJ;
      b.type = "button";
      b.className = "fl-fw-btn mini" + (d.following ? " on" : "");
      b.style.marginLeft = "8px";
      b.innerHTML = '<i class="fas ' + (d.following ? "fa-check" : "fa-user-plus") + '"></i>' +
        (d.following ? "Following" : "Follow");
      b.addEventListener("click", function () {
        if (!token()) return;
        var isOn = b.classList.contains("on");
        b.disabled = true;
        api("/api/follow/" + encodeURIComponent(p.uploadedBy), { method: isOn ? "DELETE" : "POST" }).then(function (r) {
          b.disabled = false;
          if (!r || !r.success) return;
          b.classList.toggle("on", r.following);
          b.innerHTML = '<i class="fas ' + (r.following ? "fa-check" : "fa-user-plus") + '"></i>' +
            (r.following ? "Following" : "Follow");
        });
      });
      creator.parentNode.appendChild(b);
    });
  }

  function tick() {
    styles();
    try { profileTick(); } catch (e) {}
    try { projectTick(); } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 1500);
})();
