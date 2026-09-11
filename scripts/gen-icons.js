// Bright launcher icon: orange field + dark badge + orange dumbbell.
// Exports icon.png / adaptive-icon.png / splash.png + all mipmap PNGs
// (replacing the stale .webp set so the APK shows the new icon).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const ORANGE = [255, 122, 26];
const INK = [19, 19, 0];

function crc32(buf) {
  let table = crc32._t;
  if (!table) {
    table = crc32._t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}
function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// pixel canvas
function canvas(w, h, bg) {
  const px = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { px[i * 3] = bg[0]; px[i * 3 + 1] = bg[1]; px[i * 3 + 2] = bg[2]; }
  return {
    w, h, px,
    rect(x0, y0, x1, y1, c) {
      for (let y = Math.max(0, y0 | 0); y < Math.min(h, y1 | 0); y++)
        for (let x = Math.max(0, x0 | 0); x < Math.min(w, x1 | 0); x++) {
          const o = (y * w + x) * 3;
          px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
        }
    },
    circle(cx, cy, r, c) {
      for (let y = Math.max(0, (cy - r) | 0); y < Math.min(h, (cy + r) | 0); y++)
        for (let x = Math.max(0, (cx - r) | 0); x < Math.min(w, (cx + r) | 0); x++) {
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy <= r * r) {
            const o = (y * w + x) * 3;
            px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
          }
        }
    },
  };
}

// dumbbell badge centered at (cx, cy) with radius r: dark disc + orange bell
function badge(cv, cx, cy, r) {
  cv.circle(cx, cy, r, INK);
  const barT = r * 0.16;
  cv.rect(cx - r * 0.62, cy - barT / 2, cx + r * 0.62, cy + barT / 2, ORANGE);
  for (const s of [-1, 1]) {
    cv.rect(cx + s * r * 0.52 - r * 0.075, cy - r * 0.42, cx + s * r * 0.52 + r * 0.075, cy + r * 0.42, ORANGE);
    cv.rect(cx + s * r * 0.68 - r * 0.06, cy - r * 0.28, cx + s * r * 0.68 + r * 0.06, cy + r * 0.28, ORANGE);
  }
}

function toPng(cv) {
  const stride = cv.w * 3 + 1;
  const raw = Buffer.alloc(stride * cv.h);
  for (let y = 0; y < cv.h; y++) {
    raw[y * stride] = 0;
    cv.px.copy(raw, y * stride + 1, y * cv.w * 3, (y + 1) * cv.w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0);
  ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function appIcon(size) {
  const cv = canvas(size, size, ORANGE);
  badge(cv, size / 2, size / 2, size * 0.34);
  return toPng(cv);
}

// ---- assets/ (used by expo-notifications, iOS, splash config) ----
fs.writeFileSync(path.join(ROOT, 'assets', 'icon.png'), appIcon(1024));
fs.writeFileSync(path.join(ROOT, 'assets', 'adaptive-icon.png'), appIcon(1024));
fs.writeFileSync(path.join(ROOT, 'assets', 'favicon.png'), appIcon(64));
console.log('assets/icon.png, adaptive-icon.png, favicon.png rewritten (bright)');

// ---- splash: dark stage + centered badge ----
{
  const W = 1284, H = 2778;
  const cv = canvas(W, H, hexRgb('#0E0E12'));
  badge(cv, W / 2, H * 0.42, 300);
  fs.writeFileSync(path.join(ROOT, 'assets', 'splash.png'), toPng(cv));
  console.log('assets/splash.png rewritten');
}

// ---- android native splash logos (windowBackground) per density ----
// Replaces any stale/default artwork so launch shows OUR badge, never a
// generic placeholder.
{
  const DENS = { mdpi: 288, hdpi: 432, xhdpi: 576, xxhdpi: 864, xxxhdpi: 1152 };
  for (const [d, s] of Object.entries(DENS)) {
    const cv = canvas(s, s, hexRgb('#0E0E12'));
    badge(cv, s / 2, s / 2, s * 0.3);
    fs.writeFileSync(path.join(RES, `drawable-${d}`, 'splashscreen_logo.png'), toPng(cv));
    console.log(`drawable-${d}/splashscreen_logo.png rewritten (${s}px)`);
  }
}

// ---- android mipmaps (replace stale .webp with fresh PNGs) ----
const DENS = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, s] of Object.entries(DENS)) {
  const dir = path.join(RES, `mipmap-${d}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.webp')) fs.unlinkSync(path.join(dir, f));
  }
  const png = appIcon(s);
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), png);
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), png);
  console.log(`mipmap-${d}: ic_launcher(.png) + round, ${s}px`);
}
console.log('DONE — rebuild the APK to pick up the new icon');
