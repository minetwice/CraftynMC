/* Profile edit + 3D skin viewer helpers */
(function () {
  const API = "";
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

  window.initSkinViewer = function initSkinViewer() {
    const canvas = document.getElementById("skin3dCanvas");
    if (!canvas || typeof skinview3d === "undefined") return;

    if (skinViewer) {
      try {
        skinViewer.dispose();
      } catch (e) {}
      skinViewer = null;
    }

    const w = Math.min(320, canvas.parentElement ? canvas.parentElement.clientWidth - 32 : 300);
    const h = 400;

    skinViewer = new skinview3d.SkinViewer({
      canvas: canvas,
      width: w,
      height: h,
      background: 0x0a0a0a,
    });

    skinViewer.controls.enableRotate = true;
    skinViewer.controls.enableZoom = true;
    skinViewer.controls.enablePan = false;
    skinViewer.autoRotate = true;
    skinViewer.autoRotateSpeed = 0.6;

    try {
      skinViewer.animation = new skinview3d.WalkingAnimation();
      skinViewer.animation.speed = 0.6;
    } catch (e) {}

    skinViewerReady = true;
    window.refreshSkinViewer();
  };

  window.refreshSkinViewer = function refreshSkinViewer() {
    if (!skinViewer || !skinViewerReady) return;
    const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const modelSelect = document.getElementById("skinModel");
    const model = (modelSelect && modelSelect.value) || user.skinModel || "classic";

    const skinUrl =
      user.uuid && user.hasSkin !== false
        ? API + "/skins/" + user.uuid + ".png?t=" + Date.now()
        : null;

    if (skinUrl) {
      skinViewer
        .loadSkin(skinUrl, { model: model === "slim" ? "slim" : "default" })
        .catch(function () {
          /* keep default if load fails */
        });
    }

    // Cape if any
    if (user.uuid && user.hasCape) {
      skinViewer.loadCape(API + "/skins/" + user.uuid + "_cape.png?t=" + Date.now()).catch(function () {});
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

      // sync userInfo
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
        const displayName = (document.getElementById("profileDisplayName") || {}).value || "";
        const bio = (document.getElementById("profileBio") || {}).value || "";
        const description = (document.getElementById("profileDescription") || {}).value || "";

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
          if (topName) topName.textContent = (data.profile && data.profile.displayName) || info.username;
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
        if (!fileInput || !fileInput.files[0]) return showMsg(msg, "Pick a PNG logo first.", false);

        const fd = new FormData();
        fd.append("logo", fileInput.files[0]);

        try {
          const r = await fetch(API + "/api/profile/logo", {
            method: "POST",
            headers: { Authorization: "Bearer " + getToken() },
            body: fd,
          });
          const data = await r.json();
          if (!r.ok) return showMsg(msg, data.error || "Logo upload failed", false);
          showMsg(msg, "Logo updated!", true);
          const logoPrev = document.getElementById("logoPreview");
          if (logoPrev && data.logoUrl) {
            logoPrev.src = API + data.logoUrl + "?t=" + Date.now();
            logoPrev.style.display = "block";
          }
          // update top avatar if possible
          const av = document.getElementById("userAvatar");
          if (av && data.logoUrl) {
            av.style.backgroundImage = "url(" + API + data.logoUrl + "?t=" + Date.now() + ")";
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

  // Hook into showSection if available
  const origShow =
    typeof window.showSection === "function"
      ? window.showSection
      : null;

  window.__profile3dOnSection = function (sectionId) {
    if (sectionId === "profile") {
      window.loadProfileForm();
    }
    if (sectionId === "skins" || sectionId === "profile") {
      setTimeout(function () {
        if (!skinViewerReady) window.initSkinViewer();
        else window.refreshSkinViewer();
      }, 100);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    bindProfileEvents();
  });

  // Also bind immediately if DOM already ready
  if (document.readyState !== "loading") {
    bindProfileEvents();
  }
})();
