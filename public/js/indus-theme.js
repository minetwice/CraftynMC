/* CraftynMC — Cotton Soft UI + polished section pages + stage */
(function () {
  if (document.getElementById("indus-theme")) return;

  var css = [
    ":root{",
    "--bg:#0a0406;",
    "--surface:rgba(28,12,16,.72);",
    "--card:rgba(36,14,18,.72);",
    "--border:rgba(255,60,80,.14);",
    "--red:#ff3355;",
    "--red-soft:rgba(255,51,85,.12);",
    "--red-glow:rgba(255,51,85,.28);",
    "--text:#fff6f7;",
    "--muted:#c9a8ae;",
    "--soft:cubic-bezier(0.25,0.8,0.25,1);",
    "--cotton:cubic-bezier(0.33,1,0.68,1)",
    "}",
    "html{scroll-behavior:smooth}",
    "body{",
    "font-family:Outfit,system-ui,-apple-system,sans-serif!important;",
    "background:var(--bg)!important;color:var(--text)!important;",
    "-webkit-font-smoothing:antialiased;letter-spacing:.01em",
    "}",
    ".animated-bg{background:",
    "radial-gradient(ellipse 80% 55% at 15% 0%,rgba(255,51,85,.14),transparent 55%),",
    "radial-gradient(ellipse 55% 45% at 90% 20%,rgba(120,20,40,.18),transparent 50%),",
    "linear-gradient(180deg,#0a0406 0%,#100608 50%,#0c0507 100%)!important}",
    ".animated-bg::before{opacity:.35!important}",
    ".particle{background:var(--red)!important;opacity:.45!important;box-shadow:none!important}",
    ".sidebar{width:280px!important;background:rgba(18,8,10,.92)!important;",
    "backdrop-filter:blur(28px) saturate(1.1)!important;-webkit-backdrop-filter:blur(28px) saturate(1.1)!important;",
    "border-right:1px solid var(--border)!important;box-shadow:8px 0 40px rgba(0,0,0,.25)!important;",
    "transform:translateX(-100%)!important;opacity:0!important;filter:none!important;",
    "transition:transform .55s var(--cotton),opacity .4s var(--cotton)!important;border-radius:0!important;padding:0!important}",
    ".sidebar.open,.sidebar:not(.closed){transform:translateX(0)!important;opacity:1!important;box-shadow:12px 0 48px rgba(0,0,0,.3)!important}",
    ".sidebar.closed{transform:translateX(-100%)!important;opacity:0!important}",
    ".sidebar-header{padding:22px 20px!important;margin:0!important;background:transparent!important;",
    "border:none!important;border-bottom:1px solid var(--border)!important;border-radius:0!important;box-shadow:none!important}",
    ".logo{background:linear-gradient(135deg,#ff6b81,var(--red))!important;-webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important}",
    ".logo i{-webkit-text-fill-color:var(--red)!important;filter:drop-shadow(0 0 10px var(--red-glow))!important;animation:none!important}",
    ".nav-section{margin:8px 0!important;padding:0 10px!important}",
    ".nav-title{font-size:10px!important;letter-spacing:1.5px!important;color:var(--muted)!important;opacity:.75;padding:12px 12px 6px!important;border:none!important}",
    ".nav-item{margin:2px 0!important;padding:12px 14px!important;border-radius:14px!important;border:none!important;background:transparent!important;",
    "transition:background .35s var(--soft),transform .35s var(--soft),color .25s!important}",
    ".nav-item:hover{background:var(--red-soft)!important;transform:translateX(4px)!important;color:#fff!important}",
    ".nav-item.active{background:var(--red-soft)!important;color:#fff!important;box-shadow:none!important;border:none!important}",
    ".nav-item i{color:var(--muted)!important;transition:color .25s}",
    ".nav-item:hover i,.nav-item.active i{color:var(--red)!important;transform:none!important;filter:none!important}",
    ".sidebar button#logoutBtn,.sidebar .full-width.secondary{margin:12px 16px!important;width:calc(100% - 32px)!important;border-radius:14px!important}",
    ".sidebar-toggle{position:fixed!important;top:18px!important;left:18px!important;bottom:auto!important;z-index:300;",
    "width:46px;height:46px;border-radius:14px;background:rgba(28,12,16,.85)!important;backdrop-filter:blur(16px)!important;",
    "border:1px solid var(--border)!important;color:var(--red)!important;cursor:pointer;display:flex;align-items:center;justify-content:center;",
    "font-size:17px;box-shadow:0 4px 20px rgba(0,0,0,.2)!important;",
    "transition:transform .35s var(--soft),background .3s,left .55s var(--cotton)!important}",
    ".sidebar-toggle:hover{transform:scale(1.06);background:var(--red-soft)!important}",
    ".sidebar-toggle.open{left:246px}",
    "body.sidebar-open .main-content{margin-left:280px!important;transition:margin-left .55s var(--cotton)}",
    ".main-content{padding:20px 24px 56px!important;transition:margin-left .55s var(--cotton);max-width:1200px}",
    ".top-bar{padding:14px 18px!important;margin-bottom:20px!important;background:var(--surface)!important;",
    "backdrop-filter:blur(20px)!important;border:1px solid var(--border)!important;border-radius:18px!important;",
    "box-shadow:0 4px 24px rgba(0,0,0,.15)!important}",
    ".avatar{box-shadow:0 0 0 2px rgba(255,51,85,.25)!important}",
    ".section{padding-top:4px}",
    ".section.active{animation:fadeSoft .45s var(--cotton) both}",
    "@keyframes fadeSoft{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
    ".page-hero{",
    "display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;",
    "padding:22px 24px;margin-bottom:20px;",
    "background:linear-gradient(135deg,rgba(255,51,85,.1),rgba(28,12,16,.5));",
    "border:1px solid var(--border);border-radius:20px;",
    "box-shadow:0 4px 24px rgba(0,0,0,.12)",
    "}",
    ".page-hero-left{display:flex;align-items:center;gap:16px;min-width:0}",
    ".page-hero-icon{",
    "width:52px;height:52px;border-radius:16px;flex-shrink:0;",
    "background:var(--red-soft);display:flex;align-items:center;justify-content:center;",
    "font-size:22px;color:var(--red)",
    "}",
    ".page-hero h2{font-size:22px;font-weight:700;margin:0 0 4px;color:#fff}",
    ".page-hero p{font-size:13px;color:var(--muted);margin:0;line-height:1.45}",
    ".card{",
    "background:var(--card)!important;backdrop-filter:blur(16px)!important;",
    "border:1px solid var(--border)!important;border-radius:20px!important;",
    "padding:22px!important;margin-bottom:16px!important;",
    "box-shadow:0 4px 24px rgba(0,0,0,.12)!important;",
    "transition:transform .4s var(--soft),box-shadow .4s var(--soft),border-color .3s!important",
    "}",
    ".card:hover{transform:translateY(-2px)!important;box-shadow:0 10px 32px rgba(0,0,0,.18)!important;border-color:rgba(255,51,85,.22)!important}",
    ".card-title{",
    "display:flex;align-items:center;gap:10px;",
    "font-size:16px!important;font-weight:700!important;",
    "margin:0 0 16px!important;padding-bottom:12px!important;",
    "border-bottom:1px solid var(--border)!important;color:#fff!important",
    "}",
    ".card-title i{color:var(--red)!important;font-size:16px}",
    ".grid-2,.grid-3,.grid-4{gap:14px!important}",
    ".stat-card{border-radius:18px!important;padding:18px!important;border:1px solid var(--border)!important;background:var(--card)!important}",
    ".stat-value{font-size:32px!important;background:linear-gradient(135deg,#ff8a9a,var(--red))!important;",
    "-webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important}",
    ".stat-label{color:var(--muted)!important;font-size:12px!important}",
    ".feature-card,.item-card,.mod-card,.plugin-card,.resource-card,.shader-card,",
    "[class*=\"-card\"]:not(.stat-card):not(.stage-card):not(.card){",
    "border-radius:18px!important;border:1px solid var(--border)!important;",
    "background:rgba(40,14,18,.55)!important;transition:transform .35s var(--soft),box-shadow .35s,border-color .3s!important",
    "}",
    ".feature-card:hover,.item-card:hover,.mod-card:hover{",
    "transform:translateY(-4px)!important;border-color:rgba(255,51,85,.3)!important;box-shadow:0 12px 28px rgba(0,0,0,.2)!important",
    "}",
    ".feature-icon{",
    "background:var(--red-soft)!important;color:var(--red)!important;",
    "box-shadow:none!important;border-radius:16px!important",
    "}",
    "label{color:var(--muted)!important;font-size:12px!important;font-weight:600!important;letter-spacing:.02em;margin-bottom:6px!important;display:block}",
    "input,select,textarea{",
    "border-radius:12px!important;border:1px solid var(--border)!important;",
    "background:rgba(0,0,0,.25)!important;color:var(--text)!important;",
    "padding:12px 14px!important;transition:border-color .25s,box-shadow .25s!important",
    "}",
    "input:focus,select:focus,textarea:focus{",
    "border-color:rgba(255,51,85,.45)!important;box-shadow:0 0 0 3px var(--red-soft)!important;outline:none!important",
    "}",
    "input::placeholder,textarea::placeholder{color:rgba(201,168,174,.5)!important}",
    "button{background:linear-gradient(135deg,#ff4d6a,var(--red))!important;border-radius:14px!important;border:none!important;",
    "box-shadow:0 4px 16px var(--red-glow)!important;transition:transform .3s var(--soft),box-shadow .3s var(--soft)!important}",
    "button:hover{transform:translateY(-2px)!important;box-shadow:0 8px 24px var(--red-glow)!important}",
    "button.secondary{background:transparent!important;border:1px solid var(--border)!important;box-shadow:none!important;color:var(--text)!important}",
    "button.secondary:hover{border-color:rgba(255,51,85,.4)!important;background:var(--red-soft)!important}",
    ".viewer3d-wrap,#skin3dWrap,#cape3dWrap,#cosmetics3dWrap{",
    "border-radius:20px!important;border:1px solid var(--border)!important;",
    "background:rgba(0,0,0,.35)!important;overflow:hidden;",
    "box-shadow:inset 0 0 40px rgba(255,51,85,.04)!important",
    "}",
    "table{width:100%;border-collapse:separate;border-spacing:0 8px}",
    "th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600;padding:8px 12px;text-align:left}",
    "td{padding:14px 12px;background:rgba(0,0,0,.2);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}",
    "tr td:first-child{border-left:1px solid var(--border);border-radius:12px 0 0 12px}",
    "tr td:last-child{border-right:1px solid var(--border);border-radius:0 12px 12px 0}",
    ".badge,.tag,.chip{",
    "display:inline-flex;align-items:center;gap:4px;",
    "padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;",
    "background:var(--red-soft);color:var(--red);border:1px solid rgba(255,51,85,.2)",
    "}",
    ".msg{border-radius:12px!important;padding:12px 14px!important}",
    ".msg.ok{background:rgba(40,180,100,.12)!important;border:1px solid rgba(40,180,100,.25)!important}",
    ".msg.error{background:rgba(255,51,85,.1)!important;border:1px solid rgba(255,51,85,.25)!important}",
    ".empty-state,.placeholder-box{",
    "text-align:center;padding:40px 20px;color:var(--muted);",
    "border:1px dashed var(--border);border-radius:18px;background:rgba(0,0,0,.15)",
    "}",
    ".coin-display{border-color:rgba(255,200,87,.35)!important;background:rgba(255,200,87,.08)!important;border-radius:14px!important}",
    ".modal{border-radius:22px!important;border:1px solid var(--border)!important;",
    "background:rgba(24,10,12,.95)!important;backdrop-filter:blur(24px)!important;",
    "box-shadow:0 24px 64px rgba(0,0,0,.5)!important}",
    ".modal-header{border-bottom:1px solid var(--border)!important;padding-bottom:12px!important;margin-bottom:16px!important}",
    "#download .card,#skins .card,#capes .card,#profile .card{padding:24px!important}",
    ".stage-wrap{margin:6px 0 24px;position:relative;width:100%}",
    ".stage-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;flex-wrap:wrap}",
    ".stage-head h3{font-size:18px;font-weight:700;margin:0;display:flex;align-items:center;gap:10px}",
    ".stage-head h3 i{color:var(--red)}",
    ".stage-nav{display:flex;align-items:center;gap:10px}",
    ".stage-btn{width:44px;height:44px;border-radius:14px;border:1px solid var(--border);background:var(--red-soft);",
    "color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;",
    "transition:transform .3s var(--soft),background .25s;box-shadow:none}",
    ".stage-btn:hover{transform:scale(1.06);background:rgba(255,51,85,.2)}",
    ".stage-btn:disabled{opacity:.28;pointer-events:none}",
    ".stage-counter{font-size:13px;color:var(--muted);font-weight:600;min-width:56px;text-align:center}",
    ".stage-viewport{position:relative;width:100%;height:380px;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:pan-y}",
    ".stage-card{position:absolute;left:50%;top:50%;width:min(480px,90%);margin:0;padding:36px 28px;border-radius:24px;",
    "background:rgba(40,14,18,.88);border:1px solid var(--border);box-shadow:0 16px 48px rgba(0,0,0,.28);",
    "backdrop-filter:blur(12px);text-align:center;cursor:grab;user-select:none;-webkit-user-select:none;",
    "transform:translate(-50%,-50%) scale(.88);opacity:0;pointer-events:none;",
    "transition:transform .55s var(--cotton),opacity .45s var(--cotton);will-change:transform,opacity}",
    ".stage-card.is-active{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1);z-index:3}",
    ".stage-card.is-prev{opacity:.4;transform:translate(calc(-50% - 70%),-50%) scale(.86);z-index:1}",
    ".stage-card.is-next{opacity:.4;transform:translate(calc(-50% + 70%),-50%) scale(.86);z-index:1}",
    ".stage-card.is-far{opacity:0;transform:translate(-50%,-50%) scale(.8);z-index:0}",
    ".stage-card:active{cursor:grabbing}",
    ".stage-card .sc-icon{width:72px;height:72px;margin:0 auto 18px;border-radius:20px;background:var(--red-soft);",
    "display:flex;align-items:center;justify-content:center;font-size:30px;color:var(--red)}",
    ".stage-card h4{font-size:22px;font-weight:700;margin:0 0 10px;color:#fff}",
    ".stage-card p{font-size:14px;line-height:1.6;color:var(--muted);margin:0 0 22px;min-height:60px}",
    ".stage-card .sc-open{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:14px;border:none;cursor:pointer;",
    "font-weight:600;font-size:14px;color:#fff;background:linear-gradient(135deg,#ff4d6a,var(--red));",
    "box-shadow:0 4px 16px var(--red-glow);transition:transform .3s var(--soft)}",
    ".stage-card .sc-open:hover{transform:translateY(-2px)}",
    ".stage-dots{display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap}",
    ".stage-dot{width:8px;height:8px;border-radius:50%;border:none;padding:0;cursor:pointer;background:rgba(255,51,85,.22);",
    "transition:width .3s var(--soft),background .25s,border-radius .3s}",
    ".stage-dot.active{width:22px;border-radius:6px;background:var(--red)}",
    ".stage-hint{text-align:center;font-size:12px;color:var(--muted);margin-top:8px;opacity:.65}",
    "@media(max-width:900px){.stage-viewport{height:340px}.stage-card{padding:28px 22px}.stage-card h4{font-size:20px}.main-content{max-width:100%}}",
    "@media(max-width:700px){",
    "body.sidebar-open .main-content{margin-left:0!important}",
    ".sidebar-toggle.open{left:18px}",
    ".sidebar{width:min(300px,88vw)!important}",
    ".main-content{padding:14px 12px 40px!important}",
    ".page-hero{padding:16px;border-radius:16px}",
    ".page-hero h2{font-size:18px}",
    ".page-hero-icon{width:44px;height:44px;font-size:18px}",
    ".stage-viewport{height:320px}",
    ".stage-card{width:92%;padding:24px 18px;border-radius:20px}",
    ".stage-card .sc-icon{width:60px;height:60px;font-size:26px}",
    ".stage-card h4{font-size:18px}",
    ".stage-card p{font-size:13px;min-height:48px}",
    ".top-bar{padding:12px 14px!important}",
    ".stat-value{font-size:26px!important}",
    ".card{padding:16px!important}",
    "}",
    "@media(max-width:400px){.stage-viewport{height:300px}.stage-btn{width:40px;height:40px}}"
  ].join("");

  var style = document.createElement("style");
  style.id = "indus-theme";
  style.textContent = css;
  document.head.appendChild(style);

  var font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap";
  document.head.appendChild(font);

  var oldCrack = document.querySelector(".crack-layer");
  if (oldCrack) oldCrack.remove();

  var SECTION_META = {
    dashboard: { icon: "fa-home", title: "Dashboard", desc: "Overview, stats and quick feature stage" },
    skins: { icon: "fa-tshirt", title: "3D Skins", desc: "Preview and upload your Minecraft skin" },
    profile: { icon: "fa-user", title: "Profile", desc: "Display name, bio, logo and identity" },
    mods: { icon: "fa-cube", title: "Mods", desc: "Browse and unlock curated mods" },
    plugins: { icon: "fa-plug", title: "Plugins", desc: "Server plugins for your network" },
    resources: { icon: "fa-box", title: "Resource Packs", desc: "HD textures and style packs" },
    shaders: { icon: "fa-sun", title: "Shaders", desc: "Cinematic lighting packs" },
    download: { icon: "fa-download", title: "FearLauncher", desc: "Official client downloads" },
    capes: { icon: "fa-flag", title: "Capes", desc: "Cape textures with 3D preview" },
    "daily-rewards": { icon: "fa-gift", title: "Daily Rewards", desc: "Login streak and coin claims" },
    "cosmetics-shop": { icon: "fa-crown", title: "Cosmetics", desc: "Hats, crowns and more" },
    admin: { icon: "fa-shield-halved", title: "Admin", desc: "Manage content and users" }
  };

  function ensurePageHero(sectionEl, sectionId) {
    if (!sectionEl || sectionEl.querySelector(".page-hero")) return;
    var meta = SECTION_META[sectionId];
    if (!meta) return;
    if (sectionId === "dashboard") return;

    var hero = document.createElement("div");
    hero.className = "page-hero";
    hero.innerHTML =
      '<div class="page-hero-left">' +
      '<div class="page-hero-icon"><i class="fas ' + meta.icon + '"></i></div>' +
      "<div><h2>" + meta.title + "</h2><p>" + meta.desc + "</p></div>" +
      "</div>";
    sectionEl.insertBefore(hero, sectionEl.firstChild);
  }

  function polishActiveSection() {
    document.querySelectorAll(".section.active").forEach(function (sec) {
      var id = sec.id || "";
      ensurePageHero(sec, id);
    });
  }

  function bootSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    var btn = document.getElementById("sidebarToggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "sidebarToggle";
      btn.className = "sidebar-toggle";
      btn.type = "button";
      btn.innerHTML = '<i class="fas fa-bars"></i>';
      btn.setAttribute("aria-label", "Menu");
      document.body.appendChild(btn);
    }
    var open = false;
    function setOpen(v) {
      open = !!v;
      if (open) {
        sidebar.classList.remove("closed");
        sidebar.classList.add("open");
        document.body.classList.add("sidebar-open");
        btn.classList.add("open");
        btn.innerHTML = '<i class="fas fa-times"></i>';
      } else {
        sidebar.classList.add("closed");
        sidebar.classList.remove("open");
        document.body.classList.remove("sidebar-open");
        btn.classList.remove("open");
        btn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    }
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!open);
    };
    window.__openSidebar = function () { setOpen(true); };
    window.__closeSidebar = function () { setOpen(false); };
    setOpen(false);
    sidebar.classList.add("closed");
    new MutationObserver(function () {
      if (sidebar.style.display === "block") setOpen(true);
      if (sidebar.style.display === "none") setOpen(false);
    }).observe(sidebar, { attributes: true, attributeFilter: ["style"] });
  }

  var FEATURES = [
    { icon: "fa-tshirt", title: "3D Skins", desc: "Live Steve / Alex preview. Upload PNG skins and rotate in 3D.", section: "skins" },
    { icon: "fa-user", title: "Profile", desc: "Display name, bio, logo — make your identity unique.", section: "profile" },
    { icon: "fa-cube", title: "Mods", desc: "Browse and download curated Minecraft mods.", section: "mods" },
    { icon: "fa-plug", title: "Plugins", desc: "Server plugins ready for your network.", section: "plugins" },
    { icon: "fa-box", title: "Resource Packs", desc: "HD textures and style packs for a fresh look.", section: "resources" },
    { icon: "fa-sun", title: "Shaders", desc: "Graphics shaders for cinematic lighting.", section: "shaders" },
    { icon: "fa-download", title: "FearLauncher", desc: "Official client — secure builds for PC and Android.", section: "download" },
    { icon: "fa-flag", title: "Capes", desc: "Cape textures with live 3D back preview.", section: "capes" },
    { icon: "fa-gift", title: "Daily Rewards", desc: "Login streak — claim coins every day.", section: "daily-rewards" },
    { icon: "fa-crown", title: "Cosmetics", desc: "Shop hats, crowns and more with 3D preview.", section: "cosmetics-shop" }
  ];

  function openSection(section) {
    if (typeof window.showSection === "function") window.showSection(section);
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.getAttribute("data-section") === section);
    });
  }

  function buildStage() {
    var dash = document.getElementById("dashboard");
    if (!dash) return;
    if (document.getElementById("featureStage")) return;

    dash.querySelectorAll(".card").forEach(function (card) {
      var t = card.querySelector(".card-title");
      if (t && /Quick Access/i.test(t.textContent || "")) card.style.display = "none";
    });

    var wrap = document.createElement("div");
    wrap.id = "featureStage";
    wrap.className = "stage-wrap";
    wrap.innerHTML =
      '<div class="stage-head">' +
      '<h3><i class="fas fa-sparkles"></i> Features</h3>' +
      '<div class="stage-nav">' +
      '<button type="button" class="stage-btn" id="stagePrev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>' +
      '<span class="stage-counter" id="stageCounter">1 / ' + FEATURES.length + "</span>" +
      '<button type="button" class="stage-btn" id="stageNext" aria-label="Next"><i class="fas fa-chevron-right"></i></button>' +
      "</div></div>" +
      '<div class="stage-viewport" id="stageViewport"></div>' +
      '<div class="stage-dots" id="stageDots"></div>' +
      '<p class="stage-hint">Swipe or use arrows</p>';

    var viewport = wrap.querySelector("#stageViewport");
    var dotsEl = wrap.querySelector("#stageDots");

    FEATURES.forEach(function (f, i) {
      var card = document.createElement("div");
      card.className = "stage-card";
      card.setAttribute("data-i", String(i));
      card.innerHTML =
        '<div class="sc-icon"><i class="fas ' + f.icon + '"></i></div>' +
        "<h4>" + f.title + "</h4>" +
        "<p>" + f.desc + "</p>" +
        '<button type="button" class="sc-open"><i class="fas fa-arrow-right"></i> Open</button>';
      card.querySelector(".sc-open").addEventListener("click", function (e) {
        e.stopPropagation();
        openSection(f.section);
      });
      viewport.appendChild(card);

      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "stage-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("data-i", String(i));
      dotsEl.appendChild(dot);
    });

    var stats = dash.querySelector(".grid-4");
    if (stats && stats.parentNode) stats.parentNode.insertBefore(wrap, stats.nextSibling);
    else {
      var firstCard = dash.querySelector(".card");
      if (firstCard) dash.insertBefore(wrap, firstCard);
      else dash.appendChild(wrap);
    }

    var idx = 0;
    var cards = Array.prototype.slice.call(viewport.querySelectorAll(".stage-card"));
    var dots = Array.prototype.slice.call(dotsEl.querySelectorAll(".stage-dot"));

    function paint() {
      cards.forEach(function (card, i) {
        card.className = "stage-card";
        if (i === idx) card.classList.add("is-active");
        else if (i === idx - 1) card.classList.add("is-prev");
        else if (i === idx + 1) card.classList.add("is-next");
        else card.classList.add("is-far");
      });
      dots.forEach(function (d, di) {
        d.classList.toggle("active", di === idx);
      });
      var counter = document.getElementById("stageCounter");
      if (counter) counter.textContent = (idx + 1) + " / " + FEATURES.length;
      var prev = document.getElementById("stagePrev");
      var next = document.getElementById("stageNext");
      if (prev) prev.disabled = idx <= 0;
      if (next) next.disabled = idx >= FEATURES.length - 1;
    }

    function go(i) {
      idx = Math.max(0, Math.min(FEATURES.length - 1, i));
      paint();
    }

    var prevBtn = document.getElementById("stagePrev");
    var nextBtn = document.getElementById("stageNext");
    if (prevBtn) prevBtn.onclick = function () { go(idx - 1); };
    if (nextBtn) nextBtn.onclick = function () { go(idx + 1); };
    dots.forEach(function (d) {
      d.onclick = function () { go(parseInt(d.getAttribute("data-i"), 10) || 0); };
    });

    var startX = 0;
    var dragging = false;
    viewport.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".sc-open")) return;
      dragging = true;
      startX = e.clientX;
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    });
    viewport.addEventListener("pointerup", function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.clientX - startX;
      if (dx < -40) go(idx + 1);
      else if (dx > 40) go(idx - 1);
    });
    viewport.addEventListener("pointercancel", function () { dragging = false; });

    var touchX = 0;
    viewport.addEventListener("touchstart", function (e) {
      if (e.touches[0]) touchX = e.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener("touchend", function (e) {
      if (!e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (dx < -40) go(idx + 1);
      else if (dx > 40) go(idx - 1);
    }, { passive: true });

    document.addEventListener("keydown", function (e) {
      var d = document.getElementById("dashboard");
      if (!d || !d.classList.contains("active")) return;
      if (e.key === "ArrowLeft") go(idx - 1);
      if (e.key === "ArrowRight") go(idx + 1);
    });

    paint();
  }

  function tryStage() {
    var dash = document.getElementById("dashboard");
    if (dash && (dash.classList.contains("active") || dash.style.display === "block")) buildStage();
  }

  function boot() {
    bootSidebar();
    var orig = window.showSection;
    if (typeof orig === "function") {
      window.showSection = function (id) {
        orig(id);
        setTimeout(function () {
          tryStage();
          polishActiveSection();
        }, 80);
      };
    }
    setTimeout(tryStage, 200);
    setTimeout(tryStage, 600);
    setTimeout(polishActiveSection, 300);
    setTimeout(polishActiveSection, 800);
    document.querySelectorAll(".section").forEach(function (sec) {
      new MutationObserver(function () {
        if (sec.classList.contains("active")) {
          setTimeout(function () {
            tryStage();
            polishActiveSection();
          }, 40);
        }
      }).observe(sec, { attributes: true, attributeFilter: ["class", "style"] });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
