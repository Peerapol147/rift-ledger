// Plays lives with a random player and lists what should never happen: a random event coming more often than it
// declares (once, or cap: n), broken text in the log, and events that contradict the life. Used by
// test/lifecheck.test.mjs (few lives) and tools/lifecheck.mjs (many).
import * as C from "../src/core/index.js";
import { mk, rnd } from "../src/core/rng.js";
import { ALL_EVENTS } from "../src/data/events/index.js";

const RANDOM = new Map(ALL_EVENTS.filter((e) => !e.k).map((e) => [String(e.id), e]));
const BAD_TEXT = [/[A-Z]แตก/, /[ก-๙][A-Z][a-z]{2,}/, /undefined|NaN|\{[a-z]+\}/];

// What is wrong with opening this event in this life right now, or "".
function misfit(s, id) {
  const a = C.ageY(s);
  if (id === "hunterBreakCall" && (a > 60 || s.flags.stoppedHunting)) return `hunterBreakCall at ${a}`;
  if (id === "adultLove" && !s.c.dating) return "adultLove with no one met";
  return "";
}

export function checkLives(n, prefix = "lc") {
  const repeats = new Map(), badText = new Map(), ageMisfits = [];
  const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  for (let i = 0; i < n; i++) {
    const s = C.newLife(`${prefix}-${i}`), R = mk(s.seed, "lifecheck"), opened = new Map();
    let last = null;
    for (let step = 0; step < 8000 && !s.dead; step++) {
      if (!s.ev) {
        if (s.ageM % 6 === 0 && !s.op) {
          const ids = C.focusList(s).map((f) => f.id);
          C.setFocus(s, ids[Math.floor(rnd(R) * ids.length)]);
        }
        C.advance(s);
        continue;
      }
      if (s.ev !== last && !s.ev.op) {
        const id = String(s.ev.id);
        bump(opened, id);
        const why = misfit(s, id);
        if (why) ageMisfits.push(`${s.seed}: ${why}`);
      }
      last = s.ev;
      const open = s.ev.opts.map((o, j) => ({ j, v: C.optionView(s, o) })).filter((x) => x.v.visible && !x.v.locked);
      if (!open.length) { s.ev = null; continue; }
      C.choose(s, open[Math.floor(rnd(R) * open.length)].j);
    }
    for (const [id, times] of opened) {
      const e = RANDOM.get(id);
      if (e && times > (e.once ? 1 : e.cap ?? 1)) bump(repeats, id);
    }
    for (const l of s.log) for (const re of BAD_TEXT) {
      const m = l.text.match(re);
      if (m) bump(badText, l.text.slice(Math.max(0, m.index - 20), m.index + 25));
    }
  }
  return { lives: n, repeats, badText, ageMisfits };
}
