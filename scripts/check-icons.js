// Validate generated icon PNGs: dimensions + color diversity (art really drawn?).
const fs = require('fs');
const zlib = require('zlib');
function info(file) {
  const b = fs.readFileSync(file);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  // collect IDAT
  let off = 8; const parts = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('ascii', off + 4, off + 8);
    if (type === 'IDAT') parts.push(b.slice(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const stride = w * 3 + 1;
  const set = new Set();
  // undo filter byte 0 only (we wrote filter 0 everywhere)
  for (let y = 0; y < h; y += Math.max(1, (h / 64) | 0)) {
    for (let x = 0; x < w; x += Math.max(1, (w / 64) | 0)) {
      const o = y * stride + 1 + x * 3;
      set.add(`${raw[o]},${raw[o + 1]},${raw[o + 2]}`);
    }
  }
  // center pixel color
  const co = ((h / 2) | 0) * stride + 1 + ((w / 2) | 0) * 3;
  console.log(`${file}: ${w}x${h} ${(fs.statSync(file).size / 1024).toFixed(1)}kb colors~${set.size} center=rgb(${raw[co]},${raw[co + 1]},${raw[co + 2]})`);
}
info('assets/icon.png');
info('assets/adaptive-icon.png');
info('assets/splash.png');
info('android/app/src/main/res/mipmap-mdpi/ic_launcher.png');
info('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
