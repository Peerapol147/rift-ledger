// Seeing the cast: guilds by tier, only people heard of or met, family ties as words (P2a Task 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { worldTab } from "../src/ui/tabs/world.js";
import { peopleView } from "../src/ui/people.js";

test("the world tab lists guilds by tier word", () => {
  const html = worldTab(C.newLife("ui-w1"));
  for (const w of ["ตำนาน", "ใหญ่", "เงา", "กิลด์สายน้ำเจ้าพระยา", "กิลด์แพ็กโฮ"]) assert.ok(html.includes(w), w);
  assert.doesNotMatch(html, /legend|major|shadow/);
});

test("a cast member never heard of is not listed; a famous one is", () => {
  const s = C.newLife("ui-w2");
  const html = worldTab(s);
  assert.ok(html.includes(C.castPerson(s, "poramet").name)); // the tower record holder is famous
  assert.ok(!html.includes(C.castPerson(s, "hong").name)); // the fixer is nobody's news
});

test("someone in the news is heard of from then on", () => {
  const s = C.newLife("ui-w3"); s.ageM = 90 * 12; C.updatePeople(s);
  const gone = Object.values(s.world.people).find((p) => p.cast && (p.diedWorldM != null || p.retired) && !["thongbai", "poramet", "seojin"].includes(p.cast));
  assert.ok(gone, "someone retired or died by year 90");
  assert.ok(worldTab(s).includes(gone.name));
});

test("heirs see the family tie as a word, never a number", () => {
  const p = C.newLife("ui-h1"); p.ageM = 60 * 12;
  const harin = C.castPerson(p, "harin");
  C.applyCastAct(p, harin, "enemy");
  const h = C.newHeir(p, "ui-h1b");
  const html = peopleView(h);
  assert.ok(html.includes(harin.name));
  assert.match(html, /ศัตรูของครอบครัวคุณ/);
  assert.doesNotMatch(html.replace(/<[^>]+>/g, ""), /\d/);
});
