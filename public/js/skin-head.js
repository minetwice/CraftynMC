/* CraftynMC / FearLauncher — character HEAD avatar
 * ------------------------------------------------------------------
 * Draws a player's Minecraft head (face + hat overlay) from their skin PNG
 * onto a small canvas. Used in Player Lookup, the leaderboards and profiles.
 *
 * Minecraft skin layout (64x64):
 *   face  = 8x8 at (8, 8)
 *   hat   = 8x8 at (40, 8)   (the overlay layer, drawn on top)
 */
(function () {
  "use strict";

  var cache = {};

  function load(url) {
    if (!url) return Promise.resolve(null);
    if (cache[url]) return cache[url];
    cache[url] = new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;   // same-origin, so the canvas is not tainted
    });
    return cache[url];
  }

  function placeholder(ctx, size) {
    ctx.fillStyle = "#232633";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#6b7280";
    ctx.font = Math.round(size * 0.46) + "px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", size / 2, size / 2 + 1);
  }

  function draw(canvas, url, size) {
    if (!canvas || !canvas.getContext) return;
    size = size || 64;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    placeholder(ctx, size);

    load(url).then(function (img) {
      if (!img) return;
      try {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 8, 8, 8, 8, 0, 0, size, size);    // face
        ctx.drawImage(img, 40, 8, 8, 8, 0, 0, size, size);   // hat overlay
      } catch (e) { placeholder(ctx, size); }
    });
  }

  // Convenience: build a ready <canvas> element.
  function make(url, size) {
    size = size || 48;
    var c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    c.style.cssText = "width:" + size + "px;height:" + size + "px;border-radius:10px;display:block;image-rendering:pixelated;background:#232633";
    draw(c, url, size);
    return c;
  }

  window.FearLauncherHead = { draw: draw, make: make, load: load };
})();
