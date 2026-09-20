/* Profile + multi 3D viewers (skin / cape / cosmetics) */
(function () {
  const API = "";
  // Classic official Minecraft Steve skin (blue pants, cyan shirt, purple shoes)
  const DEFAULT_STEVE =
    "https://textures.minecraft.net/texture/1a424b9b9213b71480f2d57d0799da8c9735d5642a8b3be568ecf7ce2c0926d5";
  const DEFAULT_ALEX =
    "https://textures.minecraft.net/texture/6e174b0f20e4ee5e19747209e992be769742cf896b01423851ee880cf558f623";

  // Built once: proper 64x32 cape PNG (no CORS issues)
  let DEFAULT_CAPE = null;

  function buildDefaultCapeDataUrl() {
    try {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 32;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 64, 32);

      // Minecraft cape UV layout (64x32):
      // Front (1,1 10x16), Back (12,1 10x16), Left/Right/Top/Bottom borders
      function p(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }

      function fillCapePanel(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      }

      // Rich Red Dragon Palette
      const bgDark = "#0a0306";
      const redDark = "#500010";
      const redPrimary = "#ff0033";
      const redBright = "#ff3355";
      const goldEye = "#ffd700";
      const whiteHighlight = "#ffffff";
      const hornColor = "#e6c280";
      const edgeBorder = "#80001a";

      // 1. Fill base dark obsidian panels
      fillCapePanel(1, 1, 10, 16, bgDark);   // Front
      fillCapePanel(12, 1, 10, 16, bgDark);  // Back
      fillCapePanel(0, 1, 1, 16, edgeBorder); // Left Edge
      fillCapePanel(11, 1, 1, 16, edgeBorder);// Mid Edge
      fillCapePanel(22, 1, 1, 16, edgeBorder);// Right Edge
      fillCapePanel(1, 0, 10, 1, redDark);   // Top
      fillCapePanel(12, 0, 10, 1, redDark);
      fillCapePanel(1, 17, 10, 1, redDark);  // Bottom
      fillCapePanel(12, 17, 10, 1, redDark);

      // Outer Crimson Accent Border
      for (let y = 1; y <= 16; y++) {
        p(1, y, edgeBorder); p(10, y, edgeBorder);
        p(12, y, edgeBorder); p(21, y, edgeBorder);
      }

      // Helper function to draw symmetric Red Dragon Head Emblem
      function drawRedDragonHead(offsetX) {
        // Horns (Top curving outwards)
        p(offsetX + 2, 2, hornColor); p(offsetX + 7, 2, hornColor);
        p(offsetX + 3, 3, hornColor); p(offsetX + 6, 3, hornColor);
        p(offsetX + 4, 4, hornColor); p(offsetX + 5, 4, hornColor);

        // Dragon Brow & Crown
        p(offsetX + 3, 5, redPrimary); p(offsetX + 4, 5, redBright); p(offsetX + 5, 5, redBright); p(offsetX + 6, 5, redPrimary);

        // Eyes (Fiery Gold with White Center Glow)
        p(offsetX + 3, 6, goldEye); p(offsetX + 4, 6, redPrimary); p(offsetX + 5, 6, redPrimary); p(offsetX + 6, 6, goldEye);
        p(offsetX + 3, 7, whiteHighlight); p(offsetX + 6, 7, whiteHighlight);

        // Snout & Nose Bridge
        p(offsetX + 4, 7, redBright); p(offsetX + 5, 7, redBright);
        p(offsetX + 4, 8, redPrimary); p(offsetX + 5, 8, redPrimary);
        p(offsetX + 3, 9, redDark); p(offsetX + 4, 9, redPrimary); p(offsetX + 5, 9, redPrimary); p(offsetX + 6, 9, redDark);

        // Jaw, Nostrils & Fangs
        p(offsetX + 4, 10, bgDark); p(offsetX + 5, 10, bgDark); // Nostrils
        p(offsetX + 3, 11, whiteHighlight); p(offsetX + 6, 11, whiteHighlight); // Sharp Fangs
        p(offsetX + 4, 11, redPrimary); p(offsetX + 5, 11, redPrimary);
        p(offsetX + 4, 12, redDark); p(offsetX + 5, 12, redDark); // Lower Jaw

        // Flame Breath / Neck Spikes
        p(offsetX + 4, 13, redBright); p(offsetX + 5, 13, redBright);
        p(offsetX + 3, 14, redPrimary); p(offsetX + 6, 14, redPrimary);
      }

      // Render Detailed Red Dragon Head on both BACK (12,1) and FRONT (1,1)
      drawRedDragonHead(12); // Back UV Panel
      drawRedDragonHead(1);  // Front UV Panel

      return c.toDataURL("image/png");
    } catch (e) {
      console.warn("[3d] dragon cape canvas failed", e);
      return null;
    }
  }

  function getDefaultCape() {
    if (!DEFAULT_CAPE) DEFAULT_CAPE = buildDefaultCapeDataUrl();
    return DEFAULT_CAPE;
  }

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

  function createViewer(key, canvasId, wrapId, opts) {
    opts = opts || {};
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

      if (viewer.renderer) viewer.renderer.setClearColor(0x080a0f, 0);
      if (viewer.controls) {
        viewer.controls.enableRotate = true;
        viewer.controls.enableZoom = true;
        viewer.controls.enablePan = false;
      }

      // Cape page: start from back so cape is visible immediately
      if (opts.showBack) {
        viewer.autoRotate = true;
        viewer.autoRotateSpeed = 0.35;
        try {
          // face slightly away from camera
          if (viewer.playerObject) {
            viewer.playerObject.rotation.y = Math.PI * 0.85;
          }
        } catch (e) {}
      } else {
        viewer.autoRotate = true;
        viewer.autoRotateSpeed = 0.5;
      }

      try {
        if (skinview3d.WalkingAnimation) {
          viewer.animation = new skinview3d.WalkingAnimation();
          viewer.animation.speed = 0.5;
        }
      } catch (e) {}

      try {
        viewer.camera.position.set(0, 8, opts.showBack ? 52 : 48);
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
    const modelInput = document.getElementById("skinModel");
    const model =
      (modelInput && modelInput.value) || user.skinModel || "classic";
    const isSlim = model === "slim";

    // Sync button active states in UI if available
    const steveBtn = document.getElementById("pickModelSteve");
    const alexBtn = document.getElementById("pickModelAlex");
    if (steveBtn && alexBtn) {
      if (isSlim) {
        alexBtn.classList.add("active");
        steveBtn.classList.remove("active");
      } else {
        steveBtn.classList.add("active");
        alexBtn.classList.remove("active");
      }
    }

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
    const url = capeUrl || getDefaultCape();
    if (!url) return Promise.resolve();

    // backEquipment: "cape" is required for cape to render on the back
    return viewer
      .loadCape(url, { backEquipment: "cape" })
      .catch(function (err) {
        console.warn("[3d] loadCape failed", err);
        const fallback = getDefaultCape();
        if (fallback && url !== fallback) {
          return viewer.loadCape(fallback, { backEquipment: "cape" });
        }
      });
  }

  // ---- Skin page ----
  window.initSkinViewer = function () {
    const v = createViewer("skin", "skin3dCanvas", "skin3dWrap", {});
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
      // only show cape on skin page if user has one
      if (cape) return loadCapeOn(viewer, cape);
    });
  };

  // ---- Cape page (always show cape on back) ----
  window.initCapeViewer = function () {
    const v = createViewer("cape", "cape3dCanvas", "cape3dWrap", {
      showBack: true,
    });
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
      // user cape OR generated default red cape
      return loadCapeOn(viewer, userCapeUrl() || getDefaultCape());
    });
  };

  // ---- Cosmetics page ----
  window.initCosmeticsViewer = function () {
    const v = createViewer("cosmetics", "cosmetics3dCanvas", "cosmetics3dWrap", {
      showBack: true,
    });
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
      return loadCapeOn(viewer, userCapeUrl() || getDefaultCape());
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
