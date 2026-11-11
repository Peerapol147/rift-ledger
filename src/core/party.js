// Being a member of an NPC's team: the leader picks gates and plans, the player keeps their own decision points,
// takes a smaller share, earns trust, can be promoted, kicked out, split off or betray. Spec §8 (owner request).
import { ri, pk, ch } from "./rng.js";
import { stream, log } from "./state.js";
import { openEvent } from "./events.js";
import { addLedger } from "./money.js";
import { monthly, gearHooks, afterOpHooks, hooks } from "./registry.js";
import { gateOffers, gateOp } from "./hunt.js";
import { startOp, defaultPrep } from "./ops.js";
import { CLASSES } from "../data/classes.js";
import { NAMES } from "../data/families.js";

const SHARE = { member: 0.4, vice: 0.6 };
const clampT = (v) => Math.max(0, Math.min(100, v));

export function joinParty(s, leader) {
  s.party = { leader, trust: 50, role: "member", sinceM: s.ageM };
  log(s, "ทีม", `คุณเข้าร่วมทีมของ ${leader.n}`, "imp");
}

// The leader's team fights beside you: about two hunters of the leader's rank.
gearHooks.push((s) => {
  if (!s.party) return {};
  const k = 0.7 * (1 + s.party.leader.rank * 0.15), lv = 10 + s.party.leader.rank * 9;
  return { atk: (17 + lv * 2.2) * k, def: (8 + lv * 0.8) * k, hp: (110 + lv * 10) * 0.7 };
});

// Replaces the player's own gate choice while in a party.
export function partyGateChoice(s) {
  const r = Math.max(0, s.party.leader.rank - 1);
  const g = gateOffers({ ...s, hunter: { ...s.hunter, rank: r, lv: 99 } })[0];
  g.boss = false;
  s.offers = [gateOp(s, g)];
  openEvent(s, {
    id: "partyGate", tag: "ทีม", t: `${s.party.leader.n} เลือกเกตเดือนนี้: ${s.offers[0].t}`,
    o: [{ l: "ไปกับทีม", y: { act: "partyGo" } }, { l: "ขอพักเดือนนี้", y: { m: "หัวหน้าพยักหน้าแบบไม่ค่อยพอใจ",
      act: "partySkip" } }],
  });
}

hooks.act.partyGo = (s) => startOp(s, s.offers[0], { ...defaultPrep(s), plan: "careful", share: SHARE[s.party.role] });
hooks.act.partySkip = (s) => { s.party.trust = clampT(s.party.trust - 3); };
hooks.act.partyVice = (s) => { s.party.role = "vice"; log(s, "ทีม", "คุณได้เป็นรองหัวหน้าทีม", "leg"); };
hooks.act.partyInherit = (s) => leaveParty(s, "inherit");

afterOpHooks.push((s, o, r) => {
  if (!s.party || o.def.kind === "job") return;
  s.party.trust = clampT(s.party.trust + (r === "won" ? 4 : r === "fled" ? -2 : -5) - (o.lostAlly ? 15 : 0));
});

function follower(s, rank, loyalty) {
  const R = stream(s, "recruit"), cls = pk(R, Object.keys(CLASSES).filter((c) => CLASSES[c].rarity <= 2));
  s.c.mid = (s.c.mid ?? 0) + 1;
  return { id: "m" + s.c.mid, n: pk(R, NAMES[s.country][ri(R, 0, 1) ? "f" : "m"]), rank, cls, role: CLASSES[cls].role,
    lv: 6 + rank * 8, loyalty, alive: true, hurtUntilM: 0, story: 0, tpl: ri(R, 0, 7) };
}

// how: "leave" in peace, "split" taking followers who trust you, "betray" for a payout, "inherit" the team.
export function leaveParty(s, how) {
  const p = s.party;
  if (!p) return;
  s.party = null;
  const r = Math.max(0, p.leader.rank - 1);
  if (how === "split" && p.trust >= 60) s.team.push(follower(s, r, 65));
  if (how === "inherit") for (let i = 0; i < 2; i++) s.team.push(follower(s, r, 75));
  if (how === "betray") {
    addLedger(s, "เงินที่ขโมยจากทีมเดิม", 6000 + p.leader.rank * 3000);
    s.fame = Math.max(0, s.fame - 10);
    s.flags.partyEnemy = p.leader.n;
  }
  const text = { leave: "คุณแยกทางกับทีมด้วยดี", split: "คุณแยกออกมาตั้งทีมเอง", betray: "คุณหอบเงินของทีมหนีไป",
    inherit: `${p.leader.n} เกษียณ และยกทีมให้คุณดูแล`, kicked: `${p.leader.n} ไล่คุณออกจากทีม` }[how];
  log(s, "ทีม", text, how === "betray" || how === "kicked" ? "bad" : "imp");
}

export function partyMonth(s) {
  const p = s.party;
  if (!p || s.ev) return;
  if (p.trust < 20) return leaveParty(s, "kicked");
  if (p.role === "member" && p.trust >= 80) {
    return openEvent(s, { id: "partyVice", tag: "ทีม", important: true, t: `${p.leader.n} อยากให้คุณเป็นรองหัวหน้าทีม`,
      o: [{ l: "รับตำแหน่ง", y: { act: "partyVice" } }, { l: "ยังไม่พร้อม", y: { m: "หัวหน้าเข้าใจ" } }] });
  }
  if (p.role === "vice" && p.trust >= 90 && s.ageM - p.sinceM >= 72) {
    return openEvent(s, { id: "partyInherit", tag: "ทีม", important: true,
      t: `${p.leader.n} กำลังจะเกษียณ และอยากยกทีมให้คุณ`,
      o: [{ l: "รับทีมต่อ", y: { act: "partyInherit" } }, { l: "ปฏิเสธ", y: { m: "หัวหน้ายกทีมให้คนอื่น",
        act: "partyLeave" } }] });
  }
}

hooks.act.partyLeave = (s) => leaveParty(s, "leave");

// A yearly offer from a stronger hunter while you have no team and no party.
monthly.push((s) => {
  partyMonth(s);
  const free = s.hunter && !s.flags.stoppedHunting && !s.team.some((m) => m.alive);
  if (s.ev || s.party || !free || s.ageM % 12 !== 6) return;
  const R = stream(s, "party");
  if (!ch(R, 0.35)) return;
  const rank = Math.min(6, s.hunter.rank + ri(R, 1, 2));
  const leader = { n: pk(R, NAMES[s.country][ri(R, 0, 1) ? "f" : "m"]), rank, cls: pk(R, ["knight", "sword", "fmage",
    "archer"]) };
  s.partyOffer = leader;
  openEvent(s, { id: "partyOffer", tag: "ทีม",
    t: `${leader.n} ฮันเตอร์แรงก์ที่สูงกว่าคุณ ชวนเข้าทีม แบ่งเงินน้อยกว่า แต่ได้เข้าเกตใหญ่`,
    o: [{ l: "เข้าทีม", y: { act: "partyJoin" } }, { l: "ขอทำทีมของตัวเอง", y: { m: "เขายักไหล่แล้วเดินไป" } }] });
});
hooks.act.partyJoin = (s) => joinParty(s, s.partyOffer);
hooks.partyGate = partyGateChoice;
