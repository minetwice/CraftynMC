/* CraftynMC — Change password
 * ------------------------------------------------------------------
 * A card on the Profile page: current password + new password + confirm.
 * The server verifies the current password before accepting the new one, so
 * knowing the old password is required (as asked).
 */
(function () {
  "use strict";

  var HOST = "flChangePass";
  var busy = false;

  function token() {
    try {
      if (typeof window.getToken === "function") return window.getToken() || "";
    } catch (e) {}
    try { return localStorage.getItem("token") || ""; } catch (e) {}
    return "";
  }

  function loggedIn() {
    if (token()) return true;
    try {
      var a = document.getElementById("authView");
      return !(a && a.classList.contains("active"));
    } catch (e) { return false; }
  }

  var CSS = [
    "#" + HOST + "{margin-top:22px}",
    ".flcp-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:18px;padding:20px}",
    ".flcp-head{display:flex;align-items:center;gap:12px;margin-bottom:6px}",
    ".flcp-head .flcp-ico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;",
      "background:rgba(255,0,72,.14);color:var(--primary-red);font-size:16px;flex:0 0 auto}",
    ".flcp-head h3{margin:0;font-family:'Outfit',sans-serif;font-size:16px;color:#fff}",
    ".flcp-sub{margin:0 0 16px;font-size:12.5px;color:var(--text-secondary);line-height:1.6}",
    ".flcp-field{margin-bottom:13px}",
    ".flcp-field label{display:block;font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:6px}",
    ".flcp-wrap{position:relative;display:flex;align-items:center}",
    ".flcp-wrap input{width:100%;padding:13px 44px 13px 14px;border-radius:12px;border:1px solid var(--border-color);",
      "background:rgba(0,0,0,.35);color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s ease}",
    ".flcp-wrap input:focus{border-color:var(--primary-red)}",
    ".flcp-eye{position:absolute;right:6px;width:34px;height:34px;border:none;background:transparent;color:var(--text-secondary);",
      "cursor:pointer;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px}",
    ".flcp-eye:hover{color:#fff;background:rgba(255,255,255,.07)}",
    ".flcp-btn{width:100%;padding:14px;border:none;border-radius:12px;background:var(--gradient-main);color:#fff;",
      "font-weight:700;font-size:14.5px;cursor:pointer;font-family:inherit;margin-top:4px;transition:filter .15s ease,transform .12s ease}",
    ".flcp-btn:hover:not(:disabled){filter:brightness(1.08)}",
    ".flcp-btn:active:not(:disabled){transform:scale(.99)}",
    ".flcp-btn:disabled{opacity:.6;cursor:not-allowed}",
    ".flcp-msg{margin-top:12px;font-size:13px;line-height:1.6;min-height:18px;text-align:center}",
    ".flcp-ok{color:#00ff88}",
    ".flcp-err{color:#ff6b8b}",
    ".flcp-hint{margin-top:10px;font-size:11.5px;color:var(--text-secondary);text-align:center}"
  ].join("");

  function styles() {
    if (document.getElementById("flcpStyles")) return;
    var st = document.createElement("style");
    st.id = "flcpStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function cardHTML() {
    return '<div class="flcp-card">' +
        '<div class="flcp-head">' +
          '<div class="flcp-ico"><i class="fas fa-key"></i></div>' +
          "<div><h3>Change password</h3></div>" +
        "</div>" +
        '<p class="flcp-sub">Enter your <b style="color:#fff">current password</b> first — we only ' +
          "change it if that is correct.</p>" +

        '<div class="flcp-field">' +
          '<label for="flcpOld">Current password</label>' +
          '<div class="flcp-wrap">' +
            '<input id="flcpOld" type="password" autocomplete="current-password" placeholder="Your password now" />' +
            '<button type="button" class="flcp-eye" data-for="flcpOld" aria-label="Show password"><i class="fas fa-eye"></i></button>' +
          "</div>" +
        "</div>" +

        '<div class="flcp-field">' +
          '<label for="flcpNew">New password</label>' +
          '<div class="flcp-wrap">' +
            '<input id="flcpNew" type="password" autocomplete="new-password" placeholder="At least 6 characters" />' +
            '<button type="button" class="flcp-eye" data-for="flcpNew" aria-label="Show password"><i class="fas fa-eye"></i></button>' +
          "</div>" +
        "</div>" +

        '<div class="flcp-field">' +
          '<label for="flcpNew2">Repeat new password</label>' +
          '<div class="flcp-wrap">' +
            '<input id="flcpNew2" type="password" autocomplete="new-password" placeholder="Type it again" />' +
            '<button type="button" class="flcp-eye" data-for="flcpNew2" aria-label="Show password"><i class="fas fa-eye"></i></button>' +
          "</div>" +
        "</div>" +

        '<button type="button" class="flcp-btn" id="flcpSave"><i class="fas fa-shield-halved"></i> Change password</button>' +
        '<div class="flcp-msg" id="flcpMsg"></div>' +
        '<p class="flcp-hint">You stay logged in after changing it.</p>' +
      "</div>";
  }

  function msg(text, ok) {
    var m = document.getElementById("flcpMsg");
    if (!m) return;
    m.className = "flcp-msg " + (ok ? "flcp-ok" : "flcp-err");
    m.innerHTML = (ok ? '<i class="fas fa-circle-check"></i> ' : '<i class="fas fa-circle-exclamation"></i> ') + text;
  }

  function submit() {
    if (busy) return;

    var oldEl = document.getElementById("flcpOld");
    var newEl = document.getElementById("flcpNew");
    var new2El = document.getElementById("flcpNew2");
    if (!oldEl || !newEl || !new2El) return;

    var current = oldEl.value;
    var next = newEl.value;
    var again = new2El.value;

    if (!current) { msg("Enter your current password.", false); oldEl.focus(); return; }
    if (next.length < 6) { msg("The new password needs at least 6 characters.", false); newEl.focus(); return; }
    if (next !== again) { msg("The two new passwords do not match.", false); new2El.focus(); return; }
    if (next === current) { msg("The new password must be different from the current one.", false); newEl.focus(); return; }

    var t = token();
    if (!t) { msg("Please log in again first.", false); return; }

    busy = true;
    var btn = document.getElementById("flcpSave");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }
    msg("Checking your current password…", true);

    fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ currentPassword: current, newPassword: next })
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; });
      })
      .then(function (out) {
        if (out.ok && out.data && out.data.success) {
          oldEl.value = ""; newEl.value = ""; new2El.value = "";
          msg("Password changed. Use the new one next time you log in.", true);
        } else {
          msg((out.data && out.data.error) || "Could not change the password.", false);
        }
      })
      .catch(function () { msg("Network problem — try again.", false); })
      .then(function () {
        busy = false;
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-shield-halved"></i> Change password'; }
      });
  }

  function mount() {
    styles();
    var sec = document.getElementById("profile");
    if (!sec || !sec.classList.contains("active")) return;
    if (!loggedIn()) return;
    if (document.getElementById(HOST)) return;

    var host = document.createElement("div");
    host.id = HOST;
    host.innerHTML = cardHTML();
    sec.appendChild(host);

    var save = document.getElementById("flcpSave");
    if (save) save.addEventListener("click", submit);

    // Enter anywhere in the card submits
    Array.prototype.forEach.call(host.querySelectorAll("input"), function (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
      });
    });

    // Show / hide each field (phones have no easy way to check what they typed)
    Array.prototype.forEach.call(host.querySelectorAll(".flcp-eye"), function (b) {
      b.addEventListener("click", function () {
        var inp = document.getElementById(b.getAttribute("data-for"));
        if (!inp) return;
        var showing = inp.type === "text";
        inp.type = showing ? "password" : "text";
        b.innerHTML = '<i class="fas fa-eye' + (showing ? "" : "-slash") + '"></i>';
      });
    });
  }

  function tick() { mount(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 2500);
})();
