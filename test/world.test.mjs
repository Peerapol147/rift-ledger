import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, recordFloor, ageY, awakenCheck, moveCity, yearsAfterRift } from "../src/core/index.js";
import { CLASSES } from "../src/data/index.js";
import { playUntil } from "./helpers.mjs";

const thBkk = () => {
  for (let i = 0; ; i++) { const s = newLife("bk" + i); if (s.city === "bkk") return s; }
};
const lastNews = (s) => s.log.filter((l) => l.tag === "ข่าวโลก").map((l) => l.text).join("\n");

test("records start at 47 and 44, roster has 12 incl. one EX", () => {
  const s = newLife("w");
  assert.deepEqual(s.world.records, { silent: 47, drowned: 44 });
  assert.equal(s.world.roster.length, 12);
  assert.equal(s.world.roster.filter((n) => n.rank === 7).length, 1);
});

test("calendar break fires in year 24 for Thai lives in Bangkok", () => {
  const s = playUntil(thBkk(), (x) => yearsAfterRift(x) > 24);
  assert.ok(s.c["ev:cal24"] >= 1);
});

test("foreign-country calendar becomes news", () => {
  let s; for (let i = 0; !s; i++) { const t = newLife("kr" + i); if (t.country === "kr") s = t; }
  playUntil(s, (x) => yearsAfterRift(x) > 24);
  assert.ok(!s.c["ev:cal24"]);
  assert.match(lastNews(s), /กรุงเทพ/);
});

test("player record pre-empts NPC record", () => {
  const s = newLife("pre");
  recordFloor(s, "silent", 48, true);
  playUntil(s, (x) => yearsAfterRift(x) > 30);
  assert.match(lastNews(s), /ไม่สำเร็จ/);
  assert.equal(s.world.records.silent, 48);
});

test("NPC record raises tower record", () => {
  const s = playUntil(newLife("npc"), (x) => yearsAfterRift(x) > 30);
  assert.equal(s.world.records.silent, 48);
});

test("legendary class held by roster NPC is never rolled for player", () => {
  for (let i = 0; i < 3000; i++) {
    const s = newLife("lg" + i);
    const held = s.world.roster.filter((n) => CLASSES[n.cls]?.rarity >= 3).map((n) => n.cls);
    if (!held.length) continue;
    s.ageM = 18 * 12;
    awakenCheck(s, "event");
    assert.ok(!held.includes(s.hunter.cls));
  }
});

test("moving city costs money; across countries halves job tier", () => {
  const s = newLife("mv"); s.ageM = 30 * 12; s.gold = 5000;
  s.job = { id: "office", tier: 2, xp: 0 };
  const other = s.country === "th" ? "sel" : "bkk";
  moveCity(s, other);
  assert.equal(s.city, other);
  assert.equal(s.job.tier, 1);
  assert.ok(s.gold < 5000);
  assert.equal(s.flags.relicense, true);
});

test("a hunter who stopped hunting gets the default calendar view, not nothing", () => {
  let s;
  for (let i = 0; !s; i++) { const t = newLife("vw" + i); if (t.city === "bkk") s = t; }
  s.ageM = 30 * 12; awakenCheck(s, "event"); s.flags.stoppedHunting = true;
  s.ageM = (48 - 21) * 12 + 4 - (s.mon0 ?? 0);
  for (const id of ["cal24", "cal27", "cal30", "cal33", "cal36", "cal38", "cal40", "cal42", "cal44", "cal46"]) s.world.done[id] = 1;
  playUntil(s, (x) => x.ev?.id === "cal48" || x.dead || yearsAfterRift(x) > 48);
  assert.equal(s.ev?.id, "cal48");
  assert.ok(Array.isArray(s.ev.opts) && s.ev.opts.length > 0);
});

test("world news reads as Thai: spaced rank letters, short tower names", () => {
  for (const seed of ["txt1", "txt2", "txt3"]) {
    const s = playUntil(newLife(seed), (x) => ageY(x) >= 60);
    for (const l of s.log) {
      assert.doesNotMatch(l.text, /[A-Z]แตก/, l.text);
      assert.doesNotMatch(l.text, /ทำลายสถิติ\S/, l.text);
      assert.doesNotMatch(l.text, /The (Silent|Drowned) Tower/, l.text);
    }
  }
});
