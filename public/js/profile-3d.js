/* Profile + multi 3D viewers (skin / cape / cosmetics) */
(function () {
  const API = "";
  const DEFAULT_STEVE =
    "https://crafatar.com/skins/8667ba71b85a4004af54457a9734eed7";
  const DEFAULT_ALEX =
    "https://crafatar.com/skins/ec561538f3fd461daff5086b22154bce";
  // Default demo cape (skinview3d example cape)
  const DEFAULT_CAPE =
    "https://raw.githubusercontent.com/bs-community/skinview3d/master/examples/assets/cape.png";

  const viewers = {};

  function getToken() {
    return localStorage.getItem("token");
  }

  function showMsg(el, text, ok) {
    if (!el) return;
    el.textContent = text;
    el.className = "msg " + (ok ? "ok" : "error");
  }

  function getSize(wrapId) {
    const wrap = document.getElementById(wrapId);
    let w = wrap ? wrap.clientWidth : 0;
    if (!w || w < 100) w = 300;
    w = Math.min(360, Math.max(260, w - 16));
    return { w: w, h: 420 };
  }

  function disposeViewer(key) {
    if (viewers[key] && viewers[key].viewer) {
      try {
        viewers[key].viewer.dispose();
      } catch (e) {}
    }
    viewers[key] = null;
  }

  function createViewer(key, canvasId, wrapId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (typeof skinview3d === "undefined") {
      console.warn("[3d] skinview3d missing");
      return null;
    }

    disposeViewer(key);

    const size = getSize(wrapId);
    try {
      const viewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: size.w,
        height: size.h,
      });

      if (viewer.renderer) viewer.renderer.setClearColor(0x0a0a0a, 1);
      if (viewer.controls) {
        viewer.controls.enableRotate = true;
        viewer.controls.enableZoom = true;
        viewer.controls.enablePan = false;
      }
      viewer.autoRotate = true;
      viewer.autoRotateSpeed = 0.5;

      try {
        if (skinview3d.WalkingAnimation) {
          viewer.animation = new skinview3d.WalkingAnimation();
          viewer.animation.speed = 0.5;
        }
      } catch (e) {}

      try {
        viewer.camera.position.z = 48;
      } catch (e) {}

      viewers[key] = { viewer: viewer, ready: true, wrapId: wrapId };

      setTimeout(function () {
        if (!viewers[key] || !viewers[key].viewer) return;
        const s2 = getSize(wrapId);
        viewers[key].viewer.width = s2.w;
        viewers[key].viewer.height = s2.h;
      }, 200);

      return viewer;
    } catch (err) {
      console.error("[3d] create failed", key, err);
      return null;
    }
  }

  function userSkinUrl() {
    const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (user.uuid && user.hasSkin === true) {
      return API + "/skins/" + user.uuid + ".png?t=" + Date.now();
    }
    return null;
  }

  function userCapeUrl() {
    const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (user.uuid && user.hasCape === true) {
      return API + "/skins/" + user.uuid + "_cape.png?t=" + Date.now();
    }
    return null;
  }

  function modelOpt() {
    const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const modelSelect = document.getElementById("skinModel");
    const model =
      (modelSelect && modelSelect.value) || user.skinModel || "classic";
    const isSlim = model === "slim";
    return {
      isSlim: isSlim,
      model: isSlim ? "slim" : "default",
      fallbackSkin: isSlim ? DEFAULT_ALEX : DEFAULT_STEVE,
    };
  }

  function loadSkinOn(viewer, skinUrl, model) {
    return viewer.loadSkin(skinUrl, { model: model }).catch(function () {
      return viewer.loadSkin(DEFAULT_STEVE, { model: model });
    });
  }

  function loadCapeOn(viewer, capeUrl) {
    return viewer.loadCape(capeUrl).catch(function () {
      return viewer.loadCape(DEFAULT_CAPE);
    });
  }

  // ---- Skin page viewer ----
  window.initSkinViewer = function () {
    const v = createViewer("skin", "skin3dCanvas", "skin3dWrap");
    if (v) window.refreshSkinViewer();
  };

  window.refreshSkinViewer = function () {
    if (!viewers.skin || !viewers.skin.ready) {
      window.initSkinViewer();
      return;
    }
    const viewer = viewers.skin.viewer;
    const m = modelOpt();
    const skin = userSkinUrl() || m.fallbackSkin;
    loadSkinOn(viewer, skin, m.model).then(function () {
      const cape = userCapeUrl();
      if (cape) loadCapeOn(viewer, cape);
    });
  };

  // ---- Cape page viewer (skin + cape focus) ----
  window.initCapeViewer = function () {
    const v = createViewer("cape", "cape3dCanvas", "cape3dWrap");
    if (v) window.refreshCapeViewer();
  };

  window.refreshCapeViewer = function () {
    if (!viewers.cape || !viewers.cape.ready) {
      window.initCapeViewer();
      return;
    }
    const viewer = viewers.cape.viewer;
    const m = modelOpt();
    const skin = userSkinUrl() || m.fallbackSkin;
    loadSkinOn(viewer, skin, m.model).then(function () {
      const cape = userCapeUrl() || DEFAULT_CAPE;
      loadCapeOn(viewer, cape);
    });
  };

  // ---- Cosmetics page viewer ----
  window.initCosmeticsViewer = function () {
    const v = createViewer("cosmetics", "cosmetics3dCanvas", "cosmetics3dWrap");
    if (v) window.refreshCosmeticsViewer();
  };

  window.refreshCosmeticsViewer = function () {
    if (!viewers.cosmetics || !viewers.cosmetics.ready) {
      window.initCosmeticsViewer();
      return;
    }
    const viewer = viewers.cosmetics.viewer;
    const m = modelOpt();
    const skin = userSkinUrl() || m.fallbackSkin;
    loadSkinOn(viewer, skin, m.model).then(function () {
      const cape = userCapeUrl() || DEFAULT_CAPE;
      loadCapeOn(viewer, cape);
    });
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
        hasCape: p.hasCape,
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

  function later(fn) {
    requestAnimationFrame(function () {
      setTimeout(fn, 80);
    });
  }

  window.__profile3dOnSection = function (sectionId) {
    if (sectionId === "profile") window.loadProfileForm();
    if (sectionId === "skins") later(window.initSkinViewer);
    if (sectionId === "capes") later(window.initCapeViewer);
    if (sectionId === "cosmetics-shop") later(window.initCosmeticsViewer);
  };

  document.addEventListener("DOMContentLoaded", bindProfileEvents);
  if (document.readyState !== "loading") bindProfileEvents();
})();
