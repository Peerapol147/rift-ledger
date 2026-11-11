import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { hooks, afterOpHooks } from "../src/core/registry.js";

const hunter = (seed, rank = 0) => {
  const s = C.newLife(seed); s.ageM = 25 * 12; C.awakenCheck(s, "event"); s.ev = null;
  s.hunter.rank = rank; s.gold = 1e5; return s;
};

test("offers respect rank and the shady guild's underground need", () => {
  const s = hunter("go", 0);
  const ids = C.guildsFor(s).map((g) => g.perk);
  assert.ok(ids.includes("safe") && !ids.includes("elite") && !ids.includes("shady"));
  s.hunter.rank = 3; s.fac.under = 12;
  assert.deepEqual(C.guildsFor(s).map((g) => g.perk).sort(), ["elite", "safe", "shady"]);
});

test("the guild takes its cut and a win raises standing", () => {
  const s = hunter("gc", 1);
  const safe = C.guildsFor(s).find((g) => g.perk === "safe");
  assert.ok(C.joinGuild(s, safe.id));
  const st0 = s.guild.standing;
  for (const f of afterOpHooks) f(s, { def: { kind: "gate", foes: [] }, lostAlly: 0, prep: {} }, "won", 1000);
  const cut = s.ledger.find((e) => e.label === "ส่วนแบ่งกิลด์");
  assert.equal(cut.amt, -Math.round(1000 * safe.cut));
  assert.ok(s.guild.standing > st0);
});

test("perks: safe halves boss death, elite adds xp; party and guild exclude each other", () => {
  const s = hunter("gp", 3);
  C.joinGuild(s, C.guildsFor(s).find((g) => g.perk === "safe").id);
  assert.equal(hooks.bossDeathMul(s), 0.5);
  C.joinParty(s, { n: "x", rank: 5, cls: "knight" });
  assert.ok(!s.party);
  C.leaveGuild(s);
  C.joinGuild(s, C.guildsFor(s).find((g) => g.perk === "elite").id);
  assert.equal(hooks.xpMul(s), 1.2);
});

test("a member is offered the guild's own job", () => {
  const s = hunter("gj", 2);
  C.joinGuild(s, C.guildsFor(s)[0].id);
  C.openGateChoice(s);
  const i = s.offers.findIndex((d) => d.guildJob);
  assert.ok(i >= 0);
  C.choose(s, i);
  assert.ok(s.op?.def.guildJob, "the job starts");
});

test("promotion to officer after standing, rank and time", () => {
  const s = hunter("gr", 3);
  C.joinGuild(s, C.guildsFor(s)[0].id);
  s.guild.standing = 80; s.guild.since = s.ageM - 40;
  for (let i = 0; i < 24 && s.guild?.role === "member"; i++) { s.ev = null; C.tick(s); }
  assert.equal(s.guild.role, "officer");
});

test("founding needs every requirement, raises the team cap, and leaving takes the locker home", () => {
  const s = hunter("gf", 2); s.fame = 50;
  assert.equal(C.canFound(s), false, "rank too low");
  s.hunter.rank = 3;
  assert.ok(C.foundGuild(s));
  assert.equal(C.teamMax(s), 6);
  assert.equal(C.legacyOf(s).guild, s.guild.n);
  const t = hunter("gl", 1);
  C.joinGuild(t, C.guildsFor(t)[0].id);
  const uid = C.giveItem(t, "healPotion", "t");
  assert.ok(C.stash(t, uid, "guild"));
  C.leaveGuild(t);
  assert.ok(t.store.home.some((i) => i.uid === uid));
  assert.equal(C.stash(t, C.giveItem(t, "healPotion", "t"), "guild"), false, "no guild, no locker");
});

test("old saves without a guild load and play", () => {
  const s = hunter("gs", 1); delete s.guild; s.store = { home: [], vault: [], vaultCountry: null };
  const t = C.deserialize(C.serialize(s));
  for (let i = 0; i < 24; i++) { t.ev = null; C.advance(t); }
  assert.ok(Array.isArray(C.storeOf(t).guild));
});
