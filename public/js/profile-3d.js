/* Profile edit + 3D skin viewer */
(function () {
  const API = "";
  // Public Steve default (classic) — always available as fallback
  const DEFAULT_STEVE =
    "https://crafatar.com/skins/8667ba71b85a4004af54457a9734eed7";
  const DEFAULT_ALEX =
    "https://crafatar.com/skins/ec561538f3fd461daff5086b22154bce";

  let skinViewer = null;
  let skinViewerReady = false;

  function getToken() {
    return localStorage.getItem("token");
  }

  function showMsg(el, text, ok) {
    if (!el) return;
    el.textContent = text;
    el.className = "msg " + (ok ? "ok" : "error");
  }

  function getViewerSize() {
    const wrap = document.getElementById("skin3dWrap");
    let w = wrap ? wrap.clientWidth : 0;
    if (!w || w < 100) w = 300;
    w = Math.min(360, Math.max(260, w - 16));
    return { w: w, h: 420 };
  }

  window.initSkinViewer = function initSkinViewer() {
    const canvas = document.getElementById("skin3dCanvas");
    if (!canvas) {
      console.warn("[3d] canvas missing");
      return;
    }
    if (typeof skinview3d === "undefined") {
      console.warn("[3d] skinview3d not loaded");
      const hint = document.getElementById("skin3dHint");
      if (hint) hint.textContent = "3D library failed to load. Check internet / CDN.";
      return;
    }

    if (skinViewer) {
      try {
        skinViewer.dispose();
      } catch (e) {}
      skinViewer = null;
      skinViewerReady = false;
    }

    const size = getViewerSize();

    try {
      skinViewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: size.w,
        height: size.h,
      });

      // Dark background
      if (skinViewer.renderer) {
        skinViewer.renderer.setClearColor(0x0a0a0a, 1);
      }

      if (skinViewer.controls) {
        skinViewer.controls.enableRotate = true;
        skinViewer.controls.enableZoom = true;
        skinViewer.controls.enablePan = false;
      }

      skinViewer.autoRotate = true;
      skinViewer.autoRotateSpeed = 0.5;

      try {
        if (skinview3d.WalkingAnimation) {
          skinViewer.animation = new skinview3d.WalkingAnimation();
          skinViewer.animation.speed = 0.5;
        }
      } catch (e) {}

      // Camera distance
      try {
        skinViewer.camera.position.z = 45;
      } catch (e) {}

      skinViewerReady = true;
      window.refreshSkinViewer();

      // Resize after layout settles
      setTimeout(function () {
        if (!skinViewer) return;
        const s2 = getViewerSize();
        skinViewer.width = s2.w;
        skinViewer.height = s2.h;
      }, 200);
    } catch (err) {
      console.error("[3d] init failed", err);
      skinViewerReady = false;
    }
  };

  window.refreshSkinViewer = function refreshSkinViewer() {
    if (!skinViewer || !skinViewerReady) {
      window.initSkinViewer();
      return;
    }

    const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const modelSelect = document.getElementById("skinModel");
    const model =
      (modelSelect && modelSelect.value) || user.skinModel || "classic";
    const isSlim = model === "slim";

    // Prefer user's skin only when we know they have one
    let skinUrl = null;
    if (user.uuid && user.hasSkin === true) {
      skinUrl = API + "/skins/" + user.uuid + ".png?t=" + Date.now();
    }

    const fallback = isSlim ? DEFAULT_ALEX : DEFAULT_STEVE;
    const modelOpt = isSlim ? "slim" : "default";

    function applySkin(url) {
      return skinViewer.loadSkin(url, { model: modelOpt }).catch(function (err) {
        console.warn("[3d] loadSkin failed", url, err);
        if (url !== fallback) {
          return skinViewer.loadSkin(fallback, { model: modelOpt });
        }
      });
    }

    applySkin(skinUrl || fallback);

    if (user.uuid && user.hasCape === true) {
      skinViewer
        .loadCape(API + "/skins/" + user.uuid + "_cape.png?t=" + Date.now())
        .catch(function () {});
    }
  };

  window.loadProfileForm = async function loadProfileForm() {
    try {
      const r = await fetch(API + "/api/profile", {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (!r.ok) return;
      const data = await r.json();
      const p = data.profile || {};

      const dn = document.getElementById("profileDisplayName");
      const bio = document.getElementById("profileBio");
      const desc = document.getElementById("profileDescription");
      const un = document.getElementById("profileUsernameReadonly");
      const logoPrev = document.getElementById("logoPreview");

      if (dn) dn.value = p.displayName || p.username || "";
      if (bio) bio.value = p.bio || "";
      if (desc) desc.value = p.description || "";
      if (un) un.textContent = "@" + (p.username || "");

      if (logoPrev) {
        if (p.logoUrl) {
          logoPrev.src = API + p.logoUrl + "?t=" + Date.now();
          logoPrev.style.display = "block";
        } else {
          logoPrev.style.display = "none";
        }
      }

      const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
      Object.assign(info, {
        displayName: p.displayName,
        bio: p.bio,
        description: p.description,
        hasLogo: p.hasLogo,
        hasSkin: p.hasSkin,
        skinModel: p.skinModel,
      });
      localStorage.setItem("userInfo", JSON.stringify(info));

      const topName = document.getElementById("dashUsername");
      if (topName) topName.textContent = p.displayName || p.username || "User";
    } catch (e) {
      console.error("loadProfileForm", e);
    }
  };

  function bindProfileEvents() {
    const saveBtn = document.getElementById("saveProfileBtn");
    if (saveBtn) {
      saveBtn.onclick = async function () {
        const msg = document.getElementById("profileMsg");
        const displayName =
          (document.getElementById("profileDisplayName") || {}).value || "";
        const bio = (document.getElementById("profileBio") || {}).value || "";
        const description =
          (document.getElementById("profileDescription") || {}).value || "";
        try {
          const r = await fetch(API + "/api/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + getToken(),
            },
            body: JSON.stringify({ displayName, bio, description }),
          });
          const data = await r.json();
          if (!r.ok) return showMsg(msg, data.error || "Save failed", false);
          showMsg(msg, "Profile saved!", true);
          const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
          Object.assign(info, data.profile || {});
          localStorage.setItem("userInfo", JSON.stringify(info));
          const topName = document.getElementById("dashUsername");
          if (topName)
            topName.textContent =
              (data.profile && data.profile.displayName) || info.username;
        } catch (e) {
          showMsg(msg, "Network error", false);
        }
      };
    }

    const logoBtn = document.getElementById("uploadLogoBtn");
    if (logoBtn) {
      logoBtn.onclick = async function () {
        const fileInput = document.getElementById("logoFile");
        const msg = document.getElementById("profileMsg");
        if (!fileInput || !fileInput.files[0])
          return showMsg(msg, "Pick a PNG logo first.", false);
        const fd = new FormData();
        fd.append("logo", fileInput.files[0]);
        try {
          const r = await fetch(API + "/api/profile/logo", {
            method: "POST",
            headers: { Authorization: "Bearer " + getToken() },
            body: fd,
          });
          const data = await r.json();
          if (!r.ok)
            return showMsg(msg, data.error || "Logo upload failed", false);
          showMsg(msg, "Logo updated!", true);
          const logoPrev = document.getElementById("logoPreview");
          if (logoPrev && data.logoUrl) {
            logoPrev.src = API + data.logoUrl + "?t=" + Date.now();
            logoPrev.style.display = "block";
          }
          const av = document.getElementById("userAvatar");
          if (av && data.logoUrl) {
            av.style.backgroundImage =
              "url(" + API + data.logoUrl + "?t=" + Date.now() + ")";
            av.style.backgroundSize = "cover";
            av.textContent = "";
          }
        } catch (e) {
          showMsg(msg, "Network error", false);
        }
      };
    }

    const removeLogoBtn = document.getElementById("removeLogoBtn");
    if (removeLogoBtn) {
      removeLogoBtn.onclick = async function () {
        const msg = document.getElementById("profileMsg");
        try {
          const r = await fetch(API + "/api/profile/logo", {
            method: "DELETE",
            headers: { Authorization: "Bearer " + getToken() },
          });
          const data = await r.json();
          if (!r.ok) return showMsg(msg, data.error || "Failed", false);
          showMsg(msg, "Logo removed.", true);
          const logoPrev = document.getElementById("logoPreview");
          if (logoPrev) logoPrev.style.display = "none";
        } catch (e) {
          showMsg(msg, "Network error", false);
        }
      };
    }
  }

  window.__profile3dOnSection = function (sectionId) {
    if (sectionId === "profile") {
      window.loadProfileForm();
    }
    if (sectionId === "skins") {
      // Section just became visible — wait for layout then init
      requestAnimationFrame(function () {
        setTimeout(function () {
          window.initSkinViewer();
        }, 80);
      });
    }
  };

  document.addEventListener("DOMContentLoaded", bindProfileEvents);
  if (document.readyState !== "loading") bindProfileEvents();
})();
