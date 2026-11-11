import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mk } from "../src/core/rng.js";
import { newLife, rollRank, rollCeil, canRankUp, awakenCheck, slotsFor, LV_CAP } from "../src/core/index.js";
import { CLASSES, SKILLS } from "../src/data/index.js";

test("rank distribution within ±2 points", () => {
  const n = 20000, cnt = Array(8).fill(0), r = mk("rk", "x");
  for (let i = 0; i < n; i++) cnt[rollRank(r)]++;
  [40, 20, 15, 10, 9, 5, 1].forEach((w, i) => assert.ok(Math.abs((cnt[i] / n) * 100 - w) <= 2, `rank ${i}`));
});

test("ceiling never below rank, at most +2, capped at S", () => {
  const r = mk("c", "x");
  for (let i = 0; i < 5000; i++) {
    const rank = i % 7, c = rollCeil(r, rank);
    assert.ok(c >= rank && c <= Math.min(6, rank + 2));
  }
});

const hunterAt = (rank, ceil) => {
  const s = newLife("h"); s.ageM = 20 * 12;
  awakenCheck(s, "event");
  Object.assign(s.hunter, { rank, ceil });
  return s;
};

test("cannot rank up past ceiling", () => {
  const s = hunterAt(0, 0); s.hunter.lv = 99;
  assert.equal(canRankUp(s), false);
  const t = hunterAt(0, 1); t.hunter.lv = LV_CAP[0];
  assert.equal(canRankUp(t), true);
});

test("awakening rate at screening near 25%", () => {
  let n = 0;
  for (let i = 0; i < 4000; i++) { const s = newLife("aw" + i); s.ageM = 18 * 12; n += awakenCheck(s, "screen"); }
  assert.ok(n / 4000 >= 0.23 && n / 4000 <= 0.27, `rate ${n / 4000}`);
});

test("every class has art, roles covered twice, skills exist", () => {
  const roles = {};
  for (const [id, c] of Object.entries(CLASSES)) {
    assert.ok(existsSync(`art/professions/${c.art}.png`), id);
    roles[c.role] = (roles[c.role] ?? 0) + 1;
    for (const [, sk] of c.skills) assert.ok(SKILLS[sk], `${id} skill ${sk}`);
    assert.match(c.n, /^[A-Za-z ]+$/);
  }
  for (const r of ["vanguard", "striker", "support", "scout", "artisan"]) assert.ok(roles[r] >= 2, r);
  const n = Object.keys(CLASSES).length;
  assert.ok(n >= 12 && n <= 15);
});

test("slots", () => assert.deepEqual([0, 3, 5, 6].map(slotsFor), [4, 5, 6, 7]));

test("log after awakening has no rarity words", () => {
  for (let i = 0; i < 300; i++) {
    const s = newLife("lg" + i); s.ageM = 18 * 12;
    if (!awakenCheck(s, "event")) continue;
    assert.doesNotMatch(JSON.stringify(s.log), /Common|Rare|Advanced|Legendary|Mythic|ceil/);
  }
});
