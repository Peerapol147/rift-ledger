// Events: who sees them, how options look (known locks vs hidden), and what choosing does.
import { ch, rnd } from "./rng.js";
import { stream, ageY, log } from "./state.js";
import { addLedger } from "./money.js";
import { STATS } from "../data/stats.js";
import { ROLES } from "../data/classes.js";
import { FACTIONS } from "../data/factions.js";
import { ALL_EVENTS } from "../data/events/index.js";
import { hooks, resolvers } from "./registry.js";

export { hooks, resolvers };

export const EVENT_INDEX = new Map(ALL_EVENTS.map((e) => [e.id, e]));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const KNOWN_PREFIX = ["skill:", "job:", "cls:", "role:"];
const KNOWN_PLAIN = new Set([...Object.keys(STATS), "gold", "hp", "mind"]);


export const isKnown = (key) => KNOWN_PLAIN.has(key) || KNOWN_PREFIX.some((p) => key.startsWith(p));

export function val(s, key) {
  if (key in STATS) return s.st[key];
  if (key === "gold" || key === "hp" || key === "mind") return s[key];
  if (key === "age") return ageY(s);
  if (key === "rank") return s.hunter ? s.hunter.rank : -1;
  if (key === "fame") return s.fame;
  if (key === "employed") return s.job ? 1 : 0;
  if (key === "jobTier") return s.job ? s.job.tier : -1;
  if (key.startsWith("fac:")) return s.fac?.[key.slice(4)] ?? 0;
  if (key === "guild") return !s.guild ? 0 : s.guild.role === "master" ? 2 : 1;
  if (key === "vault" || key === "home") return s.store?.[key]?.length ?? 0;
  if (key === "forged") return Math.max(0, ...(s.items ?? []).map((i) => i.plus ?? 0));
  const [kind, id] = key.split(":");
  if (kind === "skill") return s.hunter?.skills.includes(id) ? 1 : 0;
  if (kind === "job") return s.job?.id === id ? 1 : 0;
  if (kind === "cls") return s.hunter?.cls === id ? 1 : 0;
  if (kind === "role") return resolvers.role(s) === id ? 1 : 0;
  return s.c[key] ?? (s.flags[key] ? 1 : 0);
}

export function needLabel(key, min) {
  if (key in STATS) return `${STATS[key]} ${min}`;
  if (key === "gold") return `เงิน ₿${min}`;
  if (key === "hp") return `สุขภาพ ${min}`;
  if (key === "mind") return `สุขภาพจิต ${min}`;
  const [kind, id] = key.split(":");
  if (kind === "skill") return `สกิล [${resolvers.skillName(id)}]`;
  if (kind === "job") return `อาชีพ [${resolvers.jobName(id)}]`;
  if (kind === "cls") return `คลาส [${resolvers.clsName(id)}]`;
  if (kind === "fac") return `ความไว้ใจจาก${FACTIONS[id] ?? id}`;
  return `บทบาท [${ROLES[id] ?? id}]`;
}

// A child is measured against children: below 18 a check's difficulty shrinks with age (half at 6, full at 18).
export const ageScale = (s) => Math.min(1, Math.max(0.5, (ageY(s) + 6) / 24));

export function optionView(s, opt) {
  // nerve: brave options need a steady mind (spec §6.4)
  const need = Object.entries(opt.nerve ? { mind: 20, ...opt.need } : opt.need ?? {});
  const unmet = need.filter(([k, min]) => val(s, k) < min);
  const view = { label: opt.l, desc: opt.d ?? "", odds: null, locked: false, lockText: null, visible: true };
  if (unmet.some(([k]) => !isKnown(k))) return { ...view, visible: false };
  if (unmet.length) {
    const [k, min] = unmet[0];
    view.locked = true;
    view.lockText = `ต้องการ ${needLabel(k, min)}` + (k in STATS ? ` · คุณมี ${Math.floor(val(s, k))}` : "");
  }
  // a worn-out mind makes every check harder: up to −30 points at zero
  const tired = Math.max(0, 30 - (s.mind ?? 100));
  if (opt.s) view.odds = clamp(Math.round(35 + (s.st[opt.s] - (opt.diff ?? 0) * ageScale(s)) * 4 - tired), 5, 95);
  else if (opt.risk) view.odds = Math.round((1 - opt.risk) * 100);
  // risk is rolled by choose(); danger is information only (the risk lives inside the fight it starts).
  view.risk = opt.risk ?? opt.danger ?? 0;
  view.fx = effectChips(opt.y ?? {});
  return view;
}

// What an option touches if it goes well, as short chips for its button: stats, money, health, mind, fame. Never
// counters, factions or acts (secrets stay secret), never what happens on a failed check.
export function effectChips(y) {
  const out = [];
  for (const [k, v] of Object.entries(y.st ?? {})) if (STATS[k] && v) out.push(STATS[k] + (v > 0 ? "↑" : "↓"));
  const sign = (v) => (v > 0 ? "+" : "−");
  if (y.gold) out.push("เงิน" + sign(y.gold));
  if (y.hp) out.push("สุขภาพ" + sign(y.hp));
  if (y.mind) out.push("สุขภาพจิต" + sign(y.mind));
  if (y.fame) out.push("ชื่อเสียง" + sign(y.fame));
  return out;
}

export function eligible(s, ev) {
  const a = ageY(s);
  if (ev.age && (a < ev.age[0] || a > ev.age[1])) return false;
  if (ev.country && ev.country !== s.country) return false;
  if (ev.city && ev.city !== s.city) return false;
  if (ev.who && !ev.who.some((id) => s.job?.id === id || s.hunter?.cls === id)) return false;
  if (ev.hunter === true && !s.hunter) return false;
  if (ev.hunter === false && s.hunter) return false;
  // a child of school age: years since the first child was born
  if (ev.childAge) {
    const born = s.c["at:kids"];
    if (born == null || !(s.c.kids > 0)) return false;
    const y = (s.ageM - born) / 12;
    if (y < ev.childAge[0] || y > ev.childAge[1]) return false;
  }
  // in a team now: a party, or a teammate still alive
  if (ev.teamed && !(s.party || (s.team ?? []).some((m) => m.alive))) return false;
  // hunting now: awakened, not retired, not on a break (same rule as hunter.js canHunt)
  if (ev.activeHunter && !(s.hunter && !s.flags.stoppedHunting && s.ageM >= (s.c.huntBreakUntil ?? 0))) return false;
  if (ev.once && s.c["ev:" + ev.id]) return false;
  for (const [k, min] of Object.entries(ev.if ?? {})) if (val(s, k) < min) return false;
  for (const [k, max] of Object.entries(ev.max ?? {})) if (val(s, k) > max) return false;
  // a follow-up waits so many months after the counter it needs was first set
  for (const [k, m] of Object.entries(ev.after ?? {})) if (s.ageM - (s.c["at:" + k] ?? -1e9) < m) return false;
  return true;
}

export const fill = (s, text) => (text ?? "").replaceAll("{name}", s.name);

// Whatever the locks, an open event always has one option the player can take, so no life can freeze.
const ESCAPE = { l: "ปล่อยให้เรื่องนี้ผ่านไป", y: { m: "คุณไม่ได้ทำอะไร และมันก็ผ่านไป", mind: -2 } };
export function withEscape(s, opts) {
  const free = opts.some((o) => { const v = optionView(s, o); return v.visible && !v.locked; });
  return free ? opts : [...opts, ESCAPE];
}

export function openEvent(s, ev) {
  s.ev = {
    id: ev.id, tag: ev.tag ?? "ชีวิต", t: fill(s, ev.t), opts: withEscape(s, ev.o),
    important: !!ev.important, milestone: !!ev.milestone || String(ev.id).startsWith("cal"), noAuto: !!ev.noAuto,
  };
  if (ev.importantOnce) s.ev.importantOnce = true;
  if (ev.member) s.evMember = ev.member;
}

export function choose(s, i) {
  if (s.ev?.op) return hooks.decide?.(s, i);
  const ev = s.ev;
  const opt = ev?.opts[i];
  if (!opt) return;
  const view = optionView(s, opt);
  if (!view.visible || view.locked) return;
  // a story scene that has moved on since this event opened pays nothing and rolls nothing; it just closes
  if (ev.story && hooks.storyStale?.(s, ev)) { s.ev = null; return; }
  countUnseen(s, ev.opts);
  const ok = view.odds == null || ch(stream(s, "ev"), view.odds / 100);
  const out = ok ? opt.y : opt.n ?? {};
  s.ev = null;
  s.c["ev:" + ev.id] = (s.c["ev:" + ev.id] ?? 0) + 1;
  const tail = out.m ? ` ${fill(s, out.m)}` : "";
  const from = ev.fromPlan ? ` · มาจากแผน ${ev.fromPlan}` : "";
  log(s, ev.tag, `${ev.t} → ${opt.l}${tail}${from}`, ok ? "imp" : "bad");
  applyOutcome(s, out, opt.l, !!opt.risk);
  if (ev.story) hooks.storyResolve?.(s, ev, out);
}

// Options the player could not see or could not pick, counted for the death summary (never named).
export function countUnseen(s, opts) {
  const n = opts.filter((o) => { const v = optionView(s, o); return !v.visible || v.locked; }).length;
  s.c.unseen = (s.c.unseen ?? 0) + n;
}


// lethal: only options the player saw marked with risk can kill; anything else leaves at least 1 health.
export function applyOutcome(s, out, label = "เหตุการณ์", lethal = false) {
  // a hidden rank keeps the spotlight away: fame gains are halved
  if (out.fame) s.fame = Math.max(0, s.fame + (s.flags.hiddenRank && out.fame > 0 ? Math.ceil(out.fame / 2)
    : out.fame));
  if (out.jobXp && s.job) s.job.xp += out.jobXp;
  if (out.ally) hooks.ally?.(s, out.ally);
  hooks.facOutcome?.(s, out);
  if (out.gold) addLedger(s, out.goldLabel ?? label, out.gold);
  for (const [k, d] of Object.entries(out.st ?? {})) s.st[k] = Math.max(0, s.st[k] + d);
  for (const [k, d] of Object.entries(out.c ?? {})) {
    if (!s.c[k] && d > 0) s.c["at:" + k] = s.ageM; // when it began, for follow-ups that wait (`after`)
    s.c[k] = (s.c[k] ?? 0) + d;
  }
  Object.assign(s.flags, out.flags ?? {});
  if (out.mind) hooks.changeMind ? hooks.changeMind(s, out.mind) : (s.mind = clamp(s.mind + out.mind, 0, 100));
  if (out.injury) hooks.injure?.(s, out.injury[0], out.injury[1] ?? null);
  if (out.act) hooks.act[out.act]?.(s);
  if (out.next) s.sched.push({ id: out.next[0], atM: s.ageM + out.next[1] });
  if (out.hp) {
    s.hp = Math.min(100, s.hp + out.hp);
    if (s.hp <= 0 && lethal) hooks.die?.(s, out.cause ?? "บาดเจ็บสาหัส");
    else if (s.hp <= 0) s.hp = 1;
  }
}

// "Let fate choose": a seeded pick among the options you can take right now.
export function chooseByFate(s) {
  if (!s.ev || s.ev.op) return false;
  const open = s.ev.opts.map((o, i) => ({ i, v: optionView(s, o) })).filter((x) => x.v.visible && !x.v.locked);
  if (!open.length) return false;
  choose(s, open[Math.floor(rnd(stream(s, "fate")) * open.length)].i);
  return true;
}

// How an open event presents itself: a rarity word, and which part of a running story it is. Never says "secret".
export function eventKind(s) {
  const id = String(s.ev?.id ?? "");
  const [head, a, b] = id.split(":");
  const part = (n, len) => (len ? `ตอนที่ ${n + 1} จาก ${len}` : `ตอนที่ ${n + 1}`);
  // spec §11.1: a secret quest must not look special, so it wears the same "story" label as any chapter
  if (head === "sq" && resolvers.questLen) return { tier: "story", part: part(Number(b), resolvers.questLen(a)) };
  if (/^(fachi|facbad|heir)/.test(head)) return { tier: "rare" };
  if (head.startsWith("cal")) return { tier: "world" };
  if (head === "story") return { tier: "story" }; // a branching story: no part count, it has no fixed length
  const len = a != null && /^\d+$/.test(a) ? resolvers.storyLen?.(head) : 0;
  if (len) return { tier: "story", part: part(Number(a), len) };
  return { tier: s.ev.important ? "uncommon" : "common" };
}
