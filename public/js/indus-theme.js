/* CraftynMC — Dark Red Crack + Feather Card Slider */
(function () {
  if (document.getElementById("indus-theme")) return;

  var css = [
    ":root{",
    "--bg:#070004;--surface:#12060a;--card:rgba(28,8,12,.78);",
    "--border:rgba(255,0,60,.18);--red:#ff003c;--red2:#ff4d6d;--dark-red:#8b0018;",
    "--gold:#ffd700;--text:#fff5f7;--muted:#b89098;",
    "--glow:0 0 40px rgba(255,0,60,.35);",
    "--feather:cubic-bezier(0.22,1,0.36,1);--snap:cubic-bezier(0.34,1.4,0.64,1)",
    "}",
    "*{box-sizing:border-box}",
    "body{font-family:Outfit,system-ui,sans-serif!important;background:var(--bg)!important;color:var(--text)!important}",
    ".animated-bg{background:",
    "radial-gradient(ellipse 70% 45% at 15% 0%,rgba(255,0,60,.22),transparent 55%),",
    "radial-gradient(ellipse 50% 40% at 90% 20%,rgba(139,0,24,.25),transparent 50%),",
    "radial-gradient(ellipse 40% 30% at 50% 100%,rgba(255,0,60,.08),transparent),",
    "linear-gradient(180deg,#070004 0%,#12060a 50%,#0a0205 100%)!important}",
    ".animated-bg::before{content:'';position:absolute;inset:0;",
    "background-image:linear-gradient(rgba(255,0,60,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,60,.04) 1px,transparent 1px);",
    "background-size:48px 48px;animation:gridPulse 8s ease-in-out infinite;opacity:.6;",
    "mask-image:radial-gradient(ellipse at center,black 20%,transparent 70%)}",
    "@keyframes gridPulse{0%,100%{opacity:.4}50%{opacity:.75}}",
    ".crack-layer{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}",
    ".crack{position:absolute;height:2px;background:linear-gradient(90deg,transparent,var(--red),transparent);",
    "opacity:0;transform-origin:left center;box-shadow:0 0 12px var(--red);animation:crackFlash 4s ease-in-out infinite}",
    "@keyframes crackFlash{0%,100%{opacity:0;transform:scaleX(0)}15%{opacity:.9;transform:scaleX(1)}40%{opacity:.3}60%{opacity:.7}80%{opacity:0}}",
    ".particle{background:var(--red)!important;box-shadow:0 0 10px var(--red)!important}",
    ".sidebar{background:linear-gradient(180deg,rgba(18,6,10,.97),rgba(8,2,4,.99))!important;",
    "backdrop-filter:blur(28px)!important;border-right:1px solid var(--border)!important;",
    "transform:translateX(-105%) scale(.9) skewX(-3deg)!important;opacity:0!important;filter:blur(10px)!important;",
    "transition:transform .75s var(--snap),opacity .5s,filter .5s!important}",
    ".sidebar.open,.sidebar:not(.closed){transform:none!important;opacity:1!important;filter:none!important;",
    "box-shadow:12px 0 60px rgba(255,0,60,.12)!important}",
    ".sidebar.closed{transform:translateX(-105%) scale(.9) skewX(-3deg)!important;opacity:0!important;filter:blur(10px)!important}",
    ".logo{background:linear-gradient(135deg,var(--red),var(--red2),var(--gold))!important;",
    "-webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important}",
    ".logo i{-webkit-text-fill-color:var(--red)!important;filter:drop-shadow(0 0 14px var(--red))!important;",
    "animation:logoPulse 2.5s ease-in-out infinite}",
    "@keyframes logoPulse{0%,100%{filter:drop-shadow(0 0 8px var(--red))}50%{filter:drop-shadow(0 0 22px var(--red2))}}",
    ".nav-item{border-radius:14px!important;transition:all .4s var(--feather)!important}",
    ".nav-item:hover,.nav-item.active{color:#fff!important;transform:translateX(8px)!important;",
    "background:rgba(255,0,60,.1)!important;border:1px solid rgba(255,0,60,.3)!important;",
    "box-shadow:0 0 24px rgba(255,0,60,.15)!important}",
    ".nav-item:hover i,.nav-item.active i{color:var(--red)!important;transform:scale(1.25)!important;",
    "filter:drop-shadow(0 0 8px var(--red))!important}",
    ".sidebar-toggle{position:fixed!important;top:auto!important;bottom:28px!important;left:24px!important;z-index:300;",
    "width:56px;height:56px;border-radius:18px;background:linear-gradient(145deg,rgba(255,0,60,.2),rgba(18,6,10,.95));",
    "backdrop-filter:blur(16px);border:1px solid rgba(255,0,60,.4);color:var(--red);cursor:pointer;",
    "display:flex;align-items:center;justify-content:center;font-size:20px;",
    "transition:all .45s var(--snap);box-shadow:var(--glow)}",
    ".sidebar-toggle:hover{transform:scale(1.12) rotate(-12deg);box-shadow:0 0 40px rgba(255,0,60,.5)}",
    ".sidebar-toggle.open{left:248px;bottom:28px}",
    "body.sidebar-open .main-content{margin-left:280px!important;transition:margin-left .75s var(--feather)}",
    ".card{background:var(--card)!important;backdrop-filter:blur(18px)!important;border:1px solid var(--border)!important;",
    "border-radius:22px!important;transition:all .5s var(--feather)!important;position:relative;overflow:hidden}",
    ".card::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;",
    "background:linear-gradient(90deg,transparent,rgba(255,0,60,.06),transparent);transition:left .6s}",
    ".card:hover::after{left:120%}",
    ".card:hover{border-color:rgba(255,0,60,.45)!important;box-shadow:0 16px 48px rgba(255,0,60,.15)!important;",
    "transform:translateY(-6px)!important}",
    ".top-bar{background:var(--card)!important;backdrop-filter:blur(22px)!important;border-radius:22px!important;",
    "border:1px solid var(--border)!important;box-shadow:0 8px 32px rgba(255,0,60,.08)!important}",
    ".section.active{animation:sectionIn .6s var(--feather) both}",
    "@keyframes sectionIn{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:none}}",
    "button{background:linear-gradient(135deg,var(--red),var(--dark-red))!important;border-radius:14px!important;",
    "transition:all .4s var(--feather)!important;box-shadow:0 4px 20px rgba(255,0,60,.25)!important}",
    "button:hover{transform:translateY(-3px) scale(1.03)!important;box-shadow:0 10px 36px rgba(255,0,60,.4)!important}",
    "button.secondary{background:transparent!important;border:1px solid var(--border)!important;box-shadow:none!important}",
    "button.secondary:hover{border-color:var(--red)!important;box-shadow:0 0 20px rgba(255,0,60,.2)!important}",
    ".stat-value{background:linear-gradient(135deg,var(--red),var(--gold))!important;",
    "-webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important}",
    ".stat-card:hover{border-color:var(--red)!important;box-shadow:var(--glow)!important}",
    ".coin-display{border-color:rgba(255,215,0,.4)!important;background:rgba(255,215,0,.08)!important}",
    "input:focus,select:focus,textarea:focus{border-color:var(--red)!important;",
    "box-shadow:0 0 0 3px rgba(255,0,60,.18)!important}",
    ".modal{border:1px solid var(--border)!important;border-radius:24px!important;",
    "box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 40px rgba(255,0,60,.12)!important}",
    ".feather-slider-wrap{position:relative;margin:28px 0 12px;padding:0 8px}",
    ".feather-slider-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px}",
    ".feather-slider-head h3{font-size:18px;font-weight:700;display:flex;align-items:center;gap:10px}",
    ".feather-slider-head h3 i{color:var(--red)}",
    ".feather-nav{display:flex;gap:10px}",
    ".feather-btn{width:44px;height:44px;border-radius:14px;border:1px solid var(--border);",
    "background:rgba(255,0,60,.08);color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center;",
    "font-size:16px;transition:all .35s var(--feather)}",
    ".feather-btn:hover{background:rgba(255,0,60,.2);transform:scale(1.08);box-shadow:0 0 20px rgba(255,0,60,.3)}",
    ".feather-btn:disabled{opacity:.35;cursor:default;transform:none;box-shadow:none}",
    ".feather-track-outer{overflow:hidden;border-radius:20px;mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);",
    "-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}",
    ".feather-track{display:flex;gap:20px;transition:transform .85s var(--feather);will-change:transform;padding:8px 4px 16px}",
    ".feather-card{flex:0 0 min(320px,82vw);background:linear-gradient(160deg,rgba(255,0,60,.1),rgba(18,6,10,.9));",
    "border:1px solid var(--border);border-radius:20px;padding:28px 24px;cursor:pointer;",
    "transition:transform .5s var(--feather),box-shadow .5s,border-color .4s;position:relative;overflow:hidden}",
    ".feather-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,0,60,.12),transparent 55%);pointer-events:none}",
    ".feather-card:hover{transform:translateY(-10px) scale(1.02);border-color:rgba(255,0,60,.5);",
    "box-shadow:0 20px 50px rgba(255,0,60,.2)}",
    ".feather-card .fc-icon{width:72px;height:72px;border-radius:20px;background:rgba(255,0,60,.12);",
    "display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--red);margin-bottom:18px;",
    "box-shadow:0 0 28px rgba(255,0,60,.15);transition:transform .45s var(--snap)}",
    ".feather-card:hover .fc-icon{transform:scale(1.15) rotate(-6deg)}",
    ".feather-card h4{font-size:17px;font-weight:700;margin-bottom:8px}",
    ".feather-card p{font-size:13px;color:var(--muted);line-height:1.55;margin-bottom:16px;min-height:40px}",
    ".feather-card .fc-go{font-size:12px;font-weight:700;color:var(--red);display:inline-flex;align-items:center;gap:6px;",
    "text-transform:uppercase;letter-spacing:.5px}",
    ".feather-dots{display:flex;justify-content:center;gap:8px;margin-top:8px}",
    ".feather-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,0,60,.25);border:none;cursor:pointer;padding:0;",
    "transition:all .35s var(--feather)}",
    ".feather-dot.active{width:24px;border-radius:6px;background:var(--red);box-shadow:0 0 12px var(--red)}",
    ".feature-card{transition:all .45s var(--feather)!important}",
    ".feature-card:hover{transform:translateY(-10px) scale(1.03)!important;border-color:var(--red)!important;",
    "box-shadow:0 16px 40px rgba(255,0,60,.2)!important}",
    ".feature-icon{color:var(--red)!important;background:rgba(255,0,60,.1)!important;box-shadow:0 0 24px rgba(255,0,60,.15)!important}",
    ".card-title i{color:var(--red)!important;filter:drop-shadow(0 0 8px var(--red))!important}",
    "@media(max-width:700px){body.sidebar-open .main-content{margin-left:0!important}.sidebar-toggle.open{left:24px}}",
    ".viewer3d-wrap{border-color:var(--border)!important;box-shadow:inset 0 0 40px rgba(255,0,60,.05)!important}"
  ].join("");

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
    for (var i = 0; i < 7; i++) {
      var c = document.createElement("div");
      c.className = "crack";
      c.style.top = 10 + Math.random() * 80 + "%";
      c.style.left = Math.random() * 40 + "%";
      c.style.width = 80 + Math.random() * 180 + "px";
      c.style.transform = "rotate(" + (Math.random() * 40 - 20) + "deg)";
      c.style.animationDelay = Math.random() * 4 + "s";
      c.style.animationDuration = 3 + Math.random() * 3 + "s";
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
    { icon: "fa-tshirt", title: "3D Skins", desc: "Steve / Alex live preview. Upload PNG skins and rotate in 3D.", section: "skins" },
    { icon: "fa-user-edit", title: "Profile", desc: "Display name, bio, logo — make your identity unique.", section: "profile" },
    { icon: "fa-cube", title: "Mods", desc: "Browse and download curated Minecraft mods.", section: "mods" },
    { icon: "fa-plug", title: "Plugins", desc: "Server plugins ready for your network.", section: "plugins" },
    { icon: "fa-box", title: "Resource Packs", desc: "HD textures and style packs for a fresh look.", section: "resources" },
    { icon: "fa-sun", title: "Shaders", desc: "Graphics shaders for cinematic lighting.", section: "shaders" },
    { icon: "fa-download", title: "FearLauncher", desc: "Official client download — secure stable builds.", section: "download" },
    { icon: "fa-flag", title: "Capes", desc: "Cape textures with live 3D back preview.", section: "capes" },
    { icon: "fa-gift", title: "Daily Rewards", desc: "Login streak board — claim coins every day.", section: "daily-rewards" },
    { icon: "fa-sparkles", title: "Cosmetics", desc: "Shop hats, crowns and more (coming soon).", section: "cosmetics-shop" }
  ];

  function buildFeatherSlider() {
    var dash = document.getElementById("dashboard");
    if (!dash || document.getElementById("featherSlider")) return;

    var wrap = document.createElement("div");
    wrap.className = "feather-slider-wrap";
    wrap.id = "featherSlider";
    wrap.innerHTML =
      '<div class="feather-slider-head">' +
      '<h3><i class="fas fa-fire"></i> Explore Features</h3>' +
      '<div class="feather-nav">' +
      '<button type="button" class="feather-btn" id="featherPrev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>' +
      '<button type="button" class="feather-btn" id="featherNext" aria-label="Next"><i class="fas fa-chevron-right"></i></button>' +
      "</div></div>" +
      '<div class="feather-track-outer"><div class="feather-track" id="featherTrack"></div></div>' +
      '<div class="feather-dots" id="featherDots"></div>';

    var track = wrap.querySelector("#featherTrack");
    var dots = wrap.querySelector("#featherDots");
    FEATURES.forEach(function (f, i) {
      var card = document.createElement("div");
      card.className = "feather-card";
      card.innerHTML =
        '<div class="fc-icon"><i class="fas ' + f.icon + '"></i></div>' +
        "<h4>" + f.title + "</h4>" +
        "<p>" + f.desc + "</p>" +
        '<span class="fc-go">Open <i class="fas fa-arrow-right"></i></span>';
      card.onclick = function () {
        if (typeof window.showSection === "function") window.showSection(f.section);
        document.querySelectorAll(".nav-item").forEach(function (n) {
          n.classList.toggle("active", n.getAttribute("data-section") === f.section);
        });
      };
      track.appendChild(card);
      var d = document.createElement("button");
      d.type = "button";
      d.className = "feather-dot" + (i === 0 ? " active" : "");
      d.setAttribute("data-i", String(i));
      dots.appendChild(d);
    });

    var stats = dash.querySelector(".grid-4");
    if (stats && stats.parentNode) stats.parentNode.insertBefore(wrap, stats.nextSibling);
    else dash.insertBefore(wrap, dash.firstChild);

    var idx = 0;
    var cardW = 340;
    function measure() {
      var c = track.querySelector(".feather-card");
      if (c) cardW = c.offsetWidth + 20;
    }
    function go(i) {
      measure();
      var max = Math.max(0, FEATURES.length - Math.max(1, Math.floor((track.parentElement.clientWidth || 600) / cardW)));
      idx = Math.max(0, Math.min(i, max));
      track.style.transform = "translateX(" + (-idx * cardW) + "px)";
      dots.querySelectorAll(".feather-dot").forEach(function (d, di) {
        d.classList.toggle("active", di === idx);
      });
      var prev = document.getElementById("featherPrev");
      var next = document.getElementById("featherNext");
      if (prev) prev.disabled = idx <= 0;
      if (next) next.disabled = idx >= max;
    }
    document.getElementById("featherPrev").onclick = function () { go(idx - 1); };
    document.getElementById("featherNext").onclick = function () { go(idx + 1); };
    dots.querySelectorAll(".feather-dot").forEach(function (d) {
      d.onclick = function () { go(parseInt(d.getAttribute("data-i"), 10) || 0); };
    });

    var startX = 0, cur = 0, dragging = false;
    track.addEventListener("pointerdown", function (e) {
      dragging = true;
      startX = e.clientX;
      cur = idx * cardW;
      track.style.transition = "none";
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    });
    track.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      track.style.transform = "translateX(" + (-(cur - dx)) + "px)";
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "";
      var dx = e.clientX - startX;
      if (dx < -60) go(idx + 1);
      else if (dx > 60) go(idx - 1);
      else go(idx);
    }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    go(0);
    window.addEventListener("resize", function () { go(idx); });
  }

  function onSection() {
    var dash = document.getElementById("dashboard");
    if (dash && dash.classList.contains("active")) buildFeatherSlider();
  }

  function boot() {
    spawnCracks();
    bootSidebar();
    var orig = window.showSection;
    if (typeof orig === "function") {
      window.showSection = function (id) {
        orig(id);
        setTimeout(onSection, 80);
      };
    }
    setTimeout(onSection, 400);
    var dash = document.getElementById("dashboard");
    if (dash) {
      new MutationObserver(function () {
        if (dash.classList.contains("active")) setTimeout(buildFeatherSlider, 50);
      }).observe(dash, { attributes: true, attributeFilter: ["class"] });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
