// What kind of life an event belongs to, so a plan can pull its kind of event. Read from the event itself: the stat
// its options touch most, its tag, whether it is a hunter's. `kinds: [...]` on the event overrides the guess.
// Spec: docs/superpowers/specs/2026-11-13-life-plans-and-choices-design.md.
export const KINDS = ["study", "body", "social", "money", "mind", "luck", "hunt"];

const BY_STAT = { int: "study", str: "body", agi: "body", cha: "social", wil: "mind", luk: "luck" };
const BY_TAG = {
  "งาน": "money", "เงิน": "money", "ความสัมพันธ์": "social", "ครอบครัว": "social", "ร่างกาย": "body",
  "การเรียน": "study", "ฮันเตอร์": "hunt", "เกตแตก": "hunt", "ทีม": "hunt", "กิลด์": "hunt",
};
const memo = new WeakMap();

export function kindsOf(ev) {
  if (ev.kinds) return ev.kinds;
  if (memo.has(ev)) return memo.get(ev);
  const count = {};
  for (const o of ev.o ?? []) {
    const seen = new Set(Object.keys(o.y?.st ?? {}).map((k) => BY_STAT[k]).filter(Boolean));
    for (const k of seen) count[k] = (count[k] ?? 0) + 1;
  }
  const top = Math.max(0, ...Object.values(count));
  const out = new Set(Object.keys(count).filter((k) => count[k] === top && top > 0));
  if (BY_TAG[ev.tag]) out.add(BY_TAG[ev.tag]);
  if (!out.size) {
    const ys = (ev.o ?? []).map((o) => o.y ?? {});
    if (ys.some((y) => (y.gold ?? 0) > 0 || y.jobXp)) out.add("money");
    else if (ys.some((y) => (y.mind ?? 0) > 0)) out.add("mind");
  }
  if (ev.hunter === true) out.add("hunt");
  const list = KINDS.filter((k) => out.has(k));
  memo.set(ev, list);
  return list;
}
