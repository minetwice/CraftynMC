/* CraftynMC — Dark Red + Japanese Wood Tray Sidebar + One-Card Feather Stage */
(function () {
  if (document.getElementById("indus-theme")) return;

  var css = [
    ":root{",
    "--bg:#080204;--surface:#14080c;--card:rgba(32,10,14,.88);",
    "--border:rgba(255,40,60,.22);--red:#ff1a3c;--red2:#ff5a70;--dark-red:#7a0014;",
    "--wood:#2a1810;--wood2:#3d2418;--wood-edge:#5c3828;--wood-grain:rgba(255,180,120,.06);",
    "--gold:#ffc857;--text:#fff8f6;--muted:#c4a0a8;",
    "--glow:0 0 36px rgba(255,26,60,.4);",
    "--feather:cubic-bezier(0.22,1,0.36,1);--snap:cubic-bezier(0.34,1.35,0.64,1)",
    "}",
    "body{font-family:Outfit,system-ui,sans-serif!important;background:var(--bg)!important;color:var(--text)!important}",
    ".animated-bg{background:",
    "radial-gradient(ellipse 75% 50% at 20% -5%,rgba(255,26,60,.2),transparent 55%),",
    "radial-gradient(ellipse 50% 40% at 95% 15%,rgba(122,0,20,.3),transparent 50%),",
    "linear-gradient(165deg,#080204 0%,#12060a 45%,#0a0306 100%)!important}",
    ".animated-bg::before{content:'';position:absolute;inset:0;",
    "background-image:linear-gradient(rgba(255,26,60,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,26,60,.035) 1px,transparent 1px);",
    "background-size:52px 52px;opacity:.55;animation:gridPulse 10s ease-in-out infinite;",
    "mask-image:radial-gradient(ellipse at 50% 40%,black 15%,transparent 72%)}",
    "@keyframes gridPulse{0%,100%{opacity:.35}50%{opacity:.65}}",
    ".crack-layer{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}",
    ".crack{position:absolute;height:2px;background:linear-gradient(90deg,transparent,var(--red),transparent);",
    "opacity:0;box-shadow:0 0 14px var(--red);animation:crackFlash 4.5s ease-in-out infinite}",
    "@keyframes crackFlash{0%,100%{opacity:0;transform:scaleX(0)}12%{opacity:.85;transform:scaleX(1)}45%{opacity:.25}70%{opacity:.55}90%{opacity:0}}",
    ".particle{background:var(--red)!important;box-shadow:0 0 10px var(--red)!important}",
    ".sidebar{",
    "width:300px!important;",
    "background:",
    "repeating-linear-gradient(90deg,transparent,transparent 11px,var(--wood-grain) 11px,var(--wood-grain) 12px),",
    "linear-gradient(180deg,var(--wood2) 0%,var(--wood) 40%,#1a0e08 100%)!important;",
    "backdrop-filter:none!important;",
    "border-right:3px solid var(--wood-edge)!important;",
    "box-shadow:inset -8px 0 24px rgba(0,0,0,.35),8px 0 40px rgba(0,0,0,.45)!important;",
    "transform:translateX(-110%)!important;opacity:0!important;filter:none!important;",
    "transition:transform .7s var(--feather),opacity .45s!important;",
    "border-radius:0 18px 18px 0!important;",
    "padding:12px 0!important",
    "}",
    ".sidebar.open,.sidebar:not(.closed){",
    "transform:translateX(0)!important;opacity:1!important;",
    "box-shadow:inset -8px 0 24px rgba(0,0,0,.3),12px 0 48px rgba(255,26,60,.12),4px 0 0 var(--red)!important",
    "}",
    ".sidebar.closed{transform:translateX(-110%)!important;opacity:0!important}",
    ".sidebar-header{",
    "margin:12px 14px 18px!important;padding:18px 16px!important;",
    "background:linear-gradient(145deg,rgba(255,26,60,.12),rgba(0,0,0,.25))!important;",
    "border:1px solid rgba(92,56,40,.8)!important;border-radius:14px!important;",
    "box-shadow:inset 0 1px 0 rgba(255,200,150,.08),0 4px 16px rgba(0,0,0,.3)!important",
    "}",
    ".sidebar-header::after{display:none!important}",
    ".logo{background:linear-gradient(135deg,var(--red),var(--gold))!important;",
    "-webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important;font-size:20px!important}",
    ".logo i{-webkit-text-fill-color:var(--red)!important;filter:drop-shadow(0 0 12px var(--red))!important;",
    "animation:logoPulse 2.8s ease-in-out infinite}",
    "@keyframes logoPulse{0%,100%{filter:drop-shadow(0 0 6px var(--red))}50%{filter:drop-shadow(0 0 18px var(--red2))}}",
    ".nav-section{margin:10px 10px 6px!important;padding:0!important}",
    ".nav-title{",
    "font-size:10px!important;letter-spacing:2px!important;color:rgba(255,180,140,.55)!important;",
    "padding:8px 14px 6px!important;border-bottom:1px solid rgba(92,56,40,.5)!important;margin-bottom:6px!important",
    "}",
    ".nav-item{",
    "margin:3px 6px!important;padding:12px 14px!important;border-radius:12px!important;",
    "border:1px solid transparent!important;",
    "background:rgba(0,0,0,.15)!important;",
    "transition:all .35s var(--feather)!important",
    "}",
    ".nav-item:hover,.nav-item.active{",
    "color:#fff!important;transform:translateX(4px)!important;",
    "background:linear-gradient(90deg,rgba(255,26,60,.18),rgba(0,0,0,.2))!important;",
    "border-color:rgba(255,26,60,.35)!important;",
    "box-shadow:inset 3px 0 0 var(--red),0 4px 16px rgba(0,0,0,.25)!important",
    "}",
    ".nav-item i{width:22px;color:rgba(255,180,140,.7)!important}",
    ".nav-item:hover i,.nav-item.active i{color:var(--red)!important;transform:scale(1.15)!important;",
    "filter:drop-shadow(0 0 6px var(--red))!important}",
    ".sidebar .full-width.secondary,.sidebar button#logoutBtn{",
    "margin:8px 16px!important;width:calc(100% - 32px)!important;",
    "border-radius:12px!important;border:1px solid var(--wood-edge)!important;",
    "background:rgba(0,0,0,.25)!important",
    "}",
    ".sidebar-toggle{",
    "position:fixed!important;top:auto!important;bottom:28px!important;left:20px!important;z-index:300;",
    "width:58px;height:58px;border-radius:16px;",
    "background:linear-gradient(145deg,var(--wood2),var(--wood))!important;",
    "border:2px solid var(--wood-edge)!important;color:var(--red)!important;cursor:pointer;",
    "display:flex;align-items:center;justify-content:center;font-size:20px;",
    "box-shadow:0 6px 24px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,200,150,.1),0 0 20px rgba(255,26,60,.15)!important;",
    "transition:all .4s var(--snap)!important",
    "}",
    ".sidebar-toggle:hover{transform:scale(1.08) rotate(-8deg);box-shadow:0 8px 32px rgba(255,26,60,.35)!important}",
    ".sidebar-toggle.open{left:268px}",
    "body.sidebar-open .main-content{margin-left:300px!important;transition:margin-left .7s var(--feather)}",
    ".main-content{padding:20px 28px 40px!important;max-width:100%!important}",
    ".top-bar{",
    "padding:14px 20px!important;margin-bottom:20px!important;",
    "background:var(--card)!important;border:1px solid var(--border)!important;border-radius:18px!important;",
    "box-shadow:0 8px 28px rgba(0,0,0,.35)!important",
    "}",
    ".avatar{box-shadow:0 0 18px rgba(255,26,60,.35)!important}",
    ".card{",
    "background:var(--card)!important;border:1px solid var(--border)!important;border-radius:18px!important;",
    "padding:22px!important;margin-bottom:18px!important;",
    "transition:all .45s var(--feather)!important",
    "}",
    ".card:hover{border-color:rgba(255,26,60,.45)!important;box-shadow:0 12px 36px rgba(255,26,60,.12)!important;transform:translateY(-3px)!important}",
    ".section.active{animation:sectionIn .5s var(--feather) both}",
    "@keyframes sectionIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
    "button{background:linear-gradient(135deg,var(--red),var(--dark-red))!important;border-radius:12px!important;",
    "box-shadow:0 4px 18px rgba(255,26,60,.28)!important;transition:all .35s var(--feather)!important}",
    "button:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(255,26,60,.4)!important}",
    "button.secondary{background:transparent!important;border:1px solid var(--border)!important;box-shadow:none!important}",
    ".stat-card{padding:20px!important;border-radius:16px!important}",
    ".stat-value{font-size:34px!important;background:linear-gradient(135deg,var(--red),var(--gold))!important;",
    "-webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important}",
    ".card-title i,.feature-icon{color:var(--red)!important}",
    ".feature-icon{background:rgba(255,26,60,.12)!important;box-shadow:0 0 20px rgba(255,26,60,.12)!important}",
    "input:focus,select:focus,textarea:focus{border-color:var(--red)!important;box-shadow:0 0 0 3px rgba(255,26,60,.15)!important}",
    ".coin-display{border-color:rgba(255,200,87,.4)!important}",
    ".stage-wrap{margin:8px 0 28px;position:relative}",
    ".stage-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:12px;flex-wrap:wrap}",
    ".stage-head h3{font-size:20px;font-weight:800;display:flex;align-items:center;gap:12px;margin:0}",
    ".stage-head h3 i{color:var(--red);font-size:22px;filter:drop-shadow(0 0 10px var(--red))}",
    ".stage-nav{display:flex;align-items:center;gap:12px}",
    ".stage-btn{",
    "width:52px;height:52px;border-radius:16px;border:1px solid var(--border);",
    "background:rgba(255,26,60,.1);color:var(--red);cursor:pointer;",
    "display:flex;align-items:center;justify-content:center;font-size:18px;",
    "transition:all .35s var(--feather);box-shadow:0 4px 16px rgba(0,0,0,.25)",
    "}",
    ".stage-btn:hover{background:rgba(255,26,60,.22);transform:scale(1.1);box-shadow:var(--glow)}",
    ".stage-btn:disabled{opacity:.3;pointer-events:none;transform:none;box-shadow:none}",
    ".stage-counter{font-size:13px;color:var(--muted);font-weight:600;min-width:64px;text-align:center}",
    ".stage-viewport{",
    "position:relative;height:min(420px,70vh);perspective:1200px;",
    "display:flex;align-items:center;justify-content:center;overflow:visible",
    "}",
    ".stage-card{",
    "position:absolute;width:min(520px,92%):",
    "background:linear-gradient(165deg,rgba(255,26,60,.14) 0%,rgba(20,8,12,.95) 45%,rgba(12,4,6,.98) 100%);",
    "border:1px solid rgba(255,26,60,.35);border-radius:28px;padding:40px 36px;",
    "box-shadow:0 24px 64px rgba(0,0,0,.5),0 0 0 1px rgba(255,26,60,.1),0 0 60px rgba(255,26,60,.08);",
    "transform-style:preserve-3d;cursor:grab;user-select:none;",
    "transition:transform .9s var(--feather),opacity .7s var(--feather),filter .7s var(--feather);",
    "opacity:0;pointer-events:none;filter:blur(6px) brightness(.7)",
    "}",
    ".stage-card.is-active{",
    "opacity:1;pointer-events:auto;filter:none;cursor:grab;",
    "transform:translateX(0) rotateY(0deg) scale(1);z-index:5",
    "}",
    ".stage-card.is-prev{",
    "opacity:.35;filter:blur(4px) brightness(.55);",
    "transform:translateX(-55%) rotateY(28deg) scale(.82);z-index:2",
    "}",
    ".stage-card.is-next{",
    "opacity:.35;filter:blur(4px) brightness(.55);",
    "transform:translateX(55%) rotateY(-28deg) scale(.82);z-index:2",
    "}",
    ".stage-card.is-far{opacity:0;transform:scale(.7);z-index:1}",
    ".stage-card:active{cursor:grabbing}",
    ".stage-card .sc-icon{",
    "width:88px;height:88px;border-radius:24px;margin:0 auto 22px;",
    "background:rgba(255,26,60,.15);border:1px solid rgba(255,26,60,.3);",
    "display:flex;align-items:center;justify-content:center;font-size:36px;color:var(--red);",
    "box-shadow:0 0 40px rgba(255,26,60,.2);transition:transform .5s var(--snap)",
    "}",
    ".stage-card.is-active .sc-icon{animation:iconFloat 3s ease-in-out infinite}",
    "@keyframes iconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}",
    ".stage-card h4{font-size:26px;font-weight:800;text-align:center;margin-bottom:12px;",
    "background:linear-gradient(135deg,#fff,var(--red2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}",
    ".stage-card p{font-size:15px;color:var(--muted);line-height:1.65;text-align:center;margin-bottom:28px;min-height:72px}",
    ".stage-card .sc-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}",
    ".stage-card .sc-open{",
    "padding:14px 28px;border-radius:14px;border:none;cursor:pointer;font-weight:700;font-size:14px;",
    "background:linear-gradient(135deg,var(--red),var(--dark-red));color:#fff;",
    "box-shadow:0 6px 24px rgba(255,26,60,.35);display:inline-flex;align-items:center;gap:10px;",
    "transition:all .35s var(--feather)",
    "}",
    ".stage-card .sc-open:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 10px 32px rgba(255,26,60,.5)}",
    ".stage-dots{display:flex;justify-content:center;gap:10px;margin-top:22px;flex-wrap:wrap}",
    ".stage-dot{width:10px;height:10px;border-radius:50%;border:none;padding:0;cursor:pointer;",
    "background:rgba(255,26,60,.25);transition:all .35s var(--feather)}",
    ".stage-dot.active{width:28px;border-radius:8px;background:var(--red);box-shadow:0 0 14px var(--red)}",
    ".stage-hint{text-align:center;font-size:12px;color:var(--muted);margin-top:10px;opacity:.7}",
    ".stage-hint i{margin-right:6px;color:var(--red)}",
    "#dashboard .card .grid-3.feature-hide,#dashboard .feather-slider-wrap{display:none!important}",
    "#dashboard > .grid-4{margin-bottom:8px!important}",
    ".grid-4{gap:14px!important}",
    ".stat-card{border:1px solid var(--border)!important}",
    "@media(max-width:700px){",
    "body.sidebar-open .main-content{margin-left:0!important}",
    ".sidebar-toggle.open{left:20px}",
    ".stage-viewport{height:min(380px,65vh)}",
    ".stage-card{padding:28px 22px;border-radius:22px}",
    ".stage-card h4{font-size:22px}",
    ".main-content{padding:14px 14px 32px!important}",
    "}",
    ".viewer3d-wrap{border-color:var(--border)!important}",
    ".modal{border:1px solid var(--border)!important;border-radius:22px!important}"
  ].join("");

  /* fix typo width min */
  css = css.replace("width:min(520px,92%):", "width:min(520px,92%);");

  var s = document.createElement("style");
  s.id = "indus-theme";
  s.textContent = css;
  document.head.appendChild(s);

  var fl = document.createElement("link");
  fl.rel = "stylesheet";
  fl.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(fl);

  function spawnCracks() {
    var layer = document.querySelector(".crack-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "crack-layer";
      document.body.appendChild(layer);
    }
    layer.innerHTML = "";
    for (var i = 0; i < 6; i++) {
      var c = document.createElement("div");
      c.className = "crack";
      c.style.top = 12 + Math.random() * 76 + "%";
      c.style.left = Math.random() * 35 + "%";
      c.style.width = 70 + Math.random() * 160 + "px";
      c.style.transform = "rotate(" + (Math.random() * 36 - 18) + "deg)";
      c.style.animationDelay = Math.random() * 4 + "s";
      c.style.animationDuration = 3.2 + Math.random() * 2.5 + "s";
      layer.appendChild(c);
    }
  }

  function bootSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    var btn = document.getElementById("sidebarToggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "sidebarToggle";
      btn.className = "sidebar-toggle";
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
    btn.onclick = function () { setOpen(!open); };
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
    { icon: "fa-tshirt", title: "3D Skins", desc: "Live Steve / Alex preview. Upload your PNG skin, rotate in 3D, and sync to the launcher.", section: "skins" },
    { icon: "fa-user-astronaut", title: "Profile Studio", desc: "Custom display name, bio, description and logo — own your identity on the network.", section: "profile" },
    { icon: "fa-cube", title: "Mods Library", desc: "Curated Minecraft mods. Browse, unlock with coins, and download in one tap.", section: "mods" },
    { icon: "fa-plug", title: "Server Plugins", desc: "Battle-tested plugins for your server stack. Install and manage with ease.", section: "plugins" },
    { icon: "fa-palette", title: "Resource Packs", desc: "HD textures and style packs that transform how your world looks.", section: "resources" },
    { icon: "fa-sun", title: "Shaders", desc: "Cinematic lighting and shadows — turn vanilla into a visual masterpiece.", section: "shaders" },
    { icon: "fa-rocket", title: "FearLauncher", desc: "Official client builds. Secure downloads for Windows, Java and Android.", section: "download" },
    { icon: "fa-flag", title: "Capes", desc: "Cape textures with full 3D back-view preview. Wear your style.", section: "capes" },
    { icon: "fa-gift", title: "Daily Rewards", desc: "Build your login streak. Claim coins every day and hit the Day-7 bonus.", section: "daily-rewards" },
    { icon: "fa-crown", title: "Cosmetics Shop", desc: "Hats, crowns and more. Preview looks in 3D before you buy.", section: "cosmetics-shop" }
  ];

  function buildStage() {
    var dash = document.getElementById("dashboard");
    if (!dash) return;
    if (document.getElementById("featureStage")) return;

    dash.querySelectorAll(".card .grid-3").forEach(function (g) {
      var parent = g.closest(".card");
      if (parent && parent.querySelector(".card-title") && /Quick Access/i.test(parent.textContent)) {
        parent.style.display = "none";
      }
    });

    var wrap = document.createElement("div");
    wrap.className = "stage-wrap";
    wrap.id = "featureStage";
    wrap.innerHTML =
      '<div class="stage-head">' +
      '<h3><i class="fas fa-layer-group"></i> Feature Stage</h3>' +
      '<div class="stage-nav">' +
      '<button type="button" class="stage-btn" id="stagePrev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>' +
      '<span class="stage-counter" id="stageCounter">1 / ' + FEATURES.length + "</span>" +
      '<button type="button" class="stage-btn" id="stageNext" aria-label="Next"><i class="fas fa-chevron-right"></i></button>' +
      "</div></div>" +
      '<div class="stage-viewport" id="stageViewport"></div>' +
      '<div class="stage-dots" id="stageDots"></div>' +
      '<p class="stage-hint"><i class="fas fa-hand-pointer"></i> Drag or use arrows — one card at a time, feather-smooth</p>';

    var viewport = wrap.querySelector("#stageViewport");
    var dots = wrap.querySelector("#stageDots");

    FEATURES.forEach(function (f, i) {
      var card = document.createElement("div");
      card.className = "stage-card";
      card.setAttribute("data-i", String(i));
      card.innerHTML =
        '<div class="sc-icon"><i class="fas ' + f.icon + '"></i></div>' +
        "<h4>" + f.title + "</h4>" +
        "<p>" + f.desc + "</p>" +
        '<div class="sc-actions"><button type="button" class="sc-open"><i class="fas fa-arrow-right"></i> Open ' + f.title + "</button></div>";
      card.querySelector(".sc-open").onclick = function (e) {
        e.stopPropagation();
        openSection(f.section);
      };
      viewport.appendChild(card);

      var d = document.createElement("button");
      d.type = "button";
      d.className = "stage-dot" + (i === 0 ? " active" : "");
      d.setAttribute("data-i", String(i));
      d.setAttribute("aria-label", "Go to " + f.title);
      dots.appendChild(d);
    });

    var stats = dash.querySelector(".grid-4");
    if (stats && stats.parentNode) stats.parentNode.insertBefore(wrap, stats.nextSibling);
    else dash.insertBefore(wrap, dash.firstChild);

    var idx = 0;
    var cards = viewport.querySelectorAll(".stage-card");

    function paint() {
      cards.forEach(function (card, i) {
        card.classList.remove("is-active", "is-prev", "is-next", "is-far");
        if (i === idx) card.classList.add("is-active");
        else if (i === idx - 1) card.classList.add("is-prev");
        else if (i === idx + 1) card.classList.add("is-next");
        else card.classList.add("is-far");
      });
      dots.querySelectorAll(".stage-dot").forEach(function (d, di) {
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

    function openSection(section) {
      if (typeof window.showSection === "function") window.showSection(section);
      document.querySelectorAll(".nav-item").forEach(function (n) {
        n.classList.toggle("active", n.getAttribute("data-section") === section);
      });
    }

    document.getElementById("stagePrev").onclick = function () { go(idx - 1); };
    document.getElementById("stageNext").onclick = function () { go(idx + 1); };
    dots.querySelectorAll(".stage-dot").forEach(function (d) {
      d.onclick = function () { go(parseInt(d.getAttribute("data-i"), 10) || 0); };
    });

    var startX = 0, dragging = false;
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
      if (dx < -50) go(idx + 1);
      else if (dx > 50) go(idx - 1);
    });
    viewport.addEventListener("pointercancel", function () { dragging = false; });

    document.addEventListener("keydown", function (e) {
      var dashEl = document.getElementById("dashboard");
      if (!dashEl || !dashEl.classList.contains("active")) return;
      if (e.key === "ArrowLeft") go(idx - 1);
      if (e.key === "ArrowRight") go(idx + 1);
    });

    paint();
  }

  function onDashboard() {
    var dash = document.getElementById("dashboard");
    if (dash && dash.classList.contains("active")) buildStage();
  }

  function boot() {
    spawnCracks();
    bootSidebar();
    var orig = window.showSection;
    if (typeof orig === "function") {
      window.showSection = function (id) {
        orig(id);
        setTimeout(onDashboard, 60);
      };
    }
    setTimeout(onDashboard, 350);
    var dash = document.getElementById("dashboard");
    if (dash) {
      new MutationObserver(function () {
        if (dash.classList.contains("active")) setTimeout(buildStage, 40);
      }).observe(dash, { attributes: true, attributeFilter: ["class"] });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
