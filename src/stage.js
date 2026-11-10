import { HERO_RASTER } from "./hero-raster.js";
import { idleRows, idlePose, civilianIdleRows } from "./hero-idle.js";
import { SHADE_ART } from "./shade-art.js";
import * as shadowFlames from "../../pixelfx-main/src/fx/shadow/shadow-flames.js";
import { WEATHER, drawWeather } from "./weather-art.js";
import { makeHeroArt } from "./hero-art.js";
// Pixel stage: own backdrop and sprites, pixelfx for all effects. Acting follows pixelfx: wind-up, freeze on contact, target rocks back.
import { createFrame, clearFrame, createFx, composite } from "../../pixelfx-main/src/core/index.js";
import { REG } from "./fxreg.gen.js";
import { PRESET, AMBIENT } from "./presets.js";
import { ELEMENTS } from "./data.js";

const W = 256, H = 144, GY = 128, PX = 78, EX = 178;
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0; };
const mix = (a, b, t) => { const c = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)], A = c(a), B = c(b); return (255 << 24 | Math.round(A[2] + (B[2] - A[2]) * t) << 16 | Math.round(A[1] + (B[1] - A[1]) * t) << 8 | Math.round(A[0] + (B[0] - A[0]) * t)) >>> 0; };
const SCENES = {
  home: { a: "#7fb4d8", b: "#f4d9a6", city: "#5c7186", win: "#ffe9a8", g: "#6a5a4c", amb: "clouds" }, city: { a: "#2a2d5c", b: "#e0805c", city: "#23263f", win: "#ffc76b", g: "#3a3a48", amb: "clouds" },
  street: { a: "#8aa3b8", b: "#d8c8b0", city: "#566273", win: "#fff0c0", g: "#55555f", amb: "rain" }, rift: { a: "#160a2e", b: "#5a1f6e", city: "#120c24", win: "#ff5fd2", g: "#241a35", amb: "portal", crack: 1 },
  tower: { a: "#0e1220", b: "#28344e", city: "#171d2e", win: "#7fd8ff", g: "#20283a", amb: "fog", bricks: 1 }, forge: { a: "#1c0f0a", b: "#6b2c12", city: "#22120c", win: "#ffb648", g: "#2c1d16", amb: "fog", bricks: 1 }, guild: { a: "#14233a", b: "#3d5a6e", city: "#13202f", win: "#9be3c6", g: "#2a3644", amb: "fireflies" },
  clinic: { a: "#cfe8e6", b: "#f2f6f0", city: "#8fb5b3", win: "#ffffff", g: "#9aa9a6", amb: "rays", bricks: 1 }, market: { a: "#3b2a4a", b: "#f0a05a", city: "#4a3340", win: "#ffd27a", g: "#4d3b34", amb: "fireflies" },
  wall: { a: "#1b2735", b: "#6d8296", city: "#2a3745", win: "#8fe8ff", g: "#323c46", amb: "rain", bricks: 1 }, ruins: { a: "#1a1410", b: "#6e5a3c", city: "#2a2118", win: "#d6b46a", g: "#2d251c", amb: "fog", bricks: 1 },
  frost: { a: "#0d1b2e", b: "#a9d4e8", city: "#27405a", win: "#e8fbff", g: "#4a6178", amb: "fog" }, ember: { a: "#240808", b: "#ff6a2c", city: "#2e0f0c", win: "#ffb347", g: "#33140f", amb: "fireflies", bricks: 1 },
  arena: { a: "#1a0f1f", b: "#7a2a3a", city: "#241526", win: "#ff8a8a", g: "#3a2430", amb: "rays", bricks: 1 },
};
const SPR = { hero: ["....hhhh....", "...hhhhhh...", "...hssssh...", "...sdssds...", "...ssssss...", "....ssss....", "..cccccccc..", ".cscccccsc..", ".cs.cccc.sc.", ".ss.cccc.ss.", "....dddd....", "....dddd....", "...dd..dd...", "...dd..dd...", "...nn..nn..."], kid: ["........nnn.........","......nnhhhnn.......",".....nhhhhHhhn......","....nhHHhhhhhhhn....","....nhhhhhhhhhhn....","...nhhhhsSSshhhn....","....nhhssSSSshn.....","....nsssnSsnssn.....",".....nsSSSSSsn......","......nssSssn.......",".......nssnn........",".....nncttcann......","....ncCcttcacn......","...ncCCcttcacn......","...ncCcntncabn......","...nssnctncbbn......","...nSsnccncbbn......","....nnnccnnnn.......","......nddDdn........","......nddDdn........","......ndnndn........",".....nddnnddn.......",".....nwwnnwwn.......",".....nnnnnnnn......."],
  beast: ["..m.......m.......", "..mm.....mm.......", "..mmmmmmmmm.......", ".mmemmmmemmm......", ".mmmmmmmmmmmmmmm..", ".mmwmwmwmmmmmmmmm.", "..mmmmmmmmmmmmmmmm", "...mmmmmmmmmmmmmmm", "...mmm.mmm..mmm.mm", "...mm...mm...mm..m", "...mm...mm...mm..."],
  boss: ["....m........m....", "....mm......mm....", "...mmmmmmmmmmmm...", "..mmmemmmmmmemmm..", "..mmmmmmmmmmmmmm..", "..mwmwmwmwmwmwmm..", "...mmmmmmmmmmmm...", ".mmmmmmmmmmmmmmmm.", "mm.mmmmmmmmmmmm.mm", "mm.mmmmmmmmmmmm.mm", "m..mmmmmmmmmmmm..m", "...mmmm....mmmm...", "...mmm......mmm...", "..mmmm......mmmm.."] };
// Original childhood sprite: chunky outline, teal jacket and satchel.
const KID_PAL = {"n":"#202333","h":"#493642","H":"#73505a","s":"#dda17f","S":"#ffd0a3","c":"#277d83","C":"#52b3ac","t":"#f3dfb3","a":"#bf854d","b":"#835638","d":"#34455f","D":"#526c87","w":"#eee4cf"};
const PAL = { h: "#2a2233", s: "#f0c8a0", d: "#39445c", n: "#1a1d28", e: "#ffe76a", w: "#f4f4f4" };

let frame, img, bg, ctx, overlay, fxs = [], amb = [], scene = "", t = 0, shake = 0, stop = 0, last = 0, hero = "#ff9a6a", small = false, foe = null, seq = null, heroX = 0, heroFlash = 0, lastMinor = 0;
export const stage = { busy: false, speed: 1 };
const pix = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) frame.color[y * W + x] = c; };
function paint(k, seed) {
  const S = SCENES[k]; let r = seed;
  const R = () => (r = (r * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let y = 0; y < H; y++) { const c = y < GY ? mix(S.a, S.b, y / GY) : mix(S.g, "#0a0a12", (y - GY) / 34); for (let x = 0; x < W; x++) bg[y * W + x] = c; }
  const city = rgb(S.city), win = rgb(S.win);
  for (let x = -8; x < W;) {
    const bw = 16 + (R() * 28 | 0), h = S.bricks ? 128 : 26 + (R() * 58 | 0), bt = GY - h;
    for (let y = Math.max(0, bt); y < GY; y++) for (let i = 0; i < bw - (S.bricks ? 3 : 0); i++) { if (x + i >= 0 && x + i < W) bg[y * W + x + i] = city; }
    for (let wy = Math.max(2, bt + 4); wy < GY - 5; wy += 7) for (let wx = x + 3; wx < x + bw - 5; wx += 6) if (!S.bricks && R() < 0.42) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (wx + a >= 0 && wx + a < W) bg[(wy + b) * W + wx + a] = win;
    x += bw + (S.bricks ? 8 : R() * 5 | 0);
  }
  if (S.crack) { let x = W / 2, c = rgb("#ff5fd2"), g = rgb("#ffd6f4"); for (let y = 6; y < 112; y++) { x += (R() * 7 | 0) - 3; const w = 1 + Math.round(Math.sin((y / 112) * Math.PI) * 7); for (let i = -w - 2; i <= w + 2; i++) if (y * W + x + i >= 0) bg[y * W + x + i] = Math.abs(i) <= w * 0.45 ? g : Math.abs(i) <= w ? c : mix("#ff5fd2", S.b, 0.65); } }
  for (let x = 0; x < W; x++) { bg[GY * W + x] = mix(S.g, "#ffffff", 0.2); if (x % 26 === 0) for (let y = GY + 8; y < GY + 10; y++) for (let i = 0; i < 12; i++) if (x + i < W) bg[y * W + x + i] = mix(S.g, "#ffffff", 0.08); }
}
function ambient(name) { amb = []; const mod = REG[AMBIENT[name]]; if (!mod) return; amb.push({ mod, name, fx: createFx(mod, { x: W / 2, y: name === "portal" ? 92 : H - 14 }) }); }
let weather = 'normal', sceneKey = '', outdoor = false;
const weatherColors = new Map();
const weatherPixel = (x,y,c) => { if (!weatherColors.has(c)) weatherColors.set(c,rgb(c)); bg[y*W+x]=weatherColors.get(c); };
export function setScene(k, seed = 7, climate = 'normal') {
 const key = k + ':' + climate;
 if (key === sceneKey) return;
 sceneKey = key; scene = k; weather = WEATHER[climate] ? climate : 'normal';
 outdoor = ['home','city','street'].includes(k);
 paint(k, seed); ambient(outdoor ? WEATHER[weather].amb || '' : SCENES[k].amb);
 if (overlay) overlay.dataset.weather = outdoor ? WEATHER[weather].label : '';
}
// Every art set gets its palette converted once here, never per frame.
const withColors = (art) => ({ ...art, colors: Object.fromEntries(Object.entries(art.palette).map(([k, v]) => [k, rgb(v)])) });
let heroArt = withColors(makeHeroArt());
let heroArtKey = "";
const FOE_MAP = new Map();
const foeMap = (c) => { if (!FOE_MAP.has(c)) FOE_MAP.set(c, { m: rgb(c), e: rgb(PAL.e), w: rgb(PAL.w) }); return FOE_MAP.get(c); };
let shadowAura = null;
let heroClass = null;
export const setHero = (c, isKid, ageM = 0, career = null, classId = null) => {
  hero = c; small = isKid;
  heroClass = classId;
  if (classId === "shade" && !isKid) { if (!shadowAura) shadowAura = createFx(shadowFlames, {x: PX, y: GY, seed: 12}); } else shadowAura = null;
  const key = `${ageM}:${career}:${c}:${classId}`;
  if (key !== heroArtKey) { heroArtKey = key; heroArt = withColors(classId === "shade" && !isKid ? SHADE_ART : makeHeroArt(ageM, career, c)); }
};
function sprite(a, x, y, map, sc = 1, flash = 0, flip = false) { const h = a.length * sc, w = a[0].length; for (let j = 0; j < a.length; j++) for (let i = 0; i < w; i++) { const ch = a[j][flip ? w - 1 - i : i]; if (ch === ".") continue; const c = flash > 0 ? 0xffffffff : map[ch]; for (let p = 0; p < sc; p++) for (let q = 0; q < sc; q++) pix(Math.round(x - (w * sc) / 2) + i * sc + p, y - h + j * sc + q, c); } }
function spawn(name, x, y, o = {}) { const mod = REG[name]; if (!mod) return; fxs.push({ fx: createFx(mod, { x, y, seed: (Math.random() * 9999) | 0, ...o }), dur: Math.min(mod.meta?.duration ?? 1, 2.2) }); }
export function float(txt, x, cls = "") { if (!overlay) return; const d = document.createElement("div"); d.className = "float " + cls; d.textContent = txt; d.style.left = (x / W) * 100 + "%"; d.style.top = "44%"; overlay.append(d); setTimeout(() => d.remove(), 1000); }
let foeClear = 0;
function playFight(r) {
  const R = r.rounds.length > 9 ? [...r.rounds.slice(0, 6), ...r.rounds.slice(-3)] : r.rounds;
  clearTimeout(foeClear); foe = { boss: r.foe.boss, c: ELEMENTS[r.foe.el]?.c || "#b06060", x: EX, a: 1, kick: 0, flash: 0 }; stage.busy = true;
  seq = { R, i: 0, wait: 0.2, wfx: r.wfx, r };
}
function stepSeq(dt) {
  seq.wait -= dt; if (seq.wait > 0) return;
  if (seq.i >= seq.R.length) { if (seq.r.win) foe.a = 0; float(seq.r.win ? "ชนะ" : "พ่าย", W / 2, seq.r.win ? "good" : "bad"); if (seq.r.win) spawn("spawn/poof", EX, GY); seq = null; stage.busy = false; foeClear = setTimeout(() => (foe = null), 500); return; }
  const x = seq.R[seq.i++], you = x.who === "p", tx = you ? EX : PX;
  seq.wait = 0.4;
  if (x.heal) { spawn("holy/heal-aoe", PX, GY); float("+" + x.heal, PX, "good"); return; }
  if (you) heroX = 16; else foe.x = EX - 16;
  if (x.miss) { float("พลาด", tx); return; }
  stop = x.crit ? 0.13 : 0.06; shake = x.crit ? 4 : 2;
  const fx = you ? (heroClass === "shade" ? "shadow/dark-explosion" : x.el ? ELEMENTS[x.el].fx[seq.i % 3] : seq.wfx) : "melee/claw-swipe";
  spawn(fx, tx, GY, { flip: !you }); if (x.crit) spawn("impacts/crit-hit", tx, GY - 18);
  if (you) { foe.flash = 0.1; foe.kick = 7; } else { heroFlash = 0.1; heroX = -7; }
  float((x.crit ? "!" : "") + x.dmg, tx, x.crit ? "crit" : you ? "" : "bad"); if (x.sk) float(x.sk, W / 2, "sk");
}
export function trigger(ev) {
  const n = ev.n;
  if (n === "fight") return playFight(ev.a);
  if (n === "minor") { if (performance.now() - lastMinor < 500) return; lastMinor = performance.now(); return spawn(ev.a.win ? "impacts/hit-spark" : "impacts/blunt-hit", EX - 30, GY - 14); }
  const L = PRESET[n]; if (!L) return;
  L.forEach((name, i) => spawn(name, PX + i * 40, n === "event" ? GY - 34 : GY)); if (n === "surge" || n === "break") shake = 5;
}
export const skip = () => { if (seq) { seq.i = seq.R.length; seq.wait = 0; } };
// The next frame is booked first, so one bad frame can never leave the stage black for the rest of the session.
function frameLoop(now) {
  requestAnimationFrame(frameLoop);
  try { drawFrame(now); } catch (e) { if (!drawFrame.warned) { drawFrame.warned = 1; console.error("stage frame", e); } }
}
function drawFrame(now) {
  const real = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; let dt = real * stage.speed; t += real;
  if (stop > 0) { stop -= real; dt = 0; }
  if (dt > 0) { if (seq) stepSeq(dt); for (const a of amb) { a.fx.update(dt); if (!a.mod.meta?.loop && a.fx.t > (a.mod.meta?.duration ?? 2)) a.fx = createFx(a.mod, a.fx.options); else if (a.mod.meta?.loop && a.fx.t > 600) a.fx = createFx(a.mod, a.fx.options); } for (const f of fxs) f.fx.update(dt); fxs = fxs.filter((f) => f.fx.t < f.dur); heroX *= 0.82; if (foe) { foe.x += (EX - foe.x) * 0.18; foe.kick *= 0.82; foe.flash -= dt; } heroFlash -= dt; }
  // Clouds drift 1-2 px a second, so the outdoor backdrop is repainted twice a second, not every frame.
  if (outdoor) { const step = Math.floor(t * 2); if (step !== drawFrame.sky || sceneKey !== drawFrame.key) { drawFrame.sky = step; drawFrame.key = sceneKey; drawWeather(weatherPixel, W, H, GY, weather, t); } }
  if (shadowAura) { shadowAura.update(dt); shadowAura.options.x = PX + Math.round(heroX); }
  clearFrame(frame);
  for (const a of amb) a.fx.draw(frame, "back"); for (const f of fxs) f.fx.draw(frame, "back");
  if (shadowAura) { shadowAura.draw(frame, "back"); }
  const raster = heroClass === 'shade' && !small ? HERO_RASTER.shade : heroArt.preclass ? HERO_RASTER.child : null;
  if (raster) {
    const height = raster.height - (Math.sin(t * 2) > .6 ? 1 : 0);
    const left = Math.round(PX + heroX - raster.width / 2);
    for (let y=0;y<height;y++) for(let x=0;x<raster.width;x++) {
      const color=raster.pixels[Math.min(raster.height-1,Math.floor(y*raster.height/height))*raster.width+x];
      if(color) pix(left+x,GY-height+y,heroFlash>0?0xffffffff:color);
    }
  } else sprite(heroArt.rows, PX + Math.round(heroX), GY, heroArt.colors, 1, heroFlash);
  if (foe && foe.a > 0) sprite(foe.boss ? SPR.boss : SPR.beast, Math.round(foe.x + foe.kick), GY, foeMap(foe.c), foe.boss ? 3 : 2, foe.flash, true);
  for (const f of fxs) f.fx.draw(frame, "front"); for (const a of amb) if (a.name === "rain") a.fx.draw(frame, "front");
  if (outdoor) drawWeather((x,y,c) => { if (!weatherColors.has(c)) weatherColors.set(c,rgb(c)); pix(x,y,weatherColors.get(c)); },W,H,GY,weather,t,true);
  composite(frame, img.data, bg);
  let sx = 0, sy = 0; if (shake > 0.2) { sx = Math.round((Math.random() - 0.5) * shake * 2); sy = Math.round((Math.random() - 0.5) * shake); shake *= 0.85; }
  ctx.putImageData(img, sx, sy);
}
export function initStage(canvas, ov) { canvas.width = W; canvas.height = H; ctx = canvas.getContext("2d"); frame = createFrame(W, H); img = new ImageData(W, H); bg = new Uint32Array(W * H); overlay = ov; setScene("home"); requestAnimationFrame(frameLoop); }
