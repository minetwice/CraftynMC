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

      // Minecraft cape UV (64x32):
      // Front (1,1 10x16), Back (12,1 10x16), Sides, Top, Bottom
      function p(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }

      function fillCapePanel(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      }

      // Base Obsidian & Crimson Gold Theme Palette
      const bgDark = "#120208";
      const bgCrimson = "#2a040f";
      const goldBright = "#ffd700";
      const goldMid = "#d4af37";
      const redGlow = "#ff0048";
      const whiteEye = "#ffffff";
      const edgeBorder = "#800020";

      // 1. Fill base panels
      fillCapePanel(1, 1, 10, 16, bgDark); // Front
      fillCapePanel(12, 1, 10, 16, bgDark); // Back
      fillCapePanel(0, 1, 1, 16, edgeBorder); // Left
      fillCapePanel(11, 1, 1, 16, edgeBorder); // Middle border
      fillCapePanel(22, 1, 1, 16, edgeBorder); // Right
      fillCapePanel(1, 0, 10, 1, goldMid); // Top
      fillCapePanel(12, 0, 10, 1, goldMid);
      fillCapePanel(1, 17, 10, 1, bgCrimson); // Bottom
      fillCapePanel(12, 17, 10, 1, bgCrimson);

      // Crimson border gradient on back
      for (let y = 1; y <= 16; y++) {
        p(12, y, edgeBorder);
        p(21, y, edgeBorder);
      }

      // 2. Draw Epic Golden Dragon Emblem on Cape BACK (12,1 to 21,16)
      // Dragon Horns & Head (Top center 15-18, y: 2-5)
      p(15, 2, goldBright); p(18, 2, goldBright); // Horn tips
      p(16, 3, goldBright); p(17, 3, goldBright); // Head crown
      p(15, 4, redGlow); p(18, 4, redGlow);       // Glowing Dragon Eyes
      p(16, 4, goldMid); p(17, 4, goldMid);       // Snout center
      p(16, 5, goldBright); p(17, 5, goldBright); // Fangs/Jaw

      // Dragon Wings Span (y: 5 to 11)
      // Left Wing
      p(13, 5, goldBright); p(14, 5, goldMid);
      p(13, 6, goldBright); p(14, 6, goldMid); p(15, 6, redGlow);
      p(13, 7, goldBright); p(14, 7, goldMid);
      p(13, 8, goldMid);    p(14, 8, bgCrimson);
      p(14, 9, goldMid);

      // Right Wing
      p(20, 5, goldBright); p(19, 5, goldMid);
      p(20, 6, goldBright); p(19, 6, goldMid); p(18, 6, redGlow);
      p(20, 7, goldBright); p(19, 7, goldMid);
      p(20, 8, goldMid);    p(19, 8, bgCrimson);
      p(19, 9, goldMid);

      // Dragon Spine & Body (y: 6 to 14)
      p(16, 6, goldBright); p(17, 6, goldBright);
      p(16, 7, redGlow);    p(17, 7, redGlow);    // Dragon Heart Core
      p(16, 8, goldBright); p(17, 8, goldBright);
      p(16, 9, goldMid);    p(17, 9, goldMid);
      p(16, 10, goldBright); p(17, 10, goldBright);
      p(16, 11, redGlow);    p(17, 11, redGlow);
      p(16, 12, goldMid);    p(17, 12, goldMid);
      p(16, 13, goldBright);                      // Tail curve
      p(17, 14, goldBright); p(18, 15, goldMid);  // Tail tip

      // 3. Draw Matching Crest on Cape FRONT (1,1 to 10,16)
      fillCapePanel(2, 2, 8, 14, bgCrimson);
      p(5, 4, goldBright); p(6, 4, goldBright); // Dragon Insignia Center
      p(4, 5, goldBright); p(7, 5, goldBright);
      p(5, 6, redGlow);    p(6, 6, redGlow);
      p(5, 7, goldBright); p(6, 7, goldBright);
      p(5, 8, goldMid);    p(6, 8, goldMid);
      p(5, 10, goldBright); p(6, 10, goldBright);

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
