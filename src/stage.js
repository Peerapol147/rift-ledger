import { professionArt } from "./profession-art.js";
import { civilianArt } from "./civilian-art.js";
import { HERO_RASTER } from "./hero-raster.js";
import { idleRows, idlePose, civilianIdleRows } from "./hero-idle.js";
import { SHADE_ART } from "./shade-art.js";
import * as shadowFlames from "../../pixelfx-main/src/fx/shadow/shadow-flames.js";
import { WEATHER, drawWeather } from "./weather-art.js";
import { makeHeroArt, heightAt } from "./hero-art.js";
import { placeLayers, LW } from "./place-art.js";
import { monsterRaster } from "./monster-art.js";
// Pixel stage: own backdrop and sprites, pixelfx for all effects. Acting follows pixelfx: wind-up, freeze on contact, target rocks back.
import { createFrame, clearFrame, createFx, composite } from "../../pixelfx-main/src/core/index.js";
import { REG } from "./fxreg.gen.js";
import { PRESET, AMBIENT, STYLE, LOOK } from "./presets.js";
import { ELEMENTS } from "./data/elements.js";

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
  arena: { a: "#1a0f1f", b: "#7a2a3a", city: "#241526", win: "#ff8a8a", g: "#3a2430", amb: "", bricks: 1 },
};
const SPR = { hero: ["....hhhh....", "...hhhhhh...", "...hssssh...", "...sdssds...", "...ssssss...", "....ssss....", "..cccccccc..", ".cscccccsc..", ".cs.cccc.sc.", ".ss.cccc.ss.", "....dddd....", "....dddd....", "...dd..dd...", "...dd..dd...", "...nn..nn..."], kid: ["........nnn.........","......nnhhhnn.......",".....nhhhhHhhn......","....nhHHhhhhhhhn....","....nhhhhhhhhhhn....","...nhhhhsSSshhhn....","....nhhssSSSshn.....","....nsssnSsnssn.....",".....nsSSSSSsn......","......nssSssn.......",".......nssnn........",".....nncttcann......","....ncCcttcacn......","...ncCCcttcacn......","...ncCcntncabn......","...nssnctncbbn......","...nSsnccncbbn......","....nnnccnnnn.......","......nddDdn........","......nddDdn........","......ndnndn........",".....nddnnddn.......",".....nwwnnwwn.......",".....nnnnnnnn......."],
  beast: ["..m.......m.......", "..mm.....mm.......", "..mmmmmmmmm.......", ".mmemmmmemmm......", ".mmmmmmmmmmmmmmm..", ".mmwmwmwmmmmmmmmm.", "..mmmmmmmmmmmmmmmm", "...mmmmmmmmmmmmmmm", "...mmm.mmm..mmm.mm", "...mm...mm...mm..m", "...mm...mm...mm..."],
  boss: ["....m........m....", "....mm......mm....", "...mmmmmmmmmmmm...", "..mmmemmmmmmemmm..", "..mmmmmmmmmmmmmm..", "..mwmwmwmwmwmwmm..", "...mmmmmmmmmmmm...", ".mmmmmmmmmmmmmmmm.", "mm.mmmmmmmmmmmm.mm", "mm.mmmmmmmmmmmm.mm", "m..mmmmmmmmmmmm..m", "...mmmm....mmmm...", "...mmm......mmm...", "..mmmm......mmmm.."] };
// Original childhood sprite: chunky outline, teal jacket and satchel.
const KID_PAL = {"n":"#202333","h":"#493642","H":"#73505a","s":"#dda17f","S":"#ffd0a3","c":"#277d83","C":"#52b3ac","t":"#f3dfb3","a":"#bf854d","b":"#835638","d":"#34455f","D":"#526c87","w":"#eee4cf"};
const PAL = { h: "#2a2233", s: "#f0c8a0", d: "#39445c", n: "#1a1d28", e: "#ffe76a", w: "#f4f4f4" };

let frame, img, bg, ctx, overlay, fxs = [], amb = [], scene = "", t = 0, shake = 0, stop = 0, last = 0, hero = "#ff9a6a", small = false, foe = null, seq = null, heroX = 0, heroFlash = 0, lastMinor = 0;
export const stage = { busy: false, speed: 1, renderDisabled: false, calm: false };
const jolt = (v) => (shake = Math.min(1, shake + v));
const pix = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) frame.color[y * W + x] = c; };
function paint(k, seed) {
  const S = SCENES[k]; let r = seed;
  const R = () => (r = (r * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let y = 0; y < H; y++) { const c = y < GY ? mix(S.a, S.b, y / GY) : mix(S.g, "#0a0a12", (y - GY) / 34); for (let x = 0; x < W; x++) base[y * W + x] = c; }
  const city = rgb(S.city), win = rgb(S.win);
  for (let x = -8; x < W;) {
    const bw = 16 + (R() * 28 | 0), h = S.bricks ? 128 : 26 + (R() * 58 | 0), bt = GY - h;
    for (let y = Math.max(0, bt); y < GY; y++) for (let i = 0; i < bw - (S.bricks ? 3 : 0); i++) { if (x + i >= 0 && x + i < W) base[y * W + x + i] = city; }
    for (let wy = Math.max(2, bt + 4); wy < GY - 5; wy += 7) for (let wx = x + 3; wx < x + bw - 5; wx += 6) if (!S.bricks && R() < 0.42) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (wx + a >= 0 && wx + a < W) base[(wy + b) * W + wx + a] = win;
    x += bw + (S.bricks ? 8 : R() * 5 | 0);
  }
  if (S.crack) { let x = W / 2, c = rgb("#ff5fd2"), g = rgb("#ffd6f4"); for (let y = 6; y < 112; y++) { x += (R() * 7 | 0) - 3; const w = 1 + Math.round(Math.sin((y / 112) * Math.PI) * 7); for (let i = -w - 2; i <= w + 2; i++) if (y * W + x + i >= 0) base[y * W + x + i] = Math.abs(i) <= w * 0.45 ? g : Math.abs(i) <= w ? c : mix("#ff5fd2", S.b, 0.65); } }
  for (let x = 0; x < W; x++) { base[GY * W + x] = mix(S.g, "#ffffff", 0.2); if (x % 26 === 0) for (let y = GY + 8; y < GY + 10; y++) for (let i = 0; i < 12; i++) if (x + i < W) base[y * W + x + i] = mix(S.g, "#ffffff", 0.08); }
}
function ambient(name) { amb = []; const mod = REG[AMBIENT[name]]; if (!mod) return; amb.push({ mod, name, fx: createFx(mod, { x: W / 2, y: name === "portal" ? 92 : H - 14 }) }); }
let weather = 'normal', sceneKey = '', outdoor = false;
const weatherColors = new Map();
const weatherPixel = (x,y,c) => { if (!weatherColors.has(c)) weatherColors.set(c,rgb(c)); base[y*W+x]=weatherColors.get(c); };
// Depth: place-art.js adds layers over the old backdrop. `place` picks a hunting ground's own art, otherwise the scene's.
// Moving to another place plays a trip: the old layers scroll off at different speeds, the picture dips dark, the new place scrolls in.
let base, layers = [], layerKey = '', cam = 0, trip = null;
const TRIP = 1.3, REACH = 170;
function applyScene(k, seed, climate, place) {
 sceneKey = k + ':' + climate + ':' + (place || ''); scene = k; weather = WEATHER[climate] ? climate : 'normal';
 outdoor = ['home','city','street'].includes(k);
 paint(k, seed); ambient(outdoor ? WEATHER[weather].amb || '' : SCENES[k].amb);
 layerKey = place || k; layers = placeLayers(layerKey) || placeLayers(k) || [];
 if (overlay) overlay.dataset.weather = outdoor ? WEATHER[weather].label : '';
}
export function setScene(k, seed = 7, climate = 'normal', place = null, label = '') {
 const key = k + ':' + climate + ':' + (place || ''), args = [k, seed, climate, place];
 if (trip && !trip.done) { trip.key = key; trip.args = args; trip.label = label; return; }
 if (key === sceneKey) return;
 if (sceneKey && (place || k) !== layerKey && !seq) { trip = { t: 0, key, args, label, done: false }; return; }
 applyScene(...args);
}
function endTrip() { if (!trip) return; if (!trip.done) applyScene(...trip.args); trip = null; cam = 0; }
function stepTrip(dt) {
 trip.t += dt; const u = trip.t / (TRIP / 2);
 if (!trip.done && u >= 1) { applyScene(...trip.args); trip.done = true; if (trip.label) float(trip.label, W / 2, "sk"); }
 if (u >= 2) return endTrip();
 cam = u < 1 ? REACH * u * u : -REACH * (2 - u) * (2 - u);
}
const dim = (c) => ((c & 0xff000000) | (((c >>> 1) & 0x7f7f7f) + ((c >>> 2) & 0x3f3f3f))) >>> 0;
function blit(l, dst) { const off = ((Math.round(cam * l.k) % LW) + LW) % LW, B = l.buf; for (let y = l.y0; y <= l.y1; y++) { const r = y * LW, d = y * W; for (let x = 0; x < W; x++) { const c = B[r + ((x + off) & (LW - 1))]; if (c) dst[d + x] = c; } } }
// The old backdrop is the farthest plane: sky drifts slowly, the floor moves with the feet.
function backdrop() {
 const s0 = ((Math.round(cam * 0.12) % W) + W) % W, s1 = ((Math.round(cam) % W) + W) % W;
 if (!s0 && !s1) bg.set(base); else for (let y = 0; y < H; y++) { const sh = y < GY ? s0 : s1, r = y * W; bg.set(base.subarray(r + sh, r + W), r); if (sh) bg.set(base.subarray(r, r + sh), r + W - sh); }
 for (const l of layers) if (!l.front) blit(l, bg);
}
// Soft contact shadow so bodies sit on the floor instead of floating over it.
function shadow(cx, half) { for (let j = 0; j < 3; j++) { const w = Math.round(half * (j === 1 ? 1 : 0.7)); for (let i = -w; i <= w; i++) { const x = cx + i; if (x >= 0 && x < W) bg[(GY + 1 + j) * W + x] = dim(bg[(GY + 1 + j) * W + x]); } } }
// Every art set gets its palette converted once here, never per frame.
const withColors = (art) => ({ ...art, colors: Object.fromEntries(Object.entries(art.palette).map(([k, v]) => [k, rgb(v)])) });
let heroArt = withColors(makeHeroArt());
let heroArtKey = "";
const FOE_MAP = new Map();
const foeMap = (c) => { if (!FOE_MAP.has(c)) FOE_MAP.set(c, { m: rgb(c), e: rgb(PAL.e), w: rgb(PAL.w) }); return FOE_MAP.get(c); };
let shadowAura = null;
let heroClass = null, heroH = 56, heroLook = null, pend = [];
const CANE = rgb("#7a5a3a");
let civilianRaster = civilianArt();
let professionRaster = null;
export const setHero = (c, isKid, ageM = 0, career = null, classId = null) => {
  hero = c; small = isKid;
  heroClass = classId; heroH = heightAt(ageM); heroLook = isKid ? null : STYLE[LOOK[classId] || LOOK[career]] || null;
  civilianRaster = civilianArt(ageM, career, classId);
  const art = classId === "shade" && !isKid ? HERO_RASTER.shade : professionArt(career, classId);
  professionRaster = art ? { ...art, drawH: heroH } : null;
  if (classId === "shade" && !isKid) { if (!shadowAura) shadowAura = createFx(shadowFlames, {x: PX, y: GY, seed: 12}); } else shadowAura = null;
  const key = `${ageM}:${career}:${c}:${classId}`;
  if (key !== heroArtKey) { heroArtKey = key; heroArt = withColors(classId === "shade" && !isKid ? SHADE_ART : makeHeroArt(ageM, career, c)); }
};
// Grid art drawn to a target pixel height (nearest neighbour), so grid heroes stand as tall as their age.
function scaledSprite(a, x, y, map, h, flash = 0) { const sc = h / a.length, w = a[0].length, ww = Math.round(w * sc), x0 = Math.round(x - ww / 2); for (let j = 0; j < h; j++) { const row = a[Math.min(a.length - 1, Math.floor(j / sc))]; for (let i = 0; i < ww; i++) { const ch = row[Math.min(w - 1, Math.floor(i / sc))]; if (ch === ".") continue; pix(x0 + i, y - h + j, flash > 0 ? 0xffffffff : map[ch]); } } }
function sprite(a, x, y, map, sc = 1, flash = 0, flip = false) { const h = a.length * sc, w = a[0].length; for (let j = 0; j < a.length; j++) for (let i = 0; i < w; i++) { const ch = a[j][flip ? w - 1 - i : i]; if (ch === ".") continue; const c = flash > 0 ? 0xffffffff : map[ch]; for (let p = 0; p < sc; p++) for (let q = 0; q < sc; q++) pix(Math.round(x - (w * sc) / 2) + i * sc + p, y - h + j * sc + q, c); } }
function spawn(name, x, y, o = {}, dur) { const mod = REG[name]; if (!mod) return null; const f = { fx: createFx(mod, { x, y, seed: (Math.random() * 9999) | 0, ...o }), dur: dur ?? Math.min(mod.meta?.duration ?? 1, 2.2) }; fxs.push(f); return f; }
const later = (t, name, x, y) => name && pend.push({ t, name, x, y });
// Hero strike shaped by the profession sprite (presets.js STYLE): the weapon's own motion first, then the element fx (skill) or the style hit.
function strike(st, end, skill) {
  if (skill && st.cast) spawn(st.cast, PX + 4, GY, {}, 1.2);
  if (st.go) { const f = spawn(st.go, PX + 16, GY - 22, {}, 0.22); if (f) f.vx = (EX - PX - 16) / 0.22; return later(0.22, end, EX, GY); }
  if (st.from) { spawn(st.from, PX + 6, GY, { reach: EX - PX - 6 }); return later(0.25, end, EX, GY); }
  spawn(end, EX, GY);
}
export function float(txt, x, cls = "") { if (!overlay) return; const d = document.createElement("div"); d.className = "float " + cls; d.textContent = txt; d.style.left = (x / W) * 100 + "%"; d.style.top = "44%"; overlay.append(d); setTimeout(() => d.remove(), 1000); }
let foeClear = 0;
function playFight(r) {
  if (stage.renderDisabled) return;
  const R = r.rounds.length > 9 ? [...r.rounds.slice(0, 6), ...r.rounds.slice(-3)] : r.rounds;
  // How much of the foe is left after each round, worked out before long fights are cut down for the stage.
  let left = r.foe.hp || 0; for (const x of r.rounds) { if (x.who === "p" && x.dmg) left -= x.dmg; x.fl = r.foe.hp ? Math.max(0, left / r.foe.hp) : null; }
  endTrip(); clearTimeout(foeClear); foe = { name: r.foe.n, boss: r.foe.boss, c: ELEMENTS[r.foe.el]?.c || "#b06060", x: W + 26, a: 1, kick: 0, flash: 0, die: 0 }; stage.busy = true;
  if (r.foe.boss) jolt(0.45); plate(r.foe);
  seq = { R, i: 0, wait: 0.35, wfx: r.wfx, r };
}
// Name, level and what is left of the foe, as DOM over the canvas so Thai text stays crisp.
function plate(f) {
  if (!overlay) return; let p = overlay.querySelector(".foeplate"); if (!f) { p?.remove(); return; }
  if (!p) { p = document.createElement("div"); overlay.append(p); } p.className = "foeplate" + (f.boss ? " boss" : "");
  p.innerHTML = `<small>${f.boss ? "บอส · " : ""}Lv.${f.lv || "?"}${ELEMENTS[f.el] ? " · ธาตุ" + ELEMENTS[f.el].n : ""}</small><b></b><div class="fbar"><i style="width:100%"></i></div>`; p.querySelector("b").textContent = f.n || "";
}
const plateHp = (v) => { const i = overlay?.querySelector(".foeplate .fbar i"); if (i) i.style.width = Math.round(v * 100) + "%"; };
// A monthly hunt is over in a blink, but the thing you hunted still walks in, takes the hit and falls apart.
function playMinor(r) { if (seq || trip || !r.foe?.n) return; clearTimeout(foeClear); plate(null); foe = { name: r.foe.n, boss: r.foe.boss, c: "#b06060", x: W + 26, a: 1, kick: 0, flash: 0, die: 0, m: { t: 0, win: r.win } }; }
function stepMinor(dt) {
  const m = foe.m; m.t += dt;
  if (!m.hit && m.t > 0.22) { m.hit = 1; if (m.win) { heroX = 12; foe.flash = 0.1; foe.kick = 7; spawn(heroLook?.hit || "impacts/hit-spark", EX, GY); } else { foe.x = EX - 14; heroFlash = 0.1; heroX = -6; spawn("melee/claw-swipe", PX, GY, { flip: true }); } }
  if (m.win && m.t > 0.42 && !foe.die) foe.die = 0.01;
  if (m.t > 0.95) foe = null;
}
function stepSeq(dt) {
  seq.wait -= dt; if (seq.wait > 0) return;
  if (seq.i >= seq.R.length) { if (seq.r.win) { foe.die = 0.01; foe.flash = 0.08; plateHp(0); } float(seq.r.win ? "ชนะ" : "พ่าย", W / 2, seq.r.win ? "good" : "bad"); if (seq.r.win) spawn("spawn/poof", EX, GY); seq = null; stage.busy = false; foeClear = setTimeout(() => { if (seq) return; plate(null); if (!foe?.m) foe = null; }, 700); return; }
  const x = seq.R[seq.i++], you = x.who === "p", tx = you ? EX : PX;
  seq.wait = 0.4; if (you && x.fl != null && !x.miss) plateHp(x.fl);
  if (x.heal) { spawn("holy/heal-aoe", PX, GY); float("+" + x.heal, PX, "good"); return; }
  if (you) heroX = 16; else foe.x = EX - 16;
  if (x.miss) { float("พลาด", tx); return; }
  stop = x.crit ? 0.13 : 0.06; jolt(x.crit ? 0.55 : 0.3);
  if (you && heroLook && heroClass !== "shade") strike(heroLook, x.el ? ELEMENTS[x.el].fx[seq.i % 3] : heroLook.hit, !!x.el);
  else spawn(you ? (heroClass === "shade" ? "shadow/dark-explosion" : x.el ? ELEMENTS[x.el].fx[seq.i % 3] : seq.wfx) : "melee/claw-swipe", tx, GY, { flip: !you });
  if (x.crit) spawn("impacts/crit-hit", tx, GY - 18);
  if (you) { foe.flash = 0.1; foe.kick = 7; } else { heroFlash = 0.1; heroX = -7; }
  float((x.crit ? "!" : "") + x.dmg, tx, x.crit ? "crit" : you ? "" : "bad"); if (x.sk) float(x.sk, W / 2, "sk");
}
export function trigger(ev) {
  const n = ev.n;
  if (n === "fight") return playFight(ev.a);
  if (n === "minor") { if (performance.now() - lastMinor < 650 || (foe && !foe.m)) return; lastMinor = performance.now(); return playMinor(ev.a); }
  const L = PRESET[n]; if (!L) return;
  L.forEach((name, i) => spawn(name, PX + i * 40, n === "event" ? GY - 34 : GY)); if (n === "surge" || n === "break") jolt(0.7);
}
export const skip = () => { if (seq) { seq.i = seq.R.length; seq.wait = 0; } };
// The next frame is booked first, so one bad frame can never leave the stage black for the rest of the session.
function frameLoop(now) {
  if (stage.renderDisabled) return;
  requestAnimationFrame(frameLoop);
  try { drawFrame(now); } catch (e) {
    if (!drawFrame.warned) { drawFrame.warned = 1; console.error("stage frame", e); }
    stage.renderDisabled = true;
    stage.busy = false;
    seq = null;
    foe = null;
    fxs = [];
    amb = [];
    pend = [];
    try { plate(null); } catch {}
  }
}
function drawFrame(now) {
  const real = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; if (stage.calm) { heroFlash = 0; if (foe) foe.flash = 0; } /* calm mode: no white hit flashes */ let dt = real * stage.speed; t += real;
  if (stop > 0) { stop -= real; dt = 0; }
  if (trip) stepTrip(real);
  if (dt > 0) { if (seq) stepSeq(dt); for (const a of amb) { a.fx.update(dt); if (!a.mod.meta?.loop && a.fx.t > (a.mod.meta?.duration ?? 2)) a.fx = createFx(a.mod, a.fx.options); else if (a.mod.meta?.loop && a.fx.t > 600) a.fx = createFx(a.mod, a.fx.options); } for (const f of fxs) { f.fx.update(dt); if (f.vx) f.fx.options.x += f.vx * dt; } for (const p of pend) if ((p.t -= dt) <= 0) spawn(p.name, p.x, p.y); pend = pend.filter((p) => p.t > 0); fxs = fxs.filter((f) => f.fx.t < f.dur); heroX *= 0.82; if (foe) { foe.x += (EX - foe.x) * 0.18; foe.kick *= 0.82; foe.flash -= dt; if (foe.die) { foe.die += dt * 2.4; if (foe.die >= 1) foe.a = 0; } if (foe.m) stepMinor(dt); } heroFlash -= dt; }
  // Clouds drift 1-2 px a second, so the outdoor backdrop is repainted twice a second, not every frame.
  if (outdoor) { const step = Math.floor(t * 2); if (step !== drawFrame.sky || sceneKey !== drawFrame.key) { drawFrame.sky = step; drawFrame.key = sceneKey; drawWeather(weatherPixel, W, H, GY, weather, t); } }
  const raster = professionRaster || civilianRaster, step = trip && Math.sin(t * 20) > 0 ? 1 : 0;
  backdrop(); shadow(PX + Math.round(heroX), Math.max(5, Math.min(16, Math.round((raster ? raster.width * (raster.drawH || raster.height) / raster.height : heroH * 0.4) * 0.38)))); if (foe && foe.a > 0) shadow(Math.round(foe.x + foe.kick), foe.boss ? 24 : 16);
  if (shadowAura) { shadowAura.update(dt); shadowAura.options.x = PX + Math.round(heroX); }
  clearFrame(frame);
  for (const a of amb) a.fx.draw(frame, "back"); for (const f of fxs) f.fx.draw(frame, "back");
  if (shadowAura) { shadowAura.draw(frame, "back"); }
  if (raster) {
    // drawH sets the body to the height of a real person that age; width follows so a toddler is small, not squashed.
    const full = raster.drawH || raster.height, sx = full / raster.height;
    const height = full - (Math.sin(t * 2) > .6 ? 1 : 0), width = Math.max(1, Math.round(raster.width * sx));
    const left = Math.round(PX + heroX - width / 2);
    for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
      const color=raster.pixels[Math.min(raster.height-1,Math.floor(y*raster.height/height))*raster.width+Math.min(raster.width-1,Math.floor(x/sx))];
      if(color) pix(left+x,GY-height+y-step,heroFlash>0?0xffffffff:color);
    }
    if (raster.cane) for (let y = Math.round(height * 0.45); y < height; y++) pix(left + width + 1, GY - height + y, heroFlash > 0 ? 0xffffffff : CANE);
  } else if (heroArt.preclass) sprite(heroArt.rows, PX + Math.round(heroX), GY - step, heroArt.colors, 1, heroFlash);
  else scaledSprite(heroArt.rows, PX + Math.round(heroX), GY - step, heroArt.colors, heroH, heroFlash);
  if (trip) for (let i = 0; i < 5; i++) { const a = (t * 3 + i * 0.2) % 1; pix(Math.round(PX - 6 - a * 16), GY - 1 - Math.round(a * 4) - (i & 1), a < 0.5 ? 0xffd8d8d8 : 0xff9a9a9a); }
  if (foe && foe.a > 0) {
    const art = monsterRaster(foe.name, foe.boss);
    if (art) {
      // Flyers hover and bob; a beaten foe breaks up pixel by pixel instead of blinking out.
      const height = foe.boss ? 58 : 46, scale = height / art.height, width = Math.round(art.width * scale), left = Math.round(foe.x + foe.kick - width / 2), lift = art.fly ? 7 + Math.round(Math.sin(t * 2.6) * 2) : 0, gone = foe.die || 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const sx = art.width - 1 - Math.min(art.width - 1, Math.floor(x / scale)), sy = Math.min(art.height - 1, Math.floor(y / scale)), c = art.pixels[sy * art.width + sx];
        if (c && (!gone || ((sx * 7 + sy * 13) % 16) / 16 >= gone)) pix(left + x, GY - height + y - lift - Math.round(gone * 6), foe.flash > 0 ? 0xffffffff : c);
      }
    } else sprite(foe.boss ? SPR.boss : SPR.beast, Math.round(foe.x + foe.kick), GY, foeMap(foe.c), foe.boss ? 3 : 2, foe.flash, true);
  }
  for (const f of fxs) f.fx.draw(frame, "front"); for (const a of amb) if (a.name === "rain") a.fx.draw(frame, "front");
  if (outdoor) drawWeather((x,y,c) => { if (!weatherColors.has(c)) weatherColors.set(c,rgb(c)); pix(x,y,weatherColors.get(c)); },W,H,GY,weather,t,true);
  for (const l of layers) if (l.front) blit(l, frame.color);
  composite(frame, img.data, bg);
  // Shake is "trauma" 0..1 that hits add to and time drains. The offset is trauma squared on two sine waves, so small hits barely move,
  // big ones punch, and it always settles; a fresh random offset every frame only buzzes. Calm mode (settings) keeps the picture still.
  let sx = 0, sy = 0; if (shake > 0) { shake = Math.max(0, shake - real * 1.9); const k = stage.calm ? 0 : shake * shake; sx = Math.round(7 * k * Math.sin(t * 61)); sy = Math.round(4 * k * Math.sin(t * 47 + 1.3)); }
  ctx.putImageData(img, sx, sy);
  if (trip) { const u = trip.t / (TRIP / 2), d = Math.max(0, 1 - Math.abs(u - 1) * 2.2); if (d > 0) { ctx.fillStyle = `rgba(6,6,12,${d.toFixed(2)})`; ctx.fillRect(0, 0, W, H); } }
}
export function initStage(canvas, ov) { canvas.width = W; canvas.height = H; ctx = canvas.getContext("2d"); frame = createFrame(W, H); img = new ImageData(W, H); bg = new Uint32Array(W * H); base = new Uint32Array(W * H); overlay = ov; stage.renderDisabled = false; setScene("home"); requestAnimationFrame(frameLoop); }
