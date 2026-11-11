// A gate that breaks: the open tear swells and shudders while fractures spider out across the air, then it bursts:
// a white flash, a shock ring on the floor, glassy shards that tumble and bounce, violet smoke boiling up, and the
// scars in the air dimming last.
import { Particles, Bits, B, Lights, P, Rng, fit, clamp, ease, seg, noise, band, TAU, WHITE, hex } from "../../../vendor/pixelfx/src/core/index.js";

export const meta = {
  name: "Gate break",
  desc: "An open gate swells and fractures, then bursts: white flash, shock ring, tumbling shards, violet smoke, scars in the air that fade.",
  tags: ["rift", "gate", "portal", "break", "explosion", "dungeon", "one-shot", "ground"],
  size: [220, 176],
  origin: [110, 140],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0b0716", "#1d1238", "#3b2276", "#6c3fc8", "#a37cf2", "#dccbff", "#ffffff"], seed: 5, height: 76, width: 15 },
};

const BURST = 0.55;
const VOID = hex("#06040c");

function cull(ps, x0, y0, x1, y1) {
  const L = ps.list;
  for (let i = L.length - 1; i >= 0; i--) if (L[i].x < x0 || L[i].x > x1 || L[i].y < y0 || L[i].y > y1) L.splice(i, 1);
}

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), H = o.height, W = o.width;
  const TOP = -H - 6, BOT = -6, MID = (TOP + BOT) / 2, HALF = (BOT - TOP) / 2;
  const floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [WHITE, C[5], C[4], C[3]], haze: C[2] });
  const bits = new Bits({ ground: floor });
  const lights = new Lights();
  const kinks = [];
  for (let y = TOP; y <= BOT + 4; y += R.range(6, 10)) kinks.push([y, R.range(-2, 2) * (0.4 + 0.6 * (1 - Math.abs(y - MID) / HALF))]);
  const spine = (y) => {
    for (let i = 1; i < kinks.length; i++) {
      if (y <= kinks[i][0]) {
        const [y0, x0] = kinks[i - 1], [y1, x1] = kinks[i];
        return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1);
      }
    }
    return kinks[kinks.length - 1][1];
  };
  // fractures: jagged lines running out from points on the rim, each a few segments long
  // fractures: straight, angular cracks like broken glass, each kinking sharply one way then the other
  const fractures = Array.from({ length: 10 }, (_, i) => {
    const s = i % 2 ? 1 : -1, y = MID + R.range(-0.85, 0.85) * HALF, pts = [], base = R.range(-0.6, 0.6);
    let x = 0, yy = 0;
    for (let j = 0, n = R.int(3, 5); j < n; j++) {
      const a = base + (j % 2 ? 1 : -1) * R.range(0.25, 0.6), L = R.range(2.5, 5.5);
      x += Math.cos(a) * L;
      yy += Math.sin(a) * L;
      pts.push([x, yy]);
    }
    return { s, y, pts, t0: R.range(0, BURST * 0.6) };
  });
  let t = 0, burst = false;

  const half = (y, k, side) => {
    const v = (y - MID) / HALF;
    if (Math.abs(v) >= 1) return 0;
    const shake = t < BURST ? 0.1 * Math.sin(t * 60 + y) * (t / BURST) : 0;
    const rag = 1 + 0.16 * (noise(y * 0.13 + side * 17, 3.1) - 0.5) * 2 + shake;
    return W * Math.pow(1 - v * v, 0.7) * rag * k;
  };
  const rimAt = (f, k) => spine(f.y) + f.s * half(f.y, k, f.s);

  return {
    update(dt) {
      t += dt;
      // before the burst: sparks spitting off the rim, faster and faster
      if (t < BURST && R.chance((10 + 50 * (t / BURST)) * dt)) {
        const y = MID + R.range(-HALF, HALF) * 0.8, s = R.sign();
        ps.spawn(P.SPARK, spine(y) + s * half(y, 1, s), y, s * R.range(30, 120), R.range(-120, 0), R.range(0.15, 0.35));
      }
      if (!burst && t >= BURST) {
        burst = true;
        lights.add(0, MID, 80, C[4], 1, 0.7);
        lights.add(0, MID, 34, WHITE, 1, 0.12);
        lights.add(0, -2, 34, C[3], 0.7, 1.2);
        // shards of the gate itself, tumbling out and bouncing on the floor
        for (let i = 0; i < 34; i++) {
          const y = MID + R.range(-HALF, HALF) * 0.9, s = R.sign(), sp = R.range(110, 260);
          bits.add({ kind: R.chance(0.75) ? B.SHARD : B.CHUNK, x: spine(y), y, vx: s * sp, vy: R.range(-240, -20), a: R.range(0, TAU),
            va: R.range(-16, 16), s: R.range(1.5, 4), c: R.pick([C[3], C[4], C[5], C[2]]), g: 800, drag: 0.3, bounce: 0.35, life: R.range(0.8, 1.5) });
        }
        for (let i = 0; i < 46; i++) {
          const a = R.range(0, TAU), sp = R.range(90, 300);
          ps.spawn(P.SPARK, spine(MID), MID + R.range(-HALF, HALF) * 0.6, Math.cos(a) * sp, Math.sin(a) * sp * 0.8 - 60, R.range(0.3, 0.8));
        }
        // violet smoke boiling out of where it stood, dust kicked along the floor
        for (let i = 0; i < 12; i++) {
          const y = MID + R.range(-HALF, HALF) * 0.7;
          ps.spawn(P.SMOKE, spine(y) + R.range(-6, 6), y, R.range(-30, 30), R.range(-40, -5), R.range(1.4, 2.4), C[2], R.range(5, 9), R.range(0, 0.25));
        }
        for (let i = 0; i < 14; i++) {
          const s = R.sign();
          ps.spawn(P.DUST, s * R.range(2, 10), -1, s * R.range(60, 160), -R.range(4, 18), R.range(0.7, 1.3), C[1], R.range(2.5, 4.5), R.range(0, 0.1));
        }
        for (let i = 0; i < 16; i++) {
          ps.spawn(P.EMBER, spine(MID) + R.range(-10, 10), MID + R.range(-HALF, HALF) * 0.6, R.range(-20, 20), R.range(-40, -10), R.range(1, 2), R.pick([C[5], C[4]]));
        }
      }
      ps.update(dt);
      cull(ps, -meta.origin[0] + 4, -meta.origin[1] + 4, meta.size[0] - meta.origin[0] - 4, 6);
      bits.update(dt);
      lights.update(dt);
    },

    drawBack(p) {
      // the shock ring: the far half behind
      const q = (t - BURST) / 0.6;
      if (q > 0 && q < 1) band(p, 0, 0, 6 + 80 * ease.outCubic(q), 0.16, 2, 1 - q, [C[3], C[4], C[5], WHITE], (g) => Math.sin(g) < 0, 0.5);
      ps.draw(p, "back");
    },

    draw(p) {
      const swell = t < BURST ? 1 + 0.25 * ease.inQuad(t / BURST) : 0;
      if (t < BURST) {
        // the gate, swelling and shuddering, its rim burning hotter
        p.shade(-W * 1.4 - 6, TOP - 2, W * 1.4 + 6, BOT + 2, (x, y, out) => {
          const c = spine(y), dx = x - c, hw = half(y, swell, dx < 0 ? -1 : 1);
          if (hw < 0.6) return;
          const e = Math.abs(dx) - hw;
          if (e > 1.2) return;
          if (e > 0.2) { out.c = C[4]; out.a = 0.7; out.k = 0.3; return; }
          if (e > -1) { out.c = noise(y * 0.7, t * 14) > 0.3 ? WHITE : C[5]; out.k = 0.4 + 0.4 * (t / BURST); return; }
          const d = clamp(-e / Math.max(1, hw)), st = Math.pow(1 - d, 2) + 0.15 * (t / BURST);
          out.c = st > 0.62 ? C[4] : st > 0.38 ? C[3] : st > 0.2 ? C[2] : st > 0.09 ? C[1] : VOID;
        });
        p.glow(0, MID, 40, C[3], 0.3 + 0.4 * (t / BURST));
      }
      // the white hero frame of the burst
      if (t >= BURST && t < BURST + 0.08) {
        p.shade(-W * 1.4 - 6, TOP - 2, W * 1.4 + 6, BOT + 2, (x, y, out) => {
          if (Math.abs(x - spine(y)) < half(y, 1.35, 1) + 2) out.c = WHITE;
        });
      }
      // fractures in the air: growing before the burst, glowing at it, dimming scars after
      for (const f of fractures) {
        const grow = clamp((t - f.t0) / 0.3);
        if (grow <= 0) continue;
        const fade = t < BURST ? 1 : 1 - seg(t, BURST + 0.15, BURST + 0.9);
        if (fade <= 0) continue;
        const ox = rimAt(f, t < BURST ? swell : 1.25), n = Math.ceil(grow * f.pts.length);
        let px = ox, py = f.y;
        for (let j = 0; j < n; j++) {
          const nx = ox + f.s * Math.abs(f.pts[j][0]), ny = f.y + f.pts[j][1];
          const hot = t >= BURST && t < BURST + 0.25;
          p.line(px, py, nx, ny, hot || j < 2 ? WHITE : C[4], fade);
          p.glowLine(px, py, nx, ny, 2, C[4], 0.35 * fade);
          px = nx;
          py = ny;
        }
      }
      // the shock ring: the near half in front
      const q = (t - BURST) / 0.6;
      if (q > 0 && q < 1) band(p, 0, 0, 6 + 80 * ease.outCubic(q), 0.16, 2, 1 - q, [C[3], C[4], C[5], WHITE], (g) => Math.sin(g) >= 0, 0.5);
      bits.draw(p);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}
