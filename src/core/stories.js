// Story chains: each career, class or hunter role has a fixed run of chapters that arrive every few months while
// the life is in that line. Changing line pauses a chain; coming back resumes it. Spec §4.1 (3).
import { ri } from "./rng.js";
import { stream, stageOf } from "./state.js";
import { openEvent } from "./events.js";
import { canHunt } from "./hunter.js";
import { monthly, resolvers } from "./registry.js";
import { CLASSES } from "../data/classes.js";
import { STORIES } from "../data/stories/index.js";

// What a life "is" right now, for matching chains: its job, its class and its hunter role.
function identity(s) {
  const ids = new Set();
  if (s.job) ids.add(s.job.id);
  if (s.hunter) {
    ids.add(s.hunter.cls);
    ids.add(CLASSES[s.hunter.cls]?.role);
  }
  return ids;
}

export function activeChains(s) {
  const me = identity(s);
  return Object.keys(STORIES).sort().filter((id) => {
    const c = STORIES[id];
    if ((s.c["ch:" + id] ?? 0) >= c.chapters.length) return false;
    if (c.hunter && (!canHunt(s) || stageOf(s) === "old")) return false;
    return c.who.some((w) => me.has(w));
  });
}

const gapOf = (s, c) => ri(stream(s, "story"), c.gap[0], c.gap[1]);

export function storyMonth(s) {
  for (const id of activeChains(s)) {
    const c = STORIES[id], key = "next:" + id;
    // a chain coming back after a pause (other line of work, a hunting break) waits a fresh gap, not zero months
    const seen = "seen:" + id, back = s.c[seen] != null && s.ageM - s.c[seen] > 3;
    s.c[seen] = s.ageM;
    if (s.c[key] == null || back) s.c[key] = s.ageM + gapOf(s, c);
    if (s.ageM < s.c[key]) continue;
    const n = s.c["ch:" + id] ?? 0;
    s.c["ch:" + id] = n + 1;
    s.c[key] = s.ageM + gapOf(s, c);
    openEvent(s, { ...c.chapters[n], id: `${id}:${n}`, important: true });
    return; // at most one chapter a month
  }
}

monthly.push(storyMonth);
resolvers.storyLen = (id) => STORIES[id]?.chapters.length;
