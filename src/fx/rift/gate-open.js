// A hunter's gate: a white crack splits the air top to bottom, tears open into a jagged violet wound with a dark
// depth inside, hangs there pulling motes in while its rim crackles, then seals shut with a last spit of sparks.
import { Particles, Bits, B, Lights, P, Rng, fit, clamp, ease, seg, noise, TAU, WHITE, hex } from "../../../vendor/pixelfx/src/core/index.js";

export const meta = {
  name: "Gate open",
  desc: "A white crack splits the air, tears into a jagged violet gate with a deep dark inside, pulls motes in while its rim crackles, then seals shut.",
  tags: ["rift", "gate", "portal", "tear", "dungeon", "one-shot", "ground"],
  size: [160, 132],
  origin: [80, 124],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0b0716", "#1d1238", "#3b2276", "#6c3fc8", "#a37cf2", "#dccbff", "#ffffff"], seed: 3, height: 76, width: 15 },
};

const CRACK = 0.38, OPEN = 0.72, CLOSE = 2.3, SHUT = 2.68;
const VOID = hex("#06040c");

// Drop particles that fly off the canvas (local bounds), so nothing is drawn outside it.
export function cull(ps, x0, y0, x1, y1) {
  const L = ps.list;
  for (let i = L.length - 1; i >= 0; i--) if (L[i].x < x0 || L[i].x > x1 || L[i].y < y0 || L[i].y > y1) L.splice(i, 1);
}

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), H = o.height, W = o.width;
  const TOP = -H - 6, BOT = -6, MID = (TOP + BOT) / 2, HALF = (BOT - TOP) / 2;
  const floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [WHITE, C[5], C[4], C[3]] });
  const bits = new Bits({ ground: floor });
  const lights = new Lights();
  // the crack's path: a zigzag spine, one kink every few px, a little wider in the middle
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
  let t = 0, flashed = false, sealed = false;

  // how wide the gate stands open at t (0..1)
  const openness = (tt) => (tt < CRACK ? 0 : tt < OPEN ? ease.outBack(seg(tt, CRACK, OPEN)) : tt < CLOSE ? 1 : 1 - ease.inCubic(seg(tt, CLOSE, SHUT)));
  // half width at height y: a lens, ragged along its edge, breathing while it holds
  const half = (y, k, side) => {
    const v = (y - MID) / HALF;
    if (Math.abs(v) >= 1) return 0;
    const lens = Math.pow(1 - v * v, 0.7);
    const rag = 1 + 0.16 * (noise(y * 0.13 + side * 17, 3.1) - 0.5) * 2 + 0.04 * Math.sin(t * 5 + y * 0.15 + side);
    return W * lens * rag * k;
  };

  return {
    update(dt) {
      t += dt;
      // sparks spitting from the tips while the crack runs
      if (t < CRACK) {
        const reach = ease.outQuad(t / CRACK) * HALF;
        for (const y of [MID - reach, MID + reach]) {
          if (R.chance(30 * dt)) ps.spawn(P.SPARK, spine(y), y, R.range(-60, 60), R.range(-90, 10), R.range(0.15, 0.35));
        }
      }
      // the tear: a white hero frame, a flare, glassy shards of the world thrown off its edges
      if (!flashed && t >= CRACK) {
        flashed = true;
        lights.add(0, MID, 90, C[4], 1, 0.5);
        lights.add(0, MID, 26, WHITE, 1, 0.1);
        for (let i = 0; i < 16; i++) {
          const y = MID + R.range(-HALF, HALF) * 0.8, s = R.sign();
          bits.add({ kind: B.SHARD, x: spine(y) + s * 2, y, vx: s * R.range(50, 150), vy: R.range(-160, -30), a: R.range(0, TAU), va: R.range(-14, 14),
            s: R.range(1.5, 3.5), c: R.pick([C[4], C[5], C[3]]), g: 700, drag: 0.4, bounce: 0.3, life: R.range(0.9, 1.6) });
        }
        for (let i = 0; i < 26; i++) {
          const y = MID + R.range(-HALF, HALF), s = R.sign();
          ps.spawn(P.SPARK, spine(y), y, s * R.range(80, 220), R.range(-200, 40), R.range(0.25, 0.6));
        }
      }
      // while it hangs open: streaks drawn in from all round, dust crawling along the floor towards it
      if (t > OPEN - 0.1 && t < CLOSE) {
        if (R.chance(22 * dt)) {
          const a = R.range(0, TAU), D = R.range(36, 62), T = R.range(0.35, 0.6);
          const x0 = Math.cos(a) * D * 1.2, y0 = MID + Math.sin(a) * D * 0.9;
          ps.spawn(P.STREAK, x0, y0, (-x0 / T) * 0.9, ((MID - y0) / T) * 0.9, T, R.chance(0.6) ? C[5] : C[4]);
        }
        if (R.chance(5 * dt)) {
          const s = R.sign();
          ps.spawn(P.DUST, s * R.range(30, 60), -1, -s * R.range(20, 40), -R.range(2, 8), R.range(0.8, 1.2), C[2], R.range(2, 3));
        }
      }
      // sealing: the last spit of sparks and a puff where it closed
      if (!sealed && t >= SHUT) {
        sealed = true;
        lights.add(spine(MID), MID, 40, C[5], 0.8, 0.25);
        for (let i = 0; i < 18; i++) {
          const a = R.range(0, TAU), sp = R.range(40, 160);
          ps.spawn(R.chance(0.5) ? P.MOTE : P.STAR, spine(MID), MID + R.range(-10, 10), Math.cos(a) * sp, Math.sin(a) * sp * 0.6,
            R.range(0.25, 0.5), R.pick([C[6], C[5], C[4]]));
        }
        ps.spawn(P.VAPOUR, spine(MID), MID, 0, -10, 0.5, C[3], 6);
      }
      ps.update(dt);
      cull(ps, -meta.origin[0] + 4, -meta.origin[1] + 4, meta.size[0] - meta.origin[0] - 4, 6);
      bits.update(dt);
      lights.update(dt);
    },

    drawBack(p) {
      // a cold pool of light on the floor under the gate while it is open
      const k = openness(t);
      if (k > 0) p.glow(0, 0, 40, C[3], 0.25 * k);
      ps.draw(p, "back");
    },

    draw(p) {
      const k = openness(t);
      // the running crack: a white zigzag growing from the middle both ways, its tips burning hot
      if (t < CRACK + 0.08) {
        const reach = ease.outQuad(clamp(t / CRACK)) * HALF;
        for (let y = MID - reach; y <= MID + reach; y += 0.5) {
          p.px(spine(y), y, WHITE);
          p.dot(spine(y) + 1, y, C[3], 0.5);
        }
        p.glow(spine(MID - reach), MID - reach, 6, C[5], 0.6);
        p.glow(spine(MID + reach), MID + reach, 6, C[5], 0.6);
        p.glowLine(spine(MID - reach), MID - reach, spine(MID + reach), MID + reach, 3, C[4], 0.35);
      }
      if (k > 0.01) {
        // inside the gate: dark depths, violet bands sinking inward, a rim of white along each ragged edge
        p.shade(-W - 8, TOP - 2, W + 8, BOT + 2, (x, y, out) => {
          const c = spine(y), dx = x - c, hw = half(y, k, dx < 0 ? -1 : 1);
          if (hw < 0.6) return;
          const e = Math.abs(dx) - hw;
          if (e > 4) return;
          // a dark haze just outside: the air around the wound is bruised
          if (e > 1.2) { out.c = C[0]; out.a = 0.35 * (1 - (e - 1.2) / 2.8) * k; return; }
          // the rim, lit from the top left: white there, cooler and dimmer down the right
          const lit = (dx < 0 ? 0.6 : 0.15) + (y < MID ? 0.3 : 0) + 0.2 * noise(y * 0.7, t * 6);
          if (e > 0.2) { out.c = lit > 0.55 ? C[4] : C[3]; out.a = 0.7; out.k = 0.2; return; }
          if (e > -1) { out.c = lit > 0.55 ? WHITE : lit > 0.3 ? C[5] : C[4]; out.k = 0.2 + 0.3 * lit; return; }
          // depth: a lit lip just inside the rim, falling in hard ramp steps to a black well,
          // with faint diagonal currents sinking down into it
          const d = clamp(-e / Math.max(1, hw)), v = (y - MID) / HALF;
          const cur = Math.pow(0.5 + 0.5 * Math.sin(d * 5 + v * 7 - t * 3), 12) * (1 - d) * 0.25;
          const st = Math.pow(1 - d, 2.2) + cur;
          const b = ((Math.floor(x) & 1) ^ (Math.floor(y) & 1)) * 0.06;
          out.c = st + b > 0.62 ? C[4] : st + b > 0.38 ? C[3] : st + b > 0.2 ? C[2] : st + b > 0.09 ? C[1] : VOID;
        });
        // the white hero frame of the tear
        if (t >= CRACK && t < CRACK + 0.07) {
          for (let y = TOP + 4; y <= BOT - 4; y += 0.5) p.line(spine(y) - 1.5, y, spine(y) + 1.5, y, WHITE);
        }
        // far stars deep inside, drifting down into the well
        if (k > 0.5) {
          for (let i = 0; i < 9; i++) {
            const r = new Rng(o.seed * 31 + i), y0 = MID + r.range(-0.7, 0.7) * HALF, ph = (t * r.range(0.15, 0.3) + r.next()) % 1;
            const y = y0 + (MID - y0) * ph, x = spine(y) + r.range(-0.4, 0.4) * half(y, k, 1) * (1 - ph);
            p.dot(x, y, ph < 0.7 ? C[5] : C[4], 1 - ph);
          }
        }
        // light: a broad violet pool and a hot seam down the middle of the depths
        p.glow(0, MID, 44, C[3], 0.22 * k);
        p.glowLine(spine(TOP + 6), TOP + 6, spine(BOT - 6), BOT - 6, 4, C[4], 0.18 * k);
        // crackle: a short arc of lightning hopping along the rim now and then
        const hop = Math.floor(t * 9);
        if (t > OPEN && t < CLOSE && hop % 3 === 0) {
          const r = new Rng(o.seed * 97 + hop), y0 = MID + r.range(-HALF, HALF) * 0.75, s = r.sign();
          let px = spine(y0) + s * half(y0, k, s), py = y0;
          for (let i = 0; i < 4; i++) {
            const nx = px + s * r.range(2, 5), ny = py + r.range(-4, 4);
            p.line(px, py, nx, ny, i < 2 ? WHITE : C[5]);
            p.glowLine(px, py, nx, ny, 2, C[4], 0.4);
            px = nx;
            py = ny;
          }
        }
      }
      bits.draw(p);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}
