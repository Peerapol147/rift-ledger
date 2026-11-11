import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { hooks } from "../src/core/registry.js";
import { SYSTEM_EVENTS } from "../src/data/events/systems.js";

const hunter = (seed) => { const s = C.newLife(seed); s.ageM = 30 * 12; C.awakenCheck(s, "event"); s.ev = null; s.gold = 1e5; return s; };
const ev = (id) => SYSTEM_EVENTS.find((e) => e.id === id);

test("system events open only when their system is in use", () => {
  const s = hunter("se");
  assert.equal(C.eligible(s, ev("guildMemorial")), false);
  C.joinGuild(s, C.guildsFor(s)[0].id);
  assert.ok(C.eligible(s, ev("guildMemorial")));
  assert.equal(C.eligible(s, ev("vaultHeist")), false);
  C.stash(s, C.giveItem(s, "healPotion", "t"), "vault");
  assert.ok(C.eligible(s, ev("vaultHeist")));
  assert.equal(C.eligible(s, ev("smithSecret")), false);
  const w = C.giveItem(s, "ironSword", "t"); C.equip(s, w); s.items.find((i) => i.uid === w).plus = 1;
  assert.ok(C.eligible(s, ev("smithSecret")));
});

test("event acts: standing moves, a lucky smith adds +1, a theft takes one unlocked item", () => {
  const s = hunter("sa");
  C.joinGuild(s, C.guildsFor(s)[0].id);
  const g0 = s.guild.standing; hooks.act.guildUp(s); assert.equal(s.guild.standing, g0 + 8);
  const w = C.giveItem(s, "ironSword", "t"); C.equip(s, w);
  hooks.act.forgeBless(s); assert.equal(s.items.find((i) => i.uid === w).plus, 1);
  const a = C.giveItem(s, "healPotion", "t"), b = C.giveItem(s, "healPotion", "t");
  C.stash(s, a, "home"); C.stash(s, b, "home"); s.store.home.find((i) => i.uid === a).lock = true;
  hooks.act.homeLoss(s);
  assert.deepEqual(s.store.home.map((i) => i.uid), [a], "the locked one stays");
});

test("every system event has an option with no need", () => {
  for (const e of SYSTEM_EVENTS) assert.ok(e.o.some((o) => !o.need && !o.risk), e.id);
});
