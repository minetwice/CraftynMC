/* CraftynMC — Features tour (video-style walkthrough)
 * ------------------------------------------------------------------
 * Replaces the old "How do I download?" tutorial with a cinematic, auto-playing
 * tour of EVERYTHING a player can do — and nothing staff-only.
 *
 *   - a small "Features" chip sits at the top of the page
 *   - tapping it opens a full-screen player that advances on its own, like a video
 *   - a real timeline you can scrub, play/pause, back/next
 *   - each slide has a "Go there" button that opens that page
 *   - leaderboards / seasons get their own spotlight
 */
(function () {
  "use strict";

  var CHIP = "flFeaturesChip";
  var OV = "flFeaturesOv";
  var SLIDE_MS = 6500;
  var timer = null, raf = null;
  var i = 0, playing = true, startedAt = 0;

  /* Every feature a normal player can use. No admin, no staff tools. */
  var SLIDES = [
    {
      emoji: "🚀", c1: "#ff0048", c2: "#8b0022",
      title: "Welcome to CraftynMC",
      body: "One place for mods, plugins, resource packs, shaders and your own launcher client — all free, all in one dashboard.",
      go: { label: "Open the dashboard", section: "dashboard" }
    },
    {
      emoji: "🔎", c1: "#7c3aed", c2: "#3b1d70",
      title: "Find anything in seconds",
      body: "Search as you type, then narrow it down with real filters — loader, Minecraft version, environment and licence. Sort by downloads, newest or recently updated.",
      go: { label: "Browse mods", section: "mods" }
    },
    {
      emoji: "🧩", c1: "#0ea5e9", c2: "#0b4f78",
      title: "Mods, plugins, packs and shaders",
      body: "Each category has its own store with 20 projects a page, so a big library stays easy to scroll.",
      go: { label: "See plugins", section: "plugins" }
    },
    {
      emoji: "📄", c1: "#f59e0b", c2: "#7a4a05",
      title: "A real project page for every upload",
      body: "Description, gallery, versions, reviews, the licence it ships under, who made it and when it was last updated — plus a one-tap Copy link to share it anywhere.",
      go: { label: "Open a project", section: "mods" }
    },
    {
      emoji: "🎮", c1: "#22c55e", c2: "#0c5c2e",
      title: "The FearLauncher client",
      body: "Our own Android launcher. Play Minecraft: Java Edition on your phone with tuned render resolution, a smooth FPS profile and no hidden 60 FPS cap.",
      go: { label: "Get the launcher", section: "fearlauncher" }
    },
    {
      emoji: "🧑‍🎨", c1: "#ec4899", c2: "#7a0f45",
      title: "Your own 3D character",
      body: "Upload a 64×64 skin and a cape, pick slim or classic, and see it live in 3D. Your skin shows up for other players on the network and inside the launcher.",
      go: { label: "Customise profile", section: "profile" }
    },
    {
      emoji: "🔍", c1: "#06b6d4", c2: "#0a5566",
      title: "Look up any player",
      body: "Search anyone by name with live suggestions, see their character rendered in 3D with their skin, their stats and their badges — and download their skin and cape.",
      go: { label: "Open Player Lookup", section: "player-lookup" }
    },
    {
      emoji: "🏆", c1: "#eab308", c2: "#7a5c04",
      title: "Seasons — the weekly leaderboards",
      body: "A season is one week. TWO separate boards run side by side: most time online, and most coins earned. Top three of each board win coins when the season ends.",
      go: { label: "See Season 1", section: "leaderboard" },
      hero: true
    },
    {
      emoji: "💰", c1: "#facc15", c2: "#8a6a00",
      title: "Prizes, paid automatically",
      body: "🥇 2,000 · 🥈 1,000 · 🥉 500 coins on BOTH boards. Payout happens by itself when the season rolls over on Monday, and winners get a notification telling them where they placed.",
      go: { label: "View the boards", section: "leaderboard" },
      hero: true
    },
    {
      emoji: "🏅", c1: "#f97316", c2: "#7c3a05",
      title: "Hall of fame",
      body: "Every finished season is remembered — its champions on both boards, with the coins they won. Click any name to open that player.",
      go: { label: "Open the hall of fame", section: "leaderboard" }
    },
    {
      emoji: "📺", c1: "#ff0048", c2: "#7a0022",
      title: "Earn coins by watching ads",
      body: "Watch a short sponsored ad and get coins instantly — up to 10 a day, with a streak bonus for coming back. Ads are what keep CraftynMC free.",
      go: { label: "Earn coins", section: "earn-coins" }
    },
    {
      emoji: "🛒", c1: "#8b5cf6", c2: "#40206e",
      title: "Spend them in the Coin Shop",
      body: "Turn coins into a Premium badge, a featured project for 7 days, an ad-free pass, or a streak freeze so a missed day never breaks your run.",
      go: { label: "Open the shop", section: "coin-shop" }
    },
    {
      emoji: "🎁", c1: "#10b981", c2: "#0a5a43",
      title: "Daily rewards & streaks",
      body: "Claim a reward every day — the ladder climbs from 100 coins to 1,500 on day ten. Keep the streak alive and the rewards keep growing.",
      go: { label: "Claim today", section: "daily-rewards" }
    },
    {
      emoji: "🤝", c1: "#3b82f6", c2: "#1b3f7a",
      title: "Follow creators, get notified",
      body: "Follow anyone and their updates land in your bell. You get told when someone follows you, and when someone reviews a project you uploaded.",
      go: { label: "Find players", section: "player-lookup" }
    },
    {
      emoji: "⭐", c1: "#f43f5e", c2: "#7a0f24",
      title: "Rate, review and share",
      body: "Give any project a star rating, leave a note for the creator, and copy a shareable link to the exact page you are on — project or player.",
      go: { label: "Browse projects", section: "mods" }
    },
    {
      emoji: "✨", c1: "#ff0048", c2: "#8b0022",
      title: "That's everything — go explore",
      body: "Dashboard, stores, launcher, skins, players, seasons, coins. It is all free, and it is all yours. Welcome to CraftynMC.",
      go: { label: "Back to the dashboard", section: "dashboard" }
    }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CSS = [
    "#" + CHIP + "{position:fixed;top:74px;left:50%;transform:translateX(-50%);z-index:9500;",
      "display:inline-flex;align-items:center;gap:9px;padding:9px 16px;border-radius:999px;cursor:pointer;",
      "background:rgba(12,14,22,.94);border:1px solid var(--border-hover);color:#fff;font-family:inherit;",
      "font-size:13px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,.55);backdrop-filter:blur(10px);",
      "transition:transform .16s ease,box-shadow .16s ease}",
    "#" + CHIP + ":hover{transform:translateX(-50%) translateY(-2px);box-shadow:0 16px 38px rgba(0,0,0,.65)}",
    "#" + CHIP + " i{color:var(--primary-red)}",
    "#" + CHIP + ".hide{display:none}",
    "@media (max-width:600px){#" + CHIP + "{top:auto;bottom:82px;font-size:12px;padding:8px 14px}}",

    "#" + OV + "{position:fixed;inset:0;z-index:10080;background:rgba(3,4,8,.97);display:flex;",
      "align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .22s ease}",
    "#" + OV + ".on{opacity:1}",
    ".flf-player{width:min(760px,100%);max-height:100%;display:flex;flex-direction:column;",
      "background:var(--bg-card);border:1px solid var(--border-hover);border-radius:22px;overflow:hidden;",
      "box-shadow:0 40px 100px rgba(0,0,0,.85)}",

    ".flf-bar{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border-color)}",
    ".flf-bar b{font-size:13.5px;color:#fff;display:flex;align-items:center;gap:8px}",
    ".flf-count{margin-left:auto;font-size:12px;color:var(--text-secondary)}",
    ".flf-x{width:32px;height:32px;border-radius:10px;border:1px solid var(--border-color);background:rgba(255,255,255,.05);",
      "color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}",

    ".flf-track{height:4px;background:rgba(255,255,255,.08);position:relative;cursor:pointer}",
    ".flf-fill{position:absolute;left:0;top:0;bottom:0;background:var(--gradient-main);width:0}",
    ".flf-marks{position:absolute;inset:0;display:flex}",
    ".flf-marks span{flex:1;border-right:1px solid rgba(0,0,0,.5)}",
    ".flf-marks span:last-child{border-right:none}",

    ".flf-stage{position:relative;min-height:340px;display:flex;align-items:center;justify-content:center;",
      "padding:34px 26px;text-align:center;overflow:hidden}",
    ".flf-glow{position:absolute;inset:0;opacity:.9;transition:background .5s ease}",
    ".flf-inner{position:relative;max-width:560px}",
    ".flf-emoji{font-size:62px;line-height:1;margin-bottom:16px;display:block;animation:flfPop .5s cubic-bezier(.16,1,.3,1) both}",
    ".flf-t{font-family:'Outfit',sans-serif;font-size:clamp(21px,4.6vw,30px);font-weight:800;color:#fff;margin:0 0 12px;letter-spacing:-.02em}",
    ".flf-b{font-size:14.5px;line-height:1.7;color:rgba(255,255,255,.86);margin:0}",
    ".flf-go{margin-top:20px;display:inline-flex;align-items:center;gap:9px;padding:12px 20px;border-radius:13px;border:none;",
      "background:rgba(255,255,255,.14);color:#fff;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;",
      "backdrop-filter:blur(6px);transition:background .16s ease,transform .12s ease}",
    ".flf-go:hover{background:rgba(255,255,255,.24)}",
    ".flf-go:active{transform:scale(.98)}",
    "@keyframes flfPop{from{opacity:0;transform:scale(.7) translateY(10px)}to{opacity:1;transform:none}}",
    "@keyframes flfUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
    ".flf-anim .flf-t,.flf-anim .flf-b,.flf-anim .flf-go{animation:flfUp .42s cubic-bezier(.16,1,.3,1) both}",
    ".flf-anim .flf-b{animation-delay:.07s}",
    ".flf-anim .flf-go{animation-delay:.13s}",

    ".flf-ctrl{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid var(--border-color)}",
    ".flf-btn{width:40px;height:40px;border-radius:12px;border:1px solid var(--border-color);background:rgba(255,255,255,.05);",
      "color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:background .15s ease}",
    ".flf-btn:hover{background:rgba(255,255,255,.12)}",
    ".flf-play{width:48px;height:48px;background:var(--gradient-main);border:none;font-size:15px;box-shadow:0 8px 22px -8px var(--primary-glow)}",
    ".flf-dots{display:flex;gap:5px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end}",
    ".flf-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .2s ease}",
    ".flf-dot.on{background:var(--primary-red);transform:scale(1.5)}",
    "@media (max-width:600px){.flf-stage{min-height:300px;padding:26px 18px}.flf-dots{display:none}}",

    "@media (prefers-reduced-motion:reduce){",
      ".flf-emoji,.flf-anim .flf-t,.flf-anim .flf-b,.flf-anim .flf-go{animation:none!important}",
    "}"
  ].join("");

  function styles() {
    if (document.getElementById("flfStyles")) return;
    var st = document.createElement("style");
    st.id = "flfStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- the chip ---------------- */
  function injectChip() {
    if (document.getElementById(CHIP)) return;
    var auth = document.getElementById("authView");
    if (auth && auth.classList.contains("active")) return;
    var b = document.createElement("button");
    b.id = CHIP;
    b.type = "button";
    b.innerHTML = '<i class="fas fa-circle-play"></i> Features tour';
    b.addEventListener("click", open);
    document.body.appendChild(b);
  }

  /* ---------------- the player ---------------- */
  function buildOverlay() {
    var ov = document.createElement("div");
    ov.id = OV;
    ov.innerHTML =
      '<div class="flf-player">' +
        '<div class="flf-bar">' +
          '<b><i class="fas fa-circle-play" style="color:var(--primary-red)"></i> CraftynMC features</b>' +
          '<span class="flf-count" id="flfCount">1 / ' + SLIDES.length + "</span>" +
          '<button type="button" class="flf-x" id="flfClose" aria-label="Close"><i class="fas fa-xmark"></i></button>' +
        "</div>" +
        '<div class="flf-track" id="flfTrack"><div class="flf-fill" id="flfFill"></div>' +
          '<div class="flf-marks">' + SLIDES.map(function () { return "<span></span>"; }).join("") + "</div>" +
        "</div>" +
        '<div class="flf-stage" id="flfStage"><div class="flf-inner" id="flfInner"></div></div>' +
        '<div class="flf-ctrl">' +
          '<button type="button" class="flf-btn" id="flfPrev" aria-label="Previous"><i class="fas fa-backward-step"></i></button>' +
          '<button type="button" class="flf-btn flf-play" id="flfPlay" aria-label="Play or pause"><i class="fas fa-pause"></i></button>' +
          '<button type="button" class="flf-btn" id="flfNext" aria-label="Next"><i class="fas fa-forward-step"></i></button>' +
          '<div class="flf-dots" id="flfDots">' +
            SLIDES.map(function (s, n) { return '<span class="flf-dot" data-n="' + n + '" title="' + esc(s.title) + '"></span>'; }).join("") +
          "</div>" +
        "</div>" +
      "</div>";
    document.body.appendChild(ov);

    ov.addEventListener("click", function (e) {
      if (e.target === ov || (e.target.closest && e.target.closest("#flfClose"))) close();
    });
    document.getElementById("flfPrev").addEventListener("click", function () { go(i - 1, true); });
    document.getElementById("flfNext").addEventListener("click", function () { go(i + 1, true); });
    document.getElementById("flfPlay").addEventListener("click", togglePlay);
    document.getElementById("flfTrack").addEventListener("click", function (e) {
      var r = this.getBoundingClientRect();
      var n = Math.floor(((e.clientX - r.left) / r.width) * SLIDES.length);
      go(Math.max(0, Math.min(SLIDES.length - 1, n)), true);
    });
    Array.prototype.forEach.call(ov.querySelectorAll(".flf-dot"), function (d) {
      d.addEventListener("click", function () { go(Number(d.getAttribute("data-n")), true); });
    });
    document.addEventListener("keydown", function (e) {
      var o = document.getElementById(OV);
      if (!o || !o.classList.contains("on")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(i + 1, true);
      if (e.key === "ArrowLeft") go(i - 1, true);
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
    });
  }

  function paint() {
    var s = SLIDES[i];
    var inner = document.getElementById("flfInner");
    var stage = document.getElementById("flfStage");
    if (!inner || !stage) return;

    stage.style.background = "linear-gradient(135deg," + s.c1 + " 0%," + s.c2 + " 100%)";
    inner.className = "flf-inner";
    inner.innerHTML =
      '<span class="flf-emoji">' + s.emoji + "</span>" +
      '<h3 class="flf-t">' + esc(s.title) + "</h3>" +
      '<p class="flf-b">' + esc(s.body) + "</p>" +
      (s.go ? '<button type="button" class="flf-go" id="flfGo"><i class="fas fa-arrow-right"></i> ' + esc(s.go.label) + "</button>" : "");
    void inner.offsetWidth;              // restart the entrance animation
    inner.classList.add("flf-anim");

    var g = document.getElementById("flfGo");
    if (g && s.go) g.addEventListener("click", function () {
      close();
      if (s.go.section && typeof window.showSection === "function") window.showSection(s.go.section);
    });

    var count = document.getElementById("flfCount");
    if (count) count.textContent = (i + 1) + " / " + SLIDES.length;
    Array.prototype.forEach.call(document.querySelectorAll(".flf-dot"), function (d) {
      d.classList.toggle("on", Number(d.getAttribute("data-n")) === i);
    });
    startedAt = Date.now();
  }

  function tick() {
    var o = document.getElementById(OV);
    if (!o || !o.classList.contains("on")) { raf = null; return; }
    var p = Math.min(1, (Date.now() - startedAt) / SLIDE_MS);
    var fill = document.getElementById("flfFill");
    if (fill) fill.style.width = (((i + p) / SLIDES.length) * 100).toFixed(2) + "%";
    if (playing && p >= 1) { go(i + 1, false); }
    raf = requestAnimationFrame(tick);
  }

  function go(n, user) {
    if (n >= SLIDES.length) { n = 0; }        // loop like a video
    if (n < 0) n = SLIDES.length - 1;
    i = n;
    paint();
    if (user) playing = true, setPlayIcon();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function setPlayIcon() {
    var b = document.getElementById("flfPlay");
    if (b) b.innerHTML = '<i class="fas fa-' + (playing ? "pause" : "play") + '"></i>';
  }

  function togglePlay() {
    playing = !playing;
    setPlayIcon();
    startedAt = Date.now() - (playing ? 0 : (Date.now() - startedAt));
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function open() {
    styles();
    var chip = document.getElementById(CHIP);
    if (chip) chip.classList.add("hide");
    if (!document.getElementById(OV)) buildOverlay();
    var ov = document.getElementById(OV);
    ov.classList.add("on");
    i = 0;
    playing = true;
    setPlayIcon();
    paint();
    startedAt = Date.now();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function close() {
    var ov = document.getElementById(OV);
    if (ov) ov.classList.remove("on");
    var chip = document.getElementById(CHIP);
    if (chip) chip.classList.remove("hide");
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function init() { styles(); injectChip(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  [400, 1400, 3000].forEach(function (t) { setTimeout(init, t); });

  window.FearLauncherFeatures = { open: open, close: close, slides: SLIDES.length };
})();
