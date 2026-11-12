// Guilds: a long-term home for a hunter. A cut of the pay buys a real perk; you can also found your own. Spec §6.3.
import { ch, pk } from "./rng.js";
import { stream, log, stageOf } from "./state.js";
import { canHunt } from "./hunter.js";
import { openEvent } from "./events.js";
import { addLedger } from "./money.js";
import { monthly, books, afterOpHooks, hooks } from "./registry.js";
import { moveFac } from "./factions.js";
import { storeOf } from "./storage.js";
import { GUILDS, FOUND } from "../data/guilds.js";

export const guildDef = (s) =>
  (s.guild && s.guild.role !== "master" ? GUILDS[s.country]?.find((x) => x.id === s.guild.id) : null);
export const guildPerk = (s) => guildDef(s)?.perk ?? null;
const clampG = (v) => Math.max(0, Math.min(100, v));

export function guildsFor(s) {
  const r = s.hunter?.rank ?? 0, under = s.fac?.under ?? 0;
  // a blacklisted hunter only gets the guild that does not ask
  return (GUILDS[s.country] ?? []).filter((x) => r >= x.minRank && (x.perk !== "shady" || under >= 10)
    && (!s.flags.blacklisted || x.perk === "shady"));
}

export function joinGuild(s, id) {
  const d = (GUILDS[s.country] ?? []).find((x) => x.id === id);
  if (!d || s.guild || s.party || !s.hunter) return false;
  s.guild = { id, n: d.n, role: "member", standing: 50, since: s.ageM };
  log(s, "กิลด์", `คุณเข้าร่วม${d.n}`, "imp");
  return true;
}

// Leaving: locker items go home (over its cap if need be, nothing is lost).
export function leaveGuild(s, quiet) {
  if (!s.guild) return;
  const st = storeOf(s);
  st.home.push(...(st.guild ?? []));
  st.guild = [];
  if (!quiet) log(s, "กิลด์", `คุณออกจาก${s.guild.n} ของในตู้กิลด์ถูกขนกลับบ้าน`, "imp");
  s.guild = null;
}

export const canFound = (s) => !!s.hunter && !s.party && s.guild?.role !== "master" && s.hunter.rank >= FOUND.rank
  && s.fame >= FOUND.fame && s.gold >= FOUND.gold;

export function foundGuild(s) {
  if (!canFound(s)) return false;
  if (s.guild) leaveGuild(s);
  addLedger(s, "ค่าจดทะเบียนกิลด์", -FOUND.gold);
  s.guild = { id: "own", n: `กิลด์ของ${s.name}`, role: "master", standing: 100, since: s.ageM };
  moveFac(s, { assoc: 5 });
  log(s, "กิลด์", `คุณจดทะเบียน${s.guild.n} ชื่อของคุณขึ้นป้ายหน้าตึกเป็นครั้งแรก`, "leg");
  return true;
}

// The guild's cut of gate and tower pay, and standing from wins.
afterOpHooks.push((s, o, r, gold) => {
  if (!s.guild || o.def.kind === "job") return;
  const d = guildDef(s);
  if (d && gold > 0) addLedger(s, "ส่วนแบ่งกิลด์", -Math.round(gold * d.cut * (s.guild.role === "officer" ? 0.5 : 1)));
  if (r === "won") s.guild.standing = clampG(s.guild.standing + (o.def.guildJob ? 4 : 1));
  else if (r === "fled" && o.ranAway) s.guild.standing = clampG(s.guild.standing - (o.def.guildJob ? 4 : 1));
});

hooks.guildPerk = guildPerk;
hooks.leaveGuild = leaveGuild;
// a lost run (no payout, so no after-op hooks) still costs standing
hooks.guildLoss = (s) => { if (s.guild && s.guild.role !== "master") s.guild.standing = clampG(s.guild.standing - 5); };
hooks.bossDeathMul = (s) => (guildPerk(s) === "safe" ? 0.5 : 1);
hooks.xpMul = (s) => (guildPerk(s) === "elite" ? 1.2 : 1);

// Your own guild: dues from the name you made and the people you lead, against rent and staff.
books.push((s, step = 1) => {
  if (s.guild?.role !== "master") return;
  // dues come from a working guild: fame counts up to 100, and a master who stopped hunting draws half
  const team = s.team.filter((m) => m.alive).reduce((a, m) => a + 150 * (m.rank + 1), 0);
  const inc = (Math.min(100, s.fame) * 40 + team) * (s.flags.stoppedHunting ? 0.5 : 1);
  addLedger(s, "รายได้กิลด์", Math.round(inc * step));
  addLedger(s, "ค่าดำเนินการกิลด์", -FOUND.upkeep * step);
});

monthly.push((s) => {
  if (s.ev || !s.hunter) return;
  // promotion
  const gd = s.guild;
  if (gd?.role === "member" && gd.standing >= 70 && s.hunter.rank >= 3 && s.ageM - gd.since >= 36) {
    gd.role = "officer";
    openEvent(s, { id: "guildOfficer", tag: "กิลด์", important: true,
      t: `${gd.n} เรียกคุณเข้าห้องประชุมชั้นบนสุด พวกเขาอยากให้คุณเป็นแกนนำคนหนึ่งของกิลด์`,
      o: [{ l: "รับตำแหน่ง", y: { m: "ส่วนแบ่งที่กิลด์หักจากคุณลดลงครึ่งหนึ่ง", fame: 3 } }] });
    return;
  }
  // a yearly offer
  if (gd || s.party || !canHunt(s) || stageOf(s) === "old" || s.ageM % 12 !== 3) return;
  const R = stream(s, "guild");
  const list = guildsFor(s);
  if (!list.length || !ch(R, 0.5)) return;
  const d = pk(R, list);
  s.guildOffer = d.id;
  openEvent(s, { id: "guildOffer", tag: "กิลด์", important: true,
    t: `${d.n} ส่งคนมาชวนคุณเข้ากิลด์ ${d.t}`,
    o: [{ l: "เข้ากิลด์", y: { act: "guildJoin" } },
      { l: "ขอเป็นอิสระต่อไป", y: { m: "พวกเขาทิ้งนามบัตรไว้บนโต๊ะ" } }] });
});

hooks.act.guildJoin = (s) => joinGuild(s, s.guildOffer);
hooks.act.guildUp = (s) => { if (s.guild) s.guild.standing = clampG(s.guild.standing + 8); };
hooks.act.guildDown = (s) => { if (s.guild) s.guild.standing = clampG(s.guild.standing - 8); };

// Moving country leaves a guild of the old country; your own guild moves with you.
hooks.moveCountry = (s) => { if (s.guild && s.guild.role !== "master") leaveGuild(s); };
