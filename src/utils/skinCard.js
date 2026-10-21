/* CraftynMC / FearLauncher — skin -> character card
 * ------------------------------------------------------------------
 * Turns a player's Minecraft skin PNG into a shareable "character card"
 * (front view: head + body + arms + legs, with the overlay/hat layer blended
 * on top). Used as the og:image when a player's profile link is shared.
 *
 * pngjs is an optional, pure-JS dependency: if it is missing the renderer
 * simply reports itself unavailable and callers fall back — the server never
 * crashes over it.
 */
const zlib = require("zlib");

let PNG = null;
try { PNG = require("pngjs").PNG; } catch (e) { PNG = null; }

function available() { return !!PNG; }

/* ---------------- decode ---------------- */
function decode(buf) {
  if (!PNG) return null;
  try {
    const png = PNG.sync.read(Buffer.from(buf));
    return { w: png.width, h: png.height, data: png.data };   // RGBA
  } catch (e) { return null; }
}

function at(img, x, y) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return null;
  const i = (y * img.w + x) * 4;
  const a = img.data[i + 3];
  if (!a) return null;
  return [img.data[i], img.data[i + 1], img.data[i + 2], a];
}

/* ---------------- draw ---------------- */
function blend(out, W, x, y, rgba) {
  if (!rgba || x < 0 || y < 0 || x >= W || y * W + x >= W * (out.length / (W * 4))) return;
  const i = (y * W + x) * 4;
  const a = rgba[3] / 255;
  if (a >= 1) {
    out[i] = rgba[0]; out[i + 1] = rgba[1]; out[i + 2] = rgba[2]; out[i + 3] = 255;
    return;
  }
  const dstA = out[i + 3] / 255;
  const oa = a + dstA * (1 - a);
  if (!oa) return;
  out[i] = Math.round((rgba[0] * a + out[i] * dstA * (1 - a)) / oa);
  out[i + 1] = Math.round((rgba[1] * a + out[i + 1] * dstA * (1 - a)) / oa);
  out[i + 2] = Math.round((rgba[2] * a + out[i + 2] * dstA * (1 - a)) / oa);
  out[i + 3] = Math.round(oa * 255);
}

// Copy an sx,sy,sw,sh block of the skin onto the card at dx,dy, scaled by s.
function part(out, W, skin, sx, sy, sw, sh, dx, dy, s, mirror) {
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const srcX = mirror ? (sx + sw - 1 - x) : (sx + x);
      const c = at(skin, srcX, sy + y);
      if (!c) continue;
      for (let yy = 0; yy < s; yy++) {
        for (let xx = 0; xx < s; xx++) {
          blend(out, W, dx + x * s + xx, dy + y * s + yy, c);
        }
      }
    }
  }
}

/* ---------------- the character ---------------- */
// Front view on a 16 x 32 grid:
//   head 8x8 at (4,0)   body 8x12 at (4,8)   arms 4x12 at (0,8) and (12,8)
//   legs 4x12 at (4,20) and (8,20)
function drawCharacter(out, W, skin, ox, oy, s) {
  const modern = skin.h >= 64;

  // base layer
  part(out, W, skin, 8, 8, 8, 8, ox + 4 * s, oy + 0 * s, s);       // head
  part(out, W, skin, 20, 20, 8, 12, ox + 4 * s, oy + 8 * s, s);    // body
  part(out, W, skin, 44, 20, 4, 12, ox + 0 * s, oy + 8 * s, s);    // right arm
  part(out, W, skin, 4, 20, 4, 12, ox + 4 * s, oy + 20 * s, s);    // right leg
  if (modern) {
    part(out, W, skin, 36, 52, 4, 12, ox + 12 * s, oy + 8 * s, s);  // left arm
    part(out, W, skin, 20, 52, 4, 12, ox + 8 * s, oy + 20 * s, s);  // left leg
  } else {
    part(out, W, skin, 44, 20, 4, 12, ox + 12 * s, oy + 8 * s, s, true);  // mirrored
    part(out, W, skin, 4, 20, 4, 12, ox + 8 * s, oy + 20 * s, s, true);   // mirrored
  }

  // overlay / hat layer
  if (modern) {
    part(out, W, skin, 40, 8, 8, 8, ox + 4 * s, oy + 0 * s, s);     // hat
    part(out, W, skin, 20, 36, 8, 12, ox + 4 * s, oy + 8 * s, s);   // jacket
    part(out, W, skin, 44, 36, 4, 12, ox + 0 * s, oy + 8 * s, s);   // right sleeve
    part(out, W, skin, 52, 52, 4, 12, ox + 12 * s, oy + 8 * s, s);  // left sleeve
    part(out, W, skin, 4, 36, 4, 12, ox + 4 * s, oy + 20 * s, s);   // right trouser
    part(out, W, skin, 4, 52, 4, 12, ox + 8 * s, oy + 20 * s, s);   // left trouser
  } else {
    part(out, W, skin, 40, 8, 8, 8, ox + 4 * s, oy + 0 * s, s);     // hat only
  }
}

/* ---------------- card ---------------- */
const CARD_W = 1200;
const CARD_H = 630;
const BG = [8, 10, 15, 255];
const GLOW = [255, 0, 72];

/**
 * skinBase64 -> PNG Buffer (1200x630 character card), or null if unavailable.
 */
function card(skinBase64, opts) {
  if (!PNG || !skinBase64) return null;
  const skin = decode(Buffer.from(skinBase64, "base64"));
  if (!skin) return null;

  const out = new Uint8Array(CARD_W * CARD_H * 4);

  // dark background with a soft red glow behind the character
  const cx = CARD_W / 2, cy = CARD_H / 2;
  for (let y = 0; y < CARD_H; y++) {
    for (let x = 0; x < CARD_W; x++) {
      const i = (y * CARD_W + x) * 4;
      const d = Math.hypot((x - cx) / (CARD_W * 0.42), (y - cy) / (CARD_H * 0.55));
      const k = Math.max(0, 1 - d);
      const g = Math.pow(k, 2.2) * 0.30;
      out[i] = Math.round(BG[0] + GLOW[0] * g);
      out[i + 1] = Math.round(BG[1] + GLOW[1] * g);
      out[i + 2] = Math.round(BG[2] + GLOW[2] * g);
      out[i + 3] = 255;
    }
  }

  // character: 16 x 32 grid, scaled to ~86% of the card height
  const s = Math.max(1, Math.floor((CARD_H * 0.92) / 32));   // 18
  const ox = Math.round(cx - (16 * s) / 2);
  const oy = Math.round(cy - (32 * s) / 2);
  drawCharacter(out, CARD_W, skin, ox, oy, s);

  const png = new PNG({ width: CARD_W, height: CARD_H });
  Buffer.from(out.buffer, out.byteOffset, out.byteLength).copy(png.data);
  return PNG.sync.write(png, { colorType: 6 });
}

module.exports = { card, available, CARD_W, CARD_H };
