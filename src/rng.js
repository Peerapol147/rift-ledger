// Seeded RNG held as plain data ({s}), so it saves as JSON. One stream per domain: same seed, same world.
export const hash = (v) => { let h = 2166136261 >>> 0; for (const c of String(v)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
export const mk = (seed, label = "") => ({ s: hash(seed + "|" + label) });
export const rnd = (r) => { r.s = (r.s + 0x6d2b79f5) | 0; let t = r.s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const ri = (r, a, b) => a + Math.floor(rnd(r) * (b - a + 1));
export const pk = (r, a) => a[Math.floor(rnd(r) * a.length)];
export const ch = (r, p) => rnd(r) < p;
export const wp = (r, a, w = (x) => x.w ?? 1) => { let t = 0; for (const x of a) t += w(x); let v = rnd(r) * t; for (const x of a) if ((v -= w(x)) < 0) return x; return a[a.length - 1]; };
export const shuf = (r, a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = ri(r, 0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
