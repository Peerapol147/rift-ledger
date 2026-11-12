// Secret quests: three per life, drawn by seed at birth. Never labelled; each step waits for the last to advance.
import { ri, shuf } from "./rng.js";
import { stream, ageY, onNewLife } from "./state.js";
import { openEvent, val } from "./events.js";
import { monthly, hooks, resolvers } from "./registry.js";
import { SECRETS } from "../data/secrets.js";

const DRAWN = Object.keys(SECRETS).filter((k) => !SECRETS[k].truth);
export const TRUTH_IDS = Object.keys(SECRETS).filter((k) => SECRETS[k].truth);
onNewLife.push((s) => { s.secrets = shuf(stream(s, "secret"), DRAWN).slice(0, 3); });
// the three drawn quests plus the world-secret lines every life can find
export const questsOf = (s) => [...new Set([...(s.secrets ?? []), ...TRUTH_IDS])].filter((id) => SECRETS[id]);

function started(s, q) {
  const st = q.start, a = ageY(s);
  if (a < st.age[0] || a > st.age[1]) return false;
  if (st.hunter && !s.hunter) return false;
  if (st.if && Object.entries(st.if).some(([k, v]) => val(s, k) < v)) return false;
  if (st.any && !st.any.some((cond) => Object.entries(cond).every(([k, v]) => val(s, k) >= v))) return false;
  return true;
}

export function secretMonth(s) {
  if (s.ev) return;
  for (const id of questsOf(s)) {
    const q = SECRETS[id], done = s.c["sq:" + id] ?? 0, opened = s.c["sqo:" + id] ?? 0;
    if (opened >= q.steps.length || opened > done) continue; // finished, or waiting on a step the player did not take
    if (opened === 0 && !started(s, q)) continue;
    const key = "sqn:" + id;
    s.c[key] ??= s.ageM + ri(stream(s, "secret"), q.gap[0], q.gap[1]);
    if (s.ageM < s.c[key]) continue;
    s.c["sqo:" + id] = opened + 1;
    s.c[key] = s.ageM + ri(stream(s, "secret"), q.gap[0], q.gap[1]);
    openEvent(s, { ...q.steps[opened], id: `sq:${id}:${opened}`, important: true });
    return;
  }
}

// Rewards
hooks.act.ceilUp = (s) => {
  if (s.hunter) s.hunter.ceil = Math.max(s.hunter.ceil, Math.min(6, s.hunter.ceil + 1));
};
hooks.act.subwayGift = (s) => {
  if (s.hunter) hooks.act.ceilUp(s);
  else hooks.act.awakenEvent?.(s);
};

monthly.push(secretMonth);
resolvers.questLen = (id) => SECRETS[id]?.steps.length;

// Two truths, or one truth and the sight of floor 30 with your own eyes, show the shape of the whole:
// the next empty floor is ours.
monthly.push((s) => {
  const n = TRUTH_IDS.filter((id) => s.flags[id]).length;
  if (s.ev || s.c.truthFinal || !(n >= 2 || (n >= 1 && (s.c.floor ?? 0) >= 30))) return;
  s.c.truthFinal = 1;
  openEvent(s, { id: "truthFinal", tag: "ความลับของโลก", important: true,
    t: "คืนนั้นคุณเรียงทุกอย่างที่รู้ไว้บนโต๊ะ ทั้งคำสวด ตัวเลข และสมุดบัญชี ทุกเส้นชี้ไปที่เดียวกัน: "
      + "ชั้นว่างบนยอดหอคอยรอโลกของเราอยู่",
    o: [
      { l: "เล่าให้โลกรู้", y: { m: "บางคนเชื่อ ส่วนใหญ่หัวเราะ แต่ชื่อคุณถูกพูดถึงไปอีกนาน", fame: 8,
        fac: { state: -5 } } },
      { l: "เก็บไว้คนเดียว", y: { m: "คุณใช้ชีวิตต่อไป เพียงแต่มองท้องฟ้านานขึ้นทุกเย็น", mind: 5 } },
      { l: "ตั้งใจจะไปดูชั้นนั้นด้วยตาตัวเองสักวัน", y: { m: "เป้าหมายใหม่ของชีวิตคุณอยู่สูงกว่าเมฆ",
        st: { wil: 1 } } },
    ] });
});
