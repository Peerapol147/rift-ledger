// Original procedural pixel scenery, added on top of the existing backdrops (nothing here replaces them).
// Each place is up to four depth layers on a 512px wrapping strip: far (hazy), mid, near (ground line) and front (drawn over the characters).
// The stage scrolls them at different speeds while travelling, which is what gives the picture its depth.
export const LW = 512;
const H = 144, G = 128;
const HEX = new Map();
const hex = (h) => { let v = HEX.get(h); if (v === undefined) { const n = parseInt(h.slice(1), 16); v = (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0; HEX.set(h, v); } return v; };
const rnd = (i) => { const v = Math.sin(i * 127.1 + 31.7) * 43758.5453; return v - Math.floor(v); };
function painter(k, front = false) {
  const buf = new Uint32Array(LW * H), L = { buf, k, front, y0: H, y1: 0 };
  const put = (x, y, c) => { if (y < 0 || y >= H) return; buf[y * LW + (((x % LW) + LW) % LW)] = c; if (c) { if (y < L.y0) L.y0 = y; if (y > L.y1) L.y1 = y; } };
  const row = (x, y, w, c) => { for (let i = 0; i < w; i++) put(x + i, y, c); };
  L.r = (x, y, w, h, c) => { c = hex(c); x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) row(x, y + j, w, c); };
  L.c = (x, y, w, h) => { for (let j = 0; j < h; j++) row(Math.round(x), Math.round(y) + j, w, 0); };
  L.l = (x0, y0, x1, y1, c, th = 1) => { c = hex(c); const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let s = 0; s <= n; s++) row(Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n), th, c); };
  // t: triangle with its point up; v: point down; e: ellipse.
  L.t = (cx, top, half, h, c) => { c = hex(c); for (let j = 0; j < h; j++) { const w = Math.round(half * (j + 1) / h); row(Math.round(cx) - w, Math.round(top) + j, w * 2 + 1, c); } };
  L.v = (cx, top, half, h, c) => { c = hex(c); for (let j = 0; j < h; j++) { const w = Math.round(half * (h - j) / h); row(Math.round(cx) - w, Math.round(top) + j, w * 2 + 1, c); } };
  L.e = (cx, cy, rx, ry, c) => { c = hex(c); for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry))); row(Math.round(cx) - w, Math.round(cy) + j, w * 2 + 1, c); } };
  // g: grid of small lights or windows, each kept with chance p.
  L.g = (x, y, cols, rows, dx, dy, w, h, c, p = 1, seed = 0) => { for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) if (rnd(seed + a * 7.3 + b * 13.1) < p) L.r(x + a * dx, y + b * dy, w, h, c); };
  return L;
}
// Shared props.
const peaks = (p, c, cap, seed, lo, hi, step = 46) => { for (let x = 0, i = 0; x < LW; x += step, i++) { const h = lo + rnd(seed + i) * (hi - lo), cx = x + rnd(seed + i + 9) * 18; p.t(cx, G - h, h * 0.62, h, c); if (cap) p.t(cx, G - h, h * 0.2, h * 0.3, cap); } };
const stall = (p, x, a, b) => { p.r(x, 92, 2, 30, "#3a2a26"); p.r(x + 38, 92, 2, 30, "#3a2a26"); p.r(x - 3, 86, 46, 8, a); for (let i = 0; i < 46; i += 8) { p.r(x - 3 + i, 86, 4, 8, b); p.r(x - 3 + i, 94, 4, 2, a); } p.r(x, 112, 40, 10, "#6a4a36"); p.r(x - 1, 110, 42, 2, "#8a6648"); for (let i = 0; i < 5; i++) p.r(x + 3 + i * 7, 107, 5, 3, ["#d86a4a", "#e8c25a", "#6fae6a", "#c98a5a", "#7fb0c8"][i]); };
const lanterns = (p, y, glow = "#ffd27a", cord = "#3a2a30") => { for (let x = 0; x < LW; x += 64) { p.l(x, y, x + 32, y + 6, cord); p.l(x + 32, y + 6, x + 64, y, cord); for (const [dx, dy] of [[14, 3], [32, 6], [50, 3]]) { p.r(x + dx - 1, y + dy + 1, 4, 5, glow); p.r(x + dx - 1, y + dy + 5, 4, 1, "#e0803c"); } } };
const chain = (p, x, y0, y1, c) => { for (let y = y0; y < y1; y += 3) p.r(x + (y / 3 & 1), y, 2, 2, c); };
const hook = (p, x, y, c) => { p.r(x - 1, y, 4, 4, c); p.r(x + 2, y + 4, 2, 6, c); p.r(x - 3, y + 9, 6, 2, c); p.r(x - 4, y + 5, 2, 5, c); };
const lamp = (p, x, top, c, glow) => { p.r(x, top, 2, G - top, c); p.r(x - 3, top - 2, 8, 2, c); p.r(x - 2, top, 6, 3, glow); };
const banner = (p, x, y, w, h, c, trim) => { p.r(x - 1, y - 2, w + 2, 2, trim); p.r(x, y, w, h, c); p.v(x + w / 2 - 0.5, y + h, w / 2, 5, c); p.r(x + (w >> 1) - 1, y + 4, 2, h - 6, trim); };
const tree = (p, x, base, h, trunk, leaf, lean = 0) => { p.l(x, base, x + lean, base - h, trunk, 3); if (leaf) { p.e(x + lean + 1, base - h - 4, 11, 7, leaf); p.e(x + lean - 7, base - h + 2, 7, 5, leaf); p.e(x + lean + 9, base - h + 1, 7, 5, leaf); } else { p.l(x + lean, base - h * 0.7, x + lean - 9, base - h - 4, trunk); p.l(x + lean, base - h * 0.5, x + lean + 10, base - h * 0.9, trunk); p.l(x + lean + 1, base - h, x + lean + 5, base - h - 8, trunk); } };

const ART = {
  // ── Hunting grounds (scene art, used by stage.js) ──
  z_bridge(far, mid, near, front) {
    const A = "#8497a6", ru = "#6b4636", rd = "#4a3028", rl = "#9a6a4a";
    for (const x of [48, 304]) { far.r(x, 28, 5, 100, A); far.r(x + 36, 28, 5, 100, A); far.r(x, 38, 41, 3, A); far.r(x, 66, 41, 3, A); far.l(x - 70, 98, x + 2, 28, A); far.l(x + 38, 28, x + 110, 98, A); for (let i = 1; i < 7; i++) { far.r(x - i * 10, 28 + i * 10, 1, 70 - i * 10, A); far.r(x + 40 + i * 10, 28 + i * 10, 1, 70 - i * 10, A); } }
    far.r(0, 98, LW, 4, A);
    mid.r(0, 76, LW, 5, ru); mid.r(0, 76, LW, 1, rl); mid.r(0, 104, LW, 6, rd); mid.r(0, 104, LW, 1, ru);
    for (let x = 0; x < LW; x += 32) { mid.l(x, 81, x + 15, 104, ru, 2); mid.l(x + 16, 104, x + 31, 81, ru, 2); mid.r(x, 76, 3, 30, rd); }
    mid.c(396, 70, 40, 44); mid.l(396, 78, 408, 96, rd, 2); mid.l(436, 106, 424, 118, rd, 2); // the broken span
    for (const x of [22, 214, 350, 470]) { mid.r(x, 110, 14, 18, "#6f7a80"); mid.r(x, 110, 14, 2, "#9aa5a8"); mid.r(x + 10, 112, 4, 16, "#566066"); }
    near.r(0, 117, LW, 2, "#3b3f48"); near.r(0, 122, LW, 1, "#3b3f48"); for (let x = 0; x < LW; x += 20) near.r(x, 117, 2, 11, "#3b3f48");
    for (let i = 0; i < 4; i++) { near.r(118 + i * 6, 113, 3, 4, "#e8c040"); near.r(121 + i * 6, 113, 3, 4, "#2a2a30"); }
    front.l(-6, 143, 20, 84, "#1c1a20", 6); front.l(-4, 143, 22, 84, "#4a3a34", 1); chain(front, 244, 0, 40, "#15161c"); hook(front, 244, 40, "#15161c");
    front.r(372, 96, 3, 48, "#1c1a20"); front.t(373, 82, 10, 14, "#c9a030"); front.r(372, 87, 2, 5, "#1c1a20");
  },
  z_market(far, mid, near, front) {
    for (let x = 0, i = 0; x < LW; x += 46, i++) { const y = 70 + rnd(i) * 12; far.t(x + 20, y, 22, 11, "#6b4a5e"); far.r(x + 3, y + 11, 35, G - y - 11, "#5c4054"); far.g(x + 8, y + 16, 3, 2, 9, 10, 4, 4, "#f0b060", 0.5, i * 3); far.r(x + 8, 116, 2, 12, "#4a3344"); far.r(x + 30, 116, 2, 12, "#4a3344"); }
    lanterns(mid, 66);
    stall(mid, 8, "#b8483e", "#f0dcb8"); stall(mid, 104, "#2f8a86", "#f0dcb8"); stall(mid, 206, "#c98a2e", "#f0dcb8"); stall(mid, 300, "#7a4a8a", "#f0dcb8"); stall(mid, 410, "#b8483e", "#f0dcb8");
    near.r(0, 120, LW, 8, "#2f5a6a"); near.r(0, 120, LW, 1, "#74aab0"); for (let x = 0; x < LW; x += 22) near.r(x + rnd(x) * 10, 123 + (x / 22 & 1) * 2, 7, 1, "#5f93a0");
    near.r(128, 116, 26, 5, "#5a3a2a"); near.r(124, 115, 34, 2, "#7a5238"); near.r(140, 104, 1, 11, "#3a2a26"); near.r(52, 118, 7, 5, "#8a6a48"); near.r(330, 117, 9, 6, "#8a6a48"); near.r(331, 119, 7, 1, "#5a4030");
    front.r(-4, 116, 22, 28, "#22161e"); front.r(-4, 116, 22, 1, "#5a3a44"); front.r(6, 104, 14, 12, "#2c1c26"); front.r(6, 104, 14, 1, "#5a3a44");
    front.r(246, 0, 1, 20, "#1a1218"); front.r(242, 20, 9, 12, "#ffb85a"); front.r(242, 20, 9, 2, "#3a1c1c"); front.r(242, 30, 9, 2, "#3a1c1c"); front.r(244, 23, 5, 6, "#fff0c0");
    for (let i = 0; i < 6; i++) front.l(230 + i * 4, 143, 228 + i * 5 + (i & 1) * 3, 112 + i * 3, "#1c2a22"); front.r(360, 110, 18, 34, "#22161e"); front.r(360, 110, 18, 1, "#5a3a44");
  },
  z_port(far, mid, near, front) {
    const A = "#6f8faa";
    for (const x of [26, 236, 410]) { far.r(x, 46, 3, 82, A); far.r(x + 26, 46, 3, 82, A); far.l(x, 70, x + 27, 96, A); far.l(x + 27, 70, x, 96, A); far.r(x - 22, 42, 84, 4, A); far.r(x + 8, 34, 12, 8, A); far.r(x + 52, 46, 1, 22, A); far.r(x + 47, 68, 11, 7, A); far.l(x + 14, 24, x - 22, 42, A); far.l(x + 14, 24, x + 62, 42, A); }
    const C = ["#8a4a4a", "#3f6a8a", "#a8873f", "#4a7a66", "#6a5a86"];
    for (let x = -6, i = 0; x < LW; x += 42, i++) { const n = 1 + (rnd(i + 3) * 3 | 0); for (let j = 0; j < n; j++) { const y = 108 - j * 15, c = C[(i * 2 + j * 3) % 5]; mid.r(x, y, 40, 14, c); for (let k = 3; k < 40; k += 4) mid.r(x + k, y + 2, 1, 11, "#22303c"); mid.r(x, y + 13, 40, 1, "#1c2630"); if (j === n - 1) mid.r(x, y, 40, 2, "#e8f6fb"); } }
    near.r(0, 122, LW, 6, "#5a6d80"); near.r(0, 122, LW, 1, "#dff3fa");
    for (let x = 12; x < LW; x += 64) { near.r(x, 116, 6, 6, "#2c3a4a"); near.r(x - 1, 115, 8, 2, "#44566a"); near.l(x + 6, 118, x + 34, 121, "#2c3a4a"); near.l(x + 34, 121, x + 63, 118, "#2c3a4a"); }
    for (let x = 30; x < LW; x += 90) near.r(x, 125, 16, 1, "#eafaff");
    front.r(-8, 66, 26, 78, "#16212e"); for (let k = -6; k < 18; k += 5) front.r(k, 70, 1, 74, "#0e1620"); front.r(-8, 66, 26, 2, "#dff3fa"); front.r(17, 68, 1, 76, "#3c5068");
    front.r(244, 0, 2, 38, "#101820"); hook(front, 244, 38, "#101820"); front.r(390, 100, 30, 44, "#16212e"); front.r(390, 100, 30, 2, "#dff3fa");
  },
  z_subway(far, mid, near, front) {
    far.r(0, 38, LW, 90, "#231c17"); far.r(0, 58, LW, 3, "#4a3f30"); far.r(0, 62, LW, 1, "#35291f");
    for (let x = 0; x < LW; x += 128) { far.e(x + 64, 128, 48, 62, "#3a3026"); far.e(x + 64, 128, 43, 57, "#0d0a09"); far.e(x + 64, 128, 26, 36, "#171210"); far.e(x + 64, 128, 22, 31, "#070606"); far.r(x + 62, 76, 4, 2, "#d6b46a"); far.r(x + 63, 96, 2, 1, "#8a7444"); }
    mid.r(0, 28, LW, 8, "#15100d"); mid.r(0, 35, LW, 1, "#3a2f24");
    mid.r(152, 84, 172, 38, "#3d4a4f"); mid.r(152, 84, 172, 2, "#56666c"); mid.r(152, 104, 172, 4, "#8a3a2e"); mid.g(158, 90, 12, 1, 14, 0, 9, 10, "#27312f"); mid.g(158, 90, 12, 1, 14, 0, 9, 10, "#c9aa62", 0.3, 5); for (const x of [196, 280]) { mid.r(x, 88, 12, 32, "#2c383c"); mid.r(x + 5, 88, 1, 32, "#1a2224"); } mid.g(164, 120, 6, 1, 28, 0, 8, 4, "#191614");
    for (const x of [18, 112, 344, 448]) { mid.r(x, 36, 12, 92, "#4b4034"); mid.r(x + 9, 36, 3, 92, "#372e25"); mid.r(x, 70, 12, 3, "#8a744a"); mid.r(x, 100, 12, 2, "#6e5a3c"); }
    mid.r(40, 48, 54, 13, "#1f2a2e"); mid.r(40, 48, 54, 1, "#d6b46a"); mid.r(40, 60, 54, 1, "#d6b46a"); mid.g(45, 53, 6, 1, 8, 0, 5, 3, "#d6b46a", 0.8, 2); mid.r(52, 36, 1, 12, "#15100d"); mid.r(82, 36, 1, 12, "#15100d");
    for (const x of [140, 264, 400]) { mid.r(x, 36, 1, 8, "#15100d"); mid.r(x - 4, 44, 9, 2, x === 264 ? "#6a5a3a" : "#e8cc7a"); }
    for (let x = 0; x < LW; x += 12) near.r(x, 121, 7, 1, "#b89a3a");
    near.r(0, 124, LW, 1, "#8a8478"); near.r(0, 126, LW, 1, "#5a554c"); for (let x = 0; x < LW; x += 10) near.r(x, 125, 4, 1, "#3a2c20");
    front.r(-8, 0, 24, H, "#100c0a"); front.r(15, 0, 1, H, "#3a2f24"); front.r(-8, 56, 24, 4, "#4a3c28"); front.r(-8, 118, 24, 3, "#4a3c28");
    chain(front, 222, 0, 14, "#0c0a09"); chain(front, 250, 0, 24, "#0c0a09"); front.l(214, 14, 258, 26, "#151a1c", 9); front.l(218, 17, 252, 26, "#b89a3a", 1);
    front.r(380, 0, 16, H, "#100c0a"); front.r(395, 0, 1, H, "#3a2f24");
  },
  z_factory(far, mid, near, front) {
    far.r(0, 76, LW, 52, "#3a140e"); for (let x = 0; x < LW; x += 40) { far.t(x + 40, 62, 0, 1, "#3a140e"); for (let j = 0; j < 14; j++) far.r(x + j * 2.6, 76 - j, 40 - j * 2.6, 1, "#3a140e"); far.r(x + 34, 64, 2, 12, "#7a2a14"); }
    for (const [i, x] of [34, 150, 286, 430].entries()) { const y = 16 + i % 2 * 12; far.r(x, y, 14, G - y, "#4a1a12"); far.r(x + 10, y, 4, G - y, "#33110c"); far.r(x - 1, y, 16, 3, "#ff8a3a"); far.r(x, y + 14, 14, 2, "#6a2a18"); far.e(x + 12, y - 8, 9, 5, "#5a2a22"); far.e(x + 22, y - 15, 7, 4, "#4a2420"); }
    mid.r(0, 46, LW, 5, "#5a3a30"); mid.r(0, 46, LW, 1, "#8a5a44"); for (let x = 24; x < LW; x += 72) { mid.r(x, 51, 5, 30, "#5a3a30"); mid.r(x - 1, 60, 7, 2, "#8a5a44"); mid.r(x - 1, 78, 7, 3, "#8a5a44"); }
    for (const x of [104, 372]) { mid.r(x, 58, 44, 64, "#2a1512"); mid.r(x, 58, 44, 2, "#5a2a1c"); mid.t(x + 22, 44, 22, 14, "#2a1512"); mid.e(x + 22, 104, 13, 11, "#ff8a2c"); mid.e(x + 22, 106, 9, 7, "#ffc85a"); mid.e(x + 22, 108, 5, 3, "#fff0b0"); mid.g(x + 4, 64, 5, 1, 9, 0, 2, 2, "#6a3a2a"); mid.r(x + 6, 118, 32, 4, "#170c0a"); }
    mid.e(232, 100, 16, 20, "#4a2a22"); mid.r(216, 100, 33, 22, "#4a2a22"); mid.r(216, 92, 33, 2, "#7a4634"); mid.r(216, 108, 33, 2, "#33160f"); mid.r(244, 84, 3, 38, "#33160f");
    mid.r(196, 82, 110, 2, "#6a4636"); for (let x = 196; x < 306; x += 12) mid.r(x, 74, 1, 8, "#6a4636"); mid.r(196, 74, 110, 1, "#6a4636");
    for (let x = 6, i = 0; x < LW; x += 58, i++) { near.t(x + 14, 118, 15, 10, "#241210"); near.r(x + 9, 122, 2, 1, "#ff6a2c"); near.r(x + 17, 125, 3, 1, "#ffb347"); near.r(x + 13, 119, 1, 1, "#ff6a2c"); }
    front.r(-4, 94, 30, 13, "#150a09"); front.r(12, 94, 14, 50, "#150a09"); front.r(-4, 94, 30, 1, "#6a2e1c"); front.r(25, 95, 1, 49, "#6a2e1c"); front.r(8, 91, 4, 19, "#2a1410"); front.e(19, 84, 5, 5, "#150a09"); front.r(18, 84, 2, 10, "#150a09");
    chain(front, 242, 0, 44, "#150a09"); hook(front, 242, 44, "#150a09"); front.r(372, 110, 40, 34, "#150a09"); front.r(372, 110, 40, 1, "#6a2e1c"); front.r(380, 114, 6, 2, "#ff6a2c");
  },
  z_cliff(far, mid, near, front) {
    peaks(far, "#7f9db5", "#e8fbff", 4, 48, 92, 58);
    far.l(196, 0, 188, 18, "#fff6b0"); far.l(188, 18, 197, 22, "#fff6b0"); far.l(197, 22, 186, 46, "#fff6b0"); far.l(186, 46, 191, 49, "#fff6b0"); far.l(191, 49, 184, 66, "#fff6b0"); far.l(189, 18, 176, 30, "#d9e8a8");
    for (let x = -10, i = 0; x < LW; x += 74, i++) { const h = 30 + rnd(i + 20) * 34; mid.t(x + 30, G - h, 14 + rnd(i) * 8, h, "#3a4c60"); mid.l(x + 30, G - h, x + 24, G - 2, "#5c7690"); mid.r(x + 6, 112, 46, 16, "#324356"); mid.r(x + 6, 112, 46, 2, "#cfe6f0"); }
    for (const x of [136, 262, 420]) { mid.r(x, 62, 1, 60, "#1e2a38"); mid.r(x - 2, 70, 5, 1, "#1e2a38"); mid.r(x - 1, 60, 3, 2, "#ffe76a"); mid.r(x, 57, 1, 3, "#fff6b0"); }
    tree(mid, 214, 122, 30, "#1e2a38", null, -4);
    for (let x = 0, i = 0; x < LW; x += 44, i++) { const w = 6 + rnd(i + 2) * 7; near.e(x + 12, 126, w, 4, "#2f3e50"); near.r(x + 12 - w * 0.6, 122, w, 1, "#8fb0c4"); near.l(x + 30, 127, x + 28, 122, "#56707a"); near.l(x + 32, 127, x + 34, 121, "#56707a"); }
    for (let j = 0; j < 46; j++) front.r(-2, j, Math.max(0, 30 - j * 0.6 - (j % 9 < 3 ? 4 : 0)), 1, "#0f1824"); front.l(28, 0, 2, 45, "#3c5870"); for (const [x, h] of [[6, 12], [14, 8], [21, 5]]) front.v(x, 44 - x, 2, h, "#dff6ff");
    tree(front, 244, 143, 58, "#0f1824", null, -6); front.e(390, 142, 26, 12, "#0f1824"); front.r(372, 131, 30, 1, "#3c5870");
  },
  z_island(far, mid, near, front) {
    for (const [x, y, w] of [[36, 46, 22], [206, 30, 16], [300, 52, 26], [452, 36, 18]]) { far.e(x, y, w, 4, "#4a2f6a"); far.v(x, y + 2, w - 3, 16, "#3a2456"); far.r(x - w + 4, y - 4, w, 1, "#8a5aa8"); far.r(x - 3, y - 12, 2, 9, "#3a2456"); far.e(x - 2, y - 14, 5, 3, "#6a3a86"); }
    mid.r(202, 46, 18, 82, "#2a1c3e"); mid.r(216, 46, 4, 82, "#1e132e"); mid.t(211, 30, 12, 16, "#3a2456"); mid.e(211, 60, 6, 6, "#ffd6f4"); mid.l(211, 60, 211, 56, "#2a1c3e"); mid.l(211, 60, 214, 62, "#2a1c3e"); mid.g(206, 76, 2, 4, 7, 11, 3, 5, "#ff8fe0", 0.6, 4);
    tree(mid, 30, 124, 36, "#1c1230", "#6a2a7a", 8); tree(mid, 300, 124, 42, "#1c1230", "#7a3a8a", -10); tree(mid, 356, 124, 28, "#1c1230", "#5a2a6e", 5); tree(mid, 470, 124, 38, "#1c1230", "#6a2a7a", -6);
    near.r(0, 120, LW, 8, "#3a1f52"); near.r(0, 120, LW, 1, "#8a4aa0"); for (let x = 0; x < LW; x += 26) near.r(x + rnd(x + 1) * 12, 122 + (x / 26 & 1) * 3, 8, 1, x % 78 ? "#6a3a86" : "#ff8fe0");
    near.r(36, 117, 104, 3, "#5a4636"); near.r(36, 117, 104, 1, "#8a6e52"); for (let x = 40; x < 140; x += 24) near.r(x, 120, 3, 8, "#3a2c22"); near.r(420, 117, 60, 3, "#5a4636"); for (let x = 424; x < 480; x += 24) near.r(x, 120, 3, 8, "#3a2c22");
    front.r(6, 98, 8, 46, "#0f0820"); front.r(4, 96, 12, 4, "#0f0820"); front.r(13, 98, 1, 46, "#7a3a8a"); front.l(14, 108, 30, 143, "#3a2456", 2);
    for (let i = 0; i < 7; i++) front.l(228 + i * 4, 143, 226 + i * 5, 108 + (i * 7) % 16, "#150b26"); front.r(233, 107, 3, 7, "#ff5fd2"); front.r(248, 110, 3, 7, "#ff5fd2");
    front.r(384, 100, 8, 44, "#0f0820"); front.r(382, 98, 12, 4, "#0f0820");
  },
  z_campus(far, mid, near, front) {
    const A = "#2c3a56", Bc = "#3a4c6c";
    far.r(54, 62, 150, 66, A); far.e(128, 62, 34, 20, A); far.r(126, 34, 4, 10, A); far.r(196, 26, 20, 102, A); far.t(206, 12, 11, 14, A); far.e(206, 40, 6, 6, "#7fd8ff"); far.l(206, 40, 206, 36, A); far.l(206, 40, 209, 41, A); far.g(62, 72, 13, 4, 10, 12, 4, 6, Bc); far.g(62, 72, 13, 4, 10, 12, 4, 6, "#7fd8ff", 0.14, 3);
    far.r(318, 54, 120, 74, A); far.t(378, 38, 62, 16, A); far.g(326, 64, 11, 5, 10, 12, 4, 6, Bc); far.g(326, 64, 11, 5, 10, 12, 4, 6, "#7fd8ff", 0.12, 8);
    mid.r(0, 66, LW, 5, "#56668a"); mid.r(0, 66, LW, 1, "#8a9cc0"); mid.r(0, 71, LW, 2, "#3a465e");
    for (let x = 6; x < LW; x += 30) { mid.r(x, 73, 7, 50, "#4a5876"); mid.r(x + 5, 73, 2, 50, "#36425a"); mid.r(x - 1, 73, 9, 2, "#6a7a9c"); mid.r(x - 1, 120, 9, 3, "#6a7a9c"); }
    mid.c(118, 60, 26, 14); mid.l(118, 66, 126, 72, "#3a465e", 2); // a fallen lintel
    for (const x of [50, 232, 400]) { lamp(mid, x, 84, "#1a2233", "#aee8ff"); }
    near.r(0, 123, LW, 5, "#3a465e"); near.r(0, 123, LW, 1, "#6a7a9c"); near.r(0, 126, LW, 1, "#2a3448");
    for (let x = 14, i = 0; x < LW; x += 38, i++) { near.r(x, 121, 6, 2, ["#8a4a4a", "#4a7a66", "#a8873f", "#5a6a9a"][i % 4]); near.r(x, 122, 6, 1, "#e8e0cc"); if (i % 3 === 0) near.r(x + 14, 124, 4, 3, "#e8e0cc"); }
    front.r(-6, 60, 22, 84, "#0b0f1a"); front.r(-8, 56, 26, 5, "#0b0f1a"); front.r(15, 61, 1, 83, "#34466a"); front.r(0, 44, 9, 12, "#0b0f1a"); front.r(2, 47, 5, 6, "#aee8ff");
    for (let y = 70; y < 140; y += 8) front.r(16, y, 12 - (y % 16 ? 0 : 3), 1, "#0b0f1a"); front.r(27, 66, 1, 78, "#0b0f1a");
    front.l(256, 8, 214, 22, "#0b0f1a", 3); front.l(238, 14, 226, 30, "#0b0f1a", 2); for (const [x, y] of [[212, 20], [224, 30], [236, 10], [246, 20], [228, 14]]) front.e(x, y, 6, 4, "#14203a");
    front.r(380, 60, 16, 84, "#0b0f1a"); front.r(378, 56, 20, 5, "#0b0f1a");
  },
  // ── Situations (the fourteen stage scenes) ──
  tower(far, mid, near, front) {
    for (let x = 0; x < LW; x += 64) { far.r(x + 27, 30, 10, 54, "#1e2c44"); far.e(x + 32, 30, 5, 6, "#1e2c44"); far.r(x + 31, 30, 2, 52, "#7fd8ff"); far.r(x + 28, 56, 8, 1, "#1e2c44"); }
    for (let x = 0; x < LW; x += 128) for (let i = 0; i < 12; i++) { mid.r(x + i * 10, 118 - i * 6, 13, 3, "#33405a"); mid.r(x + i * 10, 118 - i * 6, 13, 1, "#566a8c"); mid.r(x + i * 10 + 5, 121 - i * 6, 2, i * 6 + 7, "#232d42"); }
    for (const x of [150, 232, 406]) chain(mid, x, 0, 40 + x % 30, "#3a4660"); banner(mid, 196, 20, 12, 30, "#28507a", "#7fd8ff"); banner(mid, 452, 20, 12, 30, "#28507a", "#7fd8ff");
    for (let x = 4; x < LW; x += 34) { near.r(x, 126, 8, 1, "#7fd8ff"); near.r(x + 3, 124, 2, 1, "#4a8aaa"); }
    for (const x of [-6, 240, 372]) { front.r(x, 0, 22, H, "#080b14"); front.r(x + (x < 0 ? 21 : 0), 0, 1, H, "#2c3a56"); front.r(x - 2, 24, 26, 4, "#080b14"); front.r(x - 2, 116, 26, 5, "#080b14"); }
  },
  guild(far, mid, near, front) {
    for (let x = 12; x < LW; x += 72) { far.e(x + 12, 46, 12, 12, "#2a4a5a"); far.r(x, 46, 25, 50, "#2a4a5a"); far.e(x + 12, 48, 9, 9, "#7fc8b0"); far.r(x + 3, 48, 19, 44, "#7fc8b0"); far.r(x + 12, 38, 1, 54, "#2a4a5a"); far.r(x + 3, 66, 19, 1, "#2a4a5a"); }
    far.r(0, 100, LW, 28, "#1f3040"); far.r(0, 100, LW, 2, "#3a5468");
    mid.r(112, 74, 46, 36, "#5a4632"); mid.r(110, 72, 50, 3, "#7a6044"); mid.r(116, 110, 3, 18, "#3a2c20"); mid.r(151, 110, 3, 18, "#3a2c20"); mid.g(116, 79, 4, 3, 10, 10, 7, 8, "#ece0c0", 0.8, 6); mid.g(118, 79, 4, 3, 10, 10, 2, 2, "#c94a3a", 0.8, 6);
    banner(mid, 22, 40, 14, 40, "#2f7a6a", "#d8c070"); banner(mid, 220, 40, 14, 40, "#2f7a6a", "#d8c070"); banner(mid, 330, 40, 14, 40, "#7a3a3a", "#d8c070");
    for (const x of [226, 400]) { mid.r(x, 112, 34, 3, "#6a5038"); mid.r(x + 3, 115, 3, 13, "#4a3626"); mid.r(x + 28, 115, 3, 13, "#4a3626"); mid.r(x + 8, 107, 4, 5, "#c9b27a"); mid.r(x + 20, 108, 3, 4, "#8a9aa0"); }
    for (let x = 0; x < LW; x += 28) near.r(x, 129, 1, 6, "#1a2530");
    front.r(-2, 0, 20, 3, "#0c141c"); front.r(0, 3, 16, 44, "#143a34"); front.v(7.5, 47, 8, 7, "#143a34"); front.r(7, 8, 2, 34, "#8a7a40");
    front.e(244, 132, 12, 13, "#0c141c"); front.r(232, 122, 25, 2, "#3a5468"); front.r(232, 136, 25, 2, "#3a5468"); front.e(380, 134, 12, 12, "#0c141c");
  },
  forge(far, mid, near, front) {
    far.r(0, 60, LW, 68, "#2a140e"); for (let y = 64; y < 128; y += 8) far.g((y & 8) * 1.5, y, 22, 1, 24, 0, 22, 1, "#3c1e14"); for (let x = 30; x < LW; x += 170) { far.e(x + 30, 100, 30, 30, "#120806"); far.r(x, 100, 61, 28, "#120806"); }
    for (const x of [108, 366]) { mid.t(x + 24, 40, 30, 22, "#33201a"); mid.r(x + 16, 14, 16, 28, "#33201a"); mid.r(x - 4, 62, 56, 4, "#5a3a2a"); mid.r(x, 66, 48, 56, "#2a1814"); mid.e(x + 24, 104, 16, 12, "#ff8a2c"); mid.e(x + 24, 107, 11, 8, "#ffc85a"); mid.e(x + 24, 110, 6, 4, "#fff0b0"); mid.r(x + 4, 118, 40, 4, "#150c0a"); }
    for (const x of [196, 440]) { mid.r(x, 70, 44, 3, "#5a3a2a"); for (let i = 0; i < 5; i++) { mid.r(x + 4 + i * 8, 73, 1, 16 + (i * 5) % 8, "#8a7a6a"); mid.r(x + 2 + i * 8, 87 + (i * 5) % 8, 5, 4, i % 2 ? "#5a5a62" : "#8a8a92"); } }
    mid.r(22, 110, 22, 5, "#4a4a54"); mid.r(18, 108, 30, 3, "#6a6a76"); mid.r(28, 115, 10, 9, "#33333c"); mid.r(24, 124, 18, 4, "#4a4a54");
    for (let x = 60; x < LW; x += 90) { near.r(x, 126, 2, 1, "#ff8a2c"); near.r(x + 7, 125, 1, 1, "#ffc85a"); }
    front.e(10, 130, 13, 14, "#120a08"); front.r(-3, 119, 26, 2, "#5a3020"); front.r(-3, 134, 26, 2, "#5a3020"); chain(front, 240, 0, 30, "#120a08"); front.l(240, 30, 234, 56, "#120a08", 2); front.l(242, 30, 248, 56, "#120a08", 2); front.r(239, 28, 4, 4, "#5a3020");
    front.r(376, 112, 26, 32, "#120a08"); front.r(376, 112, 26, 1, "#5a3020");
  },
  arena(far, mid, near, front) {
    const C = ["#c9a07a", "#8a5a6a", "#d8c8a0", "#6a8aa0", "#b86a5a"];
    for (let j = 0; j < 4; j++) { const y = 44 + j * 13; far.r(0, y, LW, 13, j % 2 ? "#3a1f2c" : "#44263a"); far.r(0, y, LW, 1, "#6a3a4a"); for (let x = (j * 3) % 6; x < LW; x += 6) if (rnd(x + j * 91) < 0.7) { far.r(x, y + 4, 3, 3, C[(rnd(x * 3 + j) * 5) | 0]); far.r(x, y + 7, 3, 4, "#2a1420"); } }
    mid.r(0, 96, LW, 32, "#4a2c38"); mid.r(0, 96, LW, 3, "#7a4a52"); mid.r(0, 99, LW, 1, "#2e1a24"); for (let x = 0; x < LW; x += 24) mid.r(x, 100, 1, 28, "#3a2230");
    for (const x of [116, 372]) { mid.e(x + 12, 108, 12, 10, "#120a10"); mid.r(x, 108, 25, 20, "#120a10"); for (let i = 3; i < 24; i += 5) mid.r(x + i, 100, 1, 28, "#5a4a52"); mid.r(x, 114, 25, 1, "#5a4a52"); }
    for (const x of [40, 210, 296, 460]) banner(mid, x, 70, 12, 24, "#a8323a", "#e8c25a");
    for (let x = 10; x < LW; x += 46) near.r(x + rnd(x) * 20, 130 + (x & 3), 5, 1, "#5a3a44");
    for (const x of [8, 246, 392]) { front.r(x - 1, 86, 3, 58, "#0e080c"); front.r(x - 4, 82, 9, 5, "#0e080c"); front.t(x, 70, 4, 12, "#ff8a3a"); front.t(x, 75, 2, 7, "#ffe07a"); }
  },
  clinic(far, mid, near, front) {
    far.r(0, 40, LW, 88, "#dcebe8"); far.r(0, 96, LW, 2, "#a8c4c0"); for (let x = 20; x < LW; x += 120) { far.r(x, 50, 44, 34, "#8fb5b3"); far.r(x + 2, 52, 40, 30, "#eaf8ff"); far.r(x + 21, 52, 2, 30, "#8fb5b3"); far.r(x + 2, 66, 40, 1, "#8fb5b3"); }
    mid.r(0, 48, LW, 2, "#7f9c9a"); for (const x of [100, 356]) { for (let i = 0; i < 9; i++) mid.r(x + i * 5, 50, 4, 62 + (i & 1) * 2, i & 1 ? "#a9d4c4" : "#bfe2d4"); }
    for (const x of [196, 440]) { mid.r(x, 62, 34, 60, "#7fa6a4"); mid.r(x + 2, 64, 14, 26, "#d6ecea"); mid.r(x + 18, 64, 14, 26, "#d6ecea"); mid.r(x + 2, 92, 30, 28, "#94b8b6"); mid.r(x + 14, 104, 6, 2, "#5f8482"); }
    mid.r(22, 60, 16, 16, "#ffffff"); mid.r(28, 62, 4, 12, "#d8504a"); mid.r(24, 66, 12, 4, "#d8504a");
    for (const x of [140, 296]) { mid.r(x, 108, 44, 4, "#f4faf8"); mid.r(x, 112, 44, 3, "#9db8b6"); mid.r(x, 100, 3, 28, "#7f9c9a"); mid.r(x + 41, 106, 3, 22, "#7f9c9a"); mid.r(x + 4, 104, 10, 4, "#ffffff"); mid.r(x + 16, 106, 26, 3, "#a9d4c4"); }
    for (let x = 0; x < LW; x += 32) near.r(x, 128, 1, 16, "#8a9996");
    front.r(8, 60, 2, 84, "#4f6b6a"); front.r(2, 60, 14, 2, "#4f6b6a"); front.r(2, 62, 6, 12, "#d8eeea"); front.r(3, 68, 4, 5, "#e8a0a0"); front.l(5, 74, 9, 110, "#7f9c9a"); front.r(2, 140, 14, 4, "#4f6b6a");
    front.r(238, 128, 14, 16, "#5a4a40"); for (const [dx, dy] of [[-8, -16], [0, -24], [8, -15], [4, -8], [-4, -9]]) front.e(245 + dx, 128 + dy, 5, 8, "#3f7a5a"); front.r(380, 120, 22, 24, "#4f6b6a"); front.r(380, 120, 22, 2, "#d8eeea");
  },
  market(far, mid, near, front) {
    lanterns(far, 54, "#e8b060", "#4a3340"); lanterns(mid, 70);
    stall(mid, 2, "#b8483e", "#f0dcb8"); stall(mid, 106, "#2f8a86", "#f0dcb8"); stall(mid, 208, "#c98a2e", "#f0dcb8"); stall(mid, 318, "#7a4a8a", "#f0dcb8"); stall(mid, 420, "#3f7a4a", "#f0dcb8");
    for (const x of [62, 270, 384]) { near.r(x, 118, 10, 10, "#8a6a48"); near.r(x, 118, 10, 1, "#b08a60"); near.r(x + 8, 121, 9, 7, "#74583c"); near.r(x + 1, 122, 8, 1, "#5a4030"); }
    front.r(-4, 114, 22, 30, "#22161e"); front.r(-4, 114, 22, 1, "#6a4648"); front.r(4, 100, 14, 14, "#2c1c26"); front.r(4, 100, 14, 1, "#6a4648"); front.r(-4, 128, 22, 1, "#3a2630");
    front.r(246, 0, 1, 18, "#1a1218"); front.r(242, 18, 9, 12, "#ffb85a"); front.r(242, 18, 9, 2, "#3a1c1c"); front.r(242, 28, 9, 2, "#3a1c1c"); front.r(244, 21, 5, 6, "#fff0c0"); front.r(370, 112, 24, 32, "#22161e"); front.r(370, 112, 24, 1, "#6a4648");
  },
  wall(far, mid, near, front) {
    far.r(0, 46, LW, 82, "#3a4a5a"); far.r(0, 46, LW, 3, "#5c7084"); for (let x = 0; x < LW; x += 34) far.r(x, 49, 1, 79, "#2c3a48"); far.r(0, 82, LW, 1, "#2c3a48");
    for (const x of [70, 300, 450]) { far.r(x, 24, 22, 104, "#33414f"); far.r(x - 3, 20, 28, 5, "#4a5c6e"); far.r(x + 6, 28, 10, 6, "#8fe8ff"); far.l(x + 11, 30, x - 60, 0, "#6f8a9a"); far.l(x + 11, 31, x - 44, 0, "#6f8a9a"); }
    for (let x = 0; x < LW; x += 26) { mid.r(x, 92, 2, 36, "#222c36"); mid.l(x, 92, x - 4, 86, "#222c36"); } for (const y of [96, 104, 112, 120]) mid.r(0, y, LW, 1, "#4a5866"); for (let x = 6; x < LW; x += 13) mid.r(x, 86, 2, 1, "#6a7886");
    for (const x of [112, 330]) { for (let j = 0; j < 3; j++) for (let i = 0; i < 4 - j; i++) { mid.e(x + i * 13 + j * 6, 124 - j * 6, 6, 3, "#6e6a54"); mid.r(x + i * 13 + j * 6 - 4, 122 - j * 6, 8, 1, "#8a8668"); } }
    mid.r(216, 100, 2, 28, "#222c36"); mid.r(208, 88, 18, 13, "#e8c040"); mid.r(215, 90, 4, 6, "#222c36"); mid.r(215, 97, 4, 2, "#222c36");
    for (let x = 0; x < LW; x += 40) near.r(x + 8, 131, 14, 1, "#46525e");
    front.r(8, 78, 4, 66, "#0d1319"); front.l(10, 78, 2, 70, "#0d1319", 2); for (const y of [84, 96, 108]) { front.l(-2, y + 3, 30, y - 2, "#0d1319"); for (let x = 0; x < 30; x += 6) front.r(x, y + 1 - x / 6, 1, 3, "#3c4a56"); }
    front.r(244, 40, 3, 104, "#0d1319"); front.r(236, 34, 18, 7, "#0d1319"); front.r(238, 41, 14, 2, "#bff2ff"); front.r(384, 78, 4, 66, "#0d1319");
  },
  ruins(far, mid, near, front) {
    for (let x = 0, i = 0; x < LW; x += 84, i++) { const h = 50 + rnd(i + 5) * 30, y = G - h; far.r(x + 8, y, 54, h, "#3d3122"); far.g(x + 13, y + 6, 4, Math.floor(h / 13), 12, 13, 7, 8, "#1a1410"); far.c(x + 40 + rnd(i) * 10, y - 1, 24, 10 + rnd(i + 1) * 18); far.l(x + 40, y + 12, x + 62, y + 2, "#3d3122"); far.r(x + 8, y, 1, h, "#5a4830"); }
    for (const [i, x] of [16, 118, 152, 236, 318, 420, 466].entries()) { const h = 22 + rnd(i + 40) * 44; mid.r(x, G - h, 10, h, "#5a4a36"); mid.r(x + 7, G - h, 3, h, "#40342a"); mid.r(x - 1, G - 4, 12, 4, "#6e5a3c"); mid.t(x + 3, G - h - 4, 3, 4, "#5a4a36"); if (i % 2) mid.r(x - 2, G - h, 14, 3, "#6e5a3c"); }
    mid.l(40, 124, 104, 92, "#40342a", 4); mid.l(40, 123, 104, 91, "#7a6444", 1);
    for (let x = 0, i = 0; x < LW; x += 36, i++) { near.t(x + 12, 121 + rnd(i) * 3, 9 + rnd(i + 3) * 6, 7, "#2d251c"); near.r(x + 8, 125, 4, 2, "#5a4a36"); near.r(x + 24, 126, 3, 2, "#40342a"); }
    for (let i = 0; i < 5; i++) front.l(2 + i * 4, 143, 6 + i * 6, 92 + (i * 11) % 20, "#0f0b08"); front.r(-4, 124, 26, 20, "#0f0b08"); front.r(-4, 124, 26, 1, "#5a4830");
    front.r(236, 104, 24, 40, "#0f0b08"); front.c(236, 104, 8, 10); front.c(250, 104, 4, 5); front.l(236, 114, 260, 104, "#5a4830"); front.r(384, 116, 30, 28, "#0f0b08"); front.r(384, 116, 30, 1, "#5a4830");
  },
  frost(far, mid, near, front) {
    peaks(far, "#6f93ae", "#eaf8ff", 11, 44, 86, 52);
    for (let x = 4, i = 0; x < LW; x += 40, i++) { const h = 16 + rnd(i + 60) * 38; if (i % 5 === 2) { tree(mid, x + 8, 126, 30, "#2a3c50", null, 3); continue; } mid.t(x + 10, G - h, 5 + h * 0.14, h, "#8fc4dc"); mid.l(x + 10, G - h, x + 7, G - 1, "#e8fbff"); mid.t(x + 20, G - h * 0.5, 4, h * 0.5, "#6fa4c0"); }
    for (let x = 0, i = 0; x < LW; x += 30, i++) { near.e(x + 10, 127, 9 + rnd(i) * 6, 3, "#dff3fa"); near.r(x + 22, 124, 2, 1, "#ffffff"); }
    for (const [x0, n] of [[0, 6], [222, 7], [376, 5]]) for (let i = 0; i < n; i++) { const h = 10 + ((i * 13 + x0) % 22); front.v(x0 + i * 5 + 2, 0, 3, h, "#cfeaf6"); front.r(x0 + i * 5 + 2, 0, 1, h * 0.6, "#ffffff"); }
    front.e(6, 142, 22, 10, "#16283a"); front.r(-8, 133, 24, 1, "#dff3fa"); front.e(250, 143, 16, 8, "#16283a"); front.r(240, 136, 16, 1, "#dff3fa");
  },
  ember(far, mid, near, front) {
    far.t(150, 40, 110, 88, "#3a0f0c"); far.c(138, 38, 26, 8); far.r(136, 46, 30, 2, "#ff8a3a"); far.l(150, 48, 132, 88, "#ff6a2c", 2); far.l(132, 88, 140, 128, "#c9441c", 2); far.l(158, 48, 176, 100, "#c9441c"); far.t(410, 62, 80, 66, "#330d0a"); far.r(400, 62, 20, 2, "#ff8a3a"); far.e(152, 26, 14, 6, "#4a1c16"); far.e(170, 14, 10, 5, "#3e1612");
    for (const [i, x] of [20, 120, 226, 300, 388, 470].entries()) { if (i % 2) tree(mid, x, 126, 26 + i * 3, "#170908", null, i % 4 ? 5 : -5); else { const h = 30 + i * 6; mid.t(x, G - h, 12, h, "#2a0d0a"); mid.l(x, G - h, x - 5, G - 1, "#6a2416"); } }
    for (let x = 0, i = 0; x < LW; x += 48, i++) { const y = 131 + (i & 1) * 4; near.l(x, y, x + 12, y + 2, "#ff6a2c"); near.l(x + 12, y + 2, x + 22, y - 1, "#ffb347"); near.l(x + 22, y - 1, x + 30, y + 3, "#c9441c"); }
    for (const [x, w] of [[4, 20], [250, 16], [388, 22]]) { front.e(x, 142, w, 13, "#120505"); front.r(x - w * 0.6, 130, w * 1.1, 1, "#8a2a14"); front.r(x - 4, 134, 3, 1, "#ff6a2c"); front.r(x + 5, 138, 4, 1, "#ffb347"); }
  },
  rift(far, mid, near, front) {
    for (const [x, y, s] of [[30, 34, 8], [74, 60, 5], [196, 44, 7], [232, 22, 5], [300, 50, 9], [372, 30, 6], [440, 56, 8], [490, 26, 5]]) { far.t(x, y - s * 1.6, s, s * 1.6, "#4a2470"); far.v(x, y, s, s * 2.2, "#34184e"); far.l(x, y - s * 1.6, x - s, y, "#9a5ad0"); }
    for (const [x, lean] of [[36, 10], [86, -6], [176, 8], [222, -12], [320, 9], [404, -8], [476, 6]]) { mid.l(x, 128, x + lean, 62, "#1c1230", 4); mid.l(x + lean, 62, x + lean * 2.2, 46, "#1c1230", 2); mid.l(x + 3, 128, x + lean + 3, 62, "#3a2456", 1); mid.r(x + lean, 76, 3, 2, "#ff5fd2"); mid.r(x + lean * 0.5, 100, 3, 2, "#ff5fd2"); }
    for (let x = 6, i = 0; x < LW; x += 42, i++) { near.t(x + 8, 120, 3, 8, "#5a1f6e"); near.t(x + 13, 123, 2, 5, "#ff5fd2"); near.r(x + 8, 120, 1, 8, "#c98af0"); }
    for (const [x, d] of [[2, 1], [248, -1], [384, 1]]) { front.t(x, 88, 11, 56, "#0f0820"); front.t(x + d * 12, 108, 7, 36, "#0f0820"); front.l(x, 88, x - 6, 143, "#ff5fd2"); front.l(x + d * 12, 108, x + d * 12 + 4, 143, "#9a3ac0"); }
  },
  // Outdoor scenes already have full weather art, so only a foreground frame is added.
  home(far, mid, near, front) {
    for (const x0 of [-4, 232, 372]) { for (let i = 0; i < 4; i++) { front.r(x0 + i * 8, 118, 5, 26, "#3a2c24"); front.t(x0 + i * 8 + 2, 114, 2, 4, "#3a2c24"); front.r(x0 + i * 8, 118, 1, 26, "#7a6048"); } front.r(x0 - 2, 124, 34, 3, "#2c211b"); front.r(x0 - 2, 136, 34, 3, "#2c211b"); }
    for (let x = 34; x < 226; x += 30) { front.l(x, 143, x - 2, 138, "#2f5a3a"); front.l(x + 2, 143, x + 4, 137, "#3f7a4a"); }
  },
  city(far, mid, near, front) {
    front.r(10, 40, 3, 104, "#14161f"); front.r(10, 40, 20, 3, "#14161f"); front.r(24, 43, 8, 4, "#14161f"); front.r(25, 47, 6, 2, "#ffe9a8"); front.r(7, 136, 9, 8, "#14161f"); front.r(13, 40, 1, 104, "#3c4460");
    front.r(244, 84, 3, 60, "#14161f"); front.r(232, 70, 26, 15, "#1c2a44"); front.r(232, 70, 26, 1, "#5c7aa8"); front.g(235, 74, 5, 2, 4, 5, 3, 2, "#9bc4e8", 0.8, 3); front.r(384, 40, 3, 104, "#14161f"); front.r(384, 40, 18, 3, "#14161f");
  },
  street(far, mid, near, front) {
    front.r(12, 62, 3, 82, "#1b2028"); front.e(13, 56, 9, 9, "#1b2028"); front.e(13, 56, 7, 7, "#3f6aa0"); front.r(9, 54, 9, 4, "#e8eef2"); front.r(14, 62, 1, 82, "#4a5562");
    front.r(240, 124, 10, 20, "#7a2a26"); front.e(245, 123, 5, 4, "#7a2a26"); front.r(237, 130, 16, 4, "#5c1f1c"); front.r(240, 124, 2, 20, "#b04a40"); front.r(243, 118, 4, 3, "#5c1f1c"); front.r(384, 62, 3, 82, "#1b2028");
  },
};
const CACHE = new Map();
// Layers for a place id or scene key, back to front; null when there is no added art.
export function placeLayers(key) {
  if (!ART[key]) return null;
  if (!CACHE.has(key)) { const L = [painter(0.25), painter(0.55), painter(1), painter(1.6, true)]; ART[key](...L); CACHE.set(key, L.filter((l) => l.y1 >= l.y0)); }
  return CACHE.get(key);
}
export const PLACE_KEYS = Object.keys(ART);
