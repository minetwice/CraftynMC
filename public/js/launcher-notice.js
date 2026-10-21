/* CraftynMC / FearLauncher — "needs a 64-bit phone" notice
 * ------------------------------------------------------------------
 * FearLauncher ships arm64-v8a native libraries only (its 32-bit set is
 * incomplete — the renderer and the whole Mesa/Vulkan graphics stack are
 * missing), so it cannot run on a 32-bit Android device. Players were
 * downloading it and hitting "App not installed", so we say so up front.
 */
(function () {
  "use strict";

  var NOTICE_ID = "flArchNotice";

  var CSS = [
    "#" + NOTICE_ID + "{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:14px;",
    "border:1px solid rgba(255,180,0,.38);background:rgba(255,180,0,.09);margin:0 0 14px;font-size:13.5px;line-height:1.6}",
    "#" + NOTICE_ID + " .fl-arch-ico{flex:0 0 auto;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;",
    "justify-content:center;background:rgba(255,180,0,.18);color:#ffb400;font-size:14px}",
    "#" + NOTICE_ID + " b{color:#fff}",
    "#" + NOTICE_ID + " .fl-arch-t{color:var(--text-secondary)}",
    "#" + NOTICE_ID + " .fl-arch-more{display:inline-block;margin-top:7px;color:#ff7a9c;text-decoration:none;font-weight:600;cursor:pointer}",
    "#" + NOTICE_ID + " .fl-arch-panel{display:none;margin-top:9px;padding:11px 13px;border-radius:11px;background:rgba(0,0,0,.28);font-size:12.5px;color:var(--text-secondary);line-height:1.7}",
    "#" + NOTICE_ID + " .fl-arch-panel.on{display:block}",
    "#" + NOTICE_ID + " .fl-arch-panel code{background:rgba(255,255,255,.1);padding:1px 6px;border-radius:5px;color:#fff}"
  ].join("");

  function styles() {
    if (document.getElementById("flArchStyles")) return;
    var st = document.createElement("style");
    st.id = "flArchStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function html() {
    return '<div class="fl-arch-ico">!</div><div style="min-width:0;flex:1">' +
        '<div><b>Needs a 64-bit Android phone</b> <span class="fl-arch-t">(arm64). ' +
        'FearLauncher will not install on 32-bit devices.</span></div>' +
        '<span class="fl-arch-more" id="flArchMore">How do I check my phone? ›</span>' +
        '<div class="fl-arch-panel" id="flArchPanel">' +
          "<b style='color:#fff'>Check in 10 seconds:</b><br>" +
          "1. Install a free app like <b>AIDA64</b> or <b>Device Info HW</b> from the Play Store.<br>" +
          "2. Look for <b>CPU Architecture</b> (or <i>Supported ABIs</i>).<br>" +
          "3. If it says <code>arm64-v8a</code> you are good. If it only says <code>armeabi-v7a</code> " +
          "or <code>armeabi</code>, your phone is 32-bit and FearLauncher cannot run on it — this is a " +
          "hardware limit, not something you did wrong.<br>" +
          "<span style='display:block;margin-top:7px'>Phones from roughly 2016 onwards are almost always 64-bit. " +
          "A 64-bit chip with a 32-bit system image also reports <code>armeabi-v7a</code> — a 64-bit ROM would fix that.</span>" +
        "</div>" +
      "</div>";
  }

  function notice() {
    var el = document.createElement("div");
    el.id = NOTICE_ID;
    el.innerHTML = html();
    var more = el.querySelector("#flArchMore");
    var panel = el.querySelector("#flArchPanel");
    if (more && panel) more.addEventListener("click", function () {
      panel.classList.toggle("on");
      more.textContent = panel.classList.contains("on") ? "Hide ›" : "How do I check my phone? ›";
    });
    return el;
  }

  function drop(target, where) {
    if (!target || document.getElementById(NOTICE_ID)) return;
    styles();
    var n = notice();
    if (where === "after") target.parentNode.insertBefore(n, target.nextSibling);
    else target.insertBefore(n, target.firstChild);
  }

  /* ---------- the FearLauncher page ---------- */
  function onLauncherPage() {
    var sec = document.getElementById("fearlauncher");
    if (!sec || !sec.classList.contains("active")) return;
    if (document.getElementById(NOTICE_ID)) return;
    var btn = sec.querySelector("a[href*='FearLauncher'], a[href*='.apk'], button");
    if (btn) drop(btn.closest("div") || btn, "before");
    else drop(sec, "prepend");
  }

  /* ---------- the launcher project page ---------- */
  function onLauncherProject() {
    if (document.getElementById(NOTICE_ID)) return;
    var pp = document.getElementById("project-page");
    if (!pp || !pp.classList.contains("active")) return;
    var p = window.FearLauncherProject && window.FearLauncherProject.current && window.FearLauncherProject.current();
    if (!p || p.category !== "launcher") return;
    var head = pp.querySelector(".pp-head");
    if (head && head.parentNode) head.parentNode.insertBefore(notice(), head.nextSibling);
    else drop(pp, "prepend");
  }

  function tick() {
    try { onLauncherPage(); } catch (e) {}
    try { onLauncherProject(); } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 1500);
})();
