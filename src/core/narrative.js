// Branching stories: nodes that wait, routes the player never sees named, endings, and a cast bound once from the
// list of people. A node opens as an ordinary event (today's option shape plus go/end on the outcome), so odds,
// chips, locks and the autopilot work unchanged. Spec: 2026-11-13-lives-that-remember-design.md §5.3.
import { ri } from "./rng.js";
import { stream, worldMonth, log } from "./state.js";
import { openEvent, applyOutcome } from "./events.js";
import { monthly, hooks } from "./registry.js";
import { ensurePerson, personById, personPresent, changeRelation, remember } from "./people.js";
import { STORY_DEFS } from "../data/narrative/index.js";

export { STORY_DEFS };

const castText = (s, st, text) => String(text ?? "").replace(/\{cast:(\w+)\}/g,
  (_, r) => personById(s, st.cast?.[r])?.name ?? "คนหนึ่ง");
const textOf = (s, st, t) => castText(s, st, typeof t === "function" ? t(s, st) : t);

function enterNode(s, id, st, node) {
  const def = STORY_DEFS[id], n = def.nodes[node];
  st.node = node;
  const [a, b] = n.delay ?? [0, 0];
  st.due = worldMonth(s) + ri(stream(s, "story:" + id), a, b);
}

function bindCast(s, def, st) {
  for (const [role, spec] of Object.entries(def.cast ?? {})) {
    if (st.cast[role]) continue;
    // data cannot import the RNG, so a cast spec gets a roll on this story's own stream
    const got = spec(s, st, (a, b) => ri(stream(s, "story:" + def.id), a, b));
    if (got) st.cast[role] = got.id ?? ensurePerson(s, got.input, got.key);
  }
}

export function startStory(s, id) {
  const def = STORY_DEFS[id];
  if (!def || s.narrative.stories[id]) return false;
  const st = (s.narrative.stories[id] = { node: def.entry, route: null, vars: {}, cast: {}, due: 0,
    status: "active", ending: null, lastText: "", lastM: null });
  bindCast(s, def, st);
  enterNode(s, id, st, def.entry);
  return true;
}

export function endStory(s, id, ending) {
  const st = s.narrative.stories[id];
  if (!st || st.status === "done") return;
  st.status = "done"; st.ending = ending;
  STORY_DEFS[id].endings[ending]?.apply?.(s, st);
}

// A paused story (the life left the work it needs) keeps its due date; too long away and it closes quietly.
function keepPace(s, id, def, st) {
  if (!def.active) return true;
  const on = def.active(s, st);
  if (st.status === "active" && !on) { st.status = "paused"; st.pausedM = worldMonth(s); return false; }
  if (st.status === "paused") {
    if (on) { st.status = "active"; return true; }
    if (def.pauseMax != null && worldMonth(s) - st.pausedM > def.pauseMax) {
      if (def.pauseLog) log(s, def.tag ?? "ชีวิต", textOf(s, st, def.pauseLog), "");
      endStory(s, id, def.pauseEnd);
    }
    return false;
  }
  return true;
}

export function narrativeMonth(s) {
  if (s.ev || s.op || !s.narrative) return;
  for (const id of Object.keys(STORY_DEFS).sort()) {
    const def = STORY_DEFS[id];
    const st = s.narrative.stories[id];
    if (!st) { if (def.discover(s)) startStory(s, id); continue; }
    if (st.status === "done" || !keepPace(s, id, def, st)) continue;
    if (st.due > worldMonth(s)) continue;
    let node = def.nodes[st.node];
    if (node.needCast?.some((r) => !personPresent(s, st.cast[r])) && def.castGone && st.node !== def.castGone) {
      st.resume = st.node;
      enterNode(s, id, st, def.castGone);
      node = def.nodes[def.castGone];
    }
    if (node.skip?.when(s, st)) { enterNode(s, id, st, node.skip.to); continue; } // this life passes the scene by
    if (node.when && !node.when(s, st)) continue;
    if (node.beat) { resolveOut(s, id, st, node.beat, true); continue; }
    const fillOut = (o) => o && { ...o, m: o.m == null ? o.m : textOf(s, st, o.m) };
    openEvent(s, { id: `story:${id}:${st.node}`, tag: def.tag ?? "ชีวิต", t: textOf(s, st, node.t), important: true,
      o: node.o.filter((o) => !o.show || o.show(s, st))
        .map((o) => ({ ...o, l: textOf(s, st, o.l), y: fillOut(o.y), n: fillOut(o.n) })) });
    s.ev.story = { id, node: st.node };
    return;
  }
}

function resolveOut(s, id, st, out, beat = false) {
  const def = STORY_DEFS[id];
  if (out.route) st.route = out.route;
  if (out.vars) Object.assign(st.vars, out.vars);
  const text = out.m ? textOf(s, st, out.m) : "";
  if (beat) { if (text) log(s, def.tag ?? "ชีวิต", text, ""); applyOutcome(s, out, def.title); }
  for (const [role, r] of Object.entries(out.rel ?? {})) {
    const pid = st.cast[role];
    if (!pid) continue;
    changeRelation(s, pid, { trust: r.trust ?? 0, owe: r.owe ?? 0, tag: r.tag });
    if (r.mem) remember(s, pid, { id: `${id}:${st.node}`, text: textOf(s, st, r.mem), worldM: worldMonth(s) });
  }
  if (text) { st.lastText = text; st.lastM = worldMonth(s); }
  if (out.end) endStory(s, id, out.end);
  else if (out.go) enterNode(s, id, st, out.go);
  else if (out.goResume && st.resume) enterNode(s, id, st, st.resume);
  else enterNode(s, id, st, st.node); // no way on (the escape option): the same scene waits its delay again
}

// choose() calls this after the outcome is applied; a stale event (the story moved meanwhile) changes nothing.
// Asked by choose() before anything is rolled or paid: is this open story event out of date?
hooks.storyStale = (s, ev) => {
  const st = s.narrative?.stories[ev.story.id];
  return !st || st.status !== "active" || st.node !== ev.story.node;
};
hooks.storyResolve = (s, ev, out) => {
  const st = s.narrative?.stories[ev.story.id];
  if (!st || st.status !== "active" || st.node !== ev.story.node) return;
  resolveOut(s, ev.story.id, st, out ?? {});
};

export function followedStory(s) {
  const list = Object.entries(s.narrative?.stories ?? {}).filter(([, st]) => st.lastM != null && st.status !== "done");
  if (!list.length) return null;
  const [id, st] = list.sort((a, b) => b[1].lastM - a[1].lastM)[0];
  return { title: STORY_DEFS[id].title, last: st.lastText };
}

// Keys a story may use; anything else is a typo that would do nothing at runtime (P1 review Task D).
const NODE_KEYS = new Set(["t", "delay", "needCast", "when", "o", "beat", "skip", "reach"]);
const OPT_KEYS = new Set(["l", "s", "diff", "need", "risk", "nerve", "danger", "d", "y", "n", "show", "noAuto"]);
const OUT_KEYS = new Set(["m", "fame", "jobXp", "ally", "fac", "gold", "goldLabel", "st", "hp", "mind", "c", "flags",
  "act", "injury", "next", "cause", "go", "end", "route", "vars", "rel", "goResume"]);
const unknown = (obj, keys) => Object.keys(obj ?? {}).filter((k) => !keys.has(k));

// Data checks run by the tests: every way on exists, every check can fail somewhere, every node can be reached,
// every cast role named in text is declared.
export function validateNarrative(defs) {
  const issues = [];
  for (const [id, d] of Object.entries(defs)) {
    const nodes = d.nodes ?? {}, ends = d.endings ?? {}, roles = new Set(Object.keys(d.cast ?? {}));
    if (!nodes[d.entry]) issues.push(`${id}: entry ${d.entry} missing`);
    if (d.castGone && !nodes[d.castGone]) issues.push(`${id}: castGone ${d.castGone} missing`);
    if (d.pauseEnd && !ends[d.pauseEnd]) issues.push(`${id}: pauseEnd ${d.pauseEnd} missing`);
    const reach = new Set([d.entry, d.castGone].filter(Boolean)), seen = new Set();
    const outsOf = (n) => [...(n.o ?? []).flatMap((o) => [o.y, o.n]), n.beat].filter(Boolean);
    const stack = [...reach];
    while (stack.length) {
      const k = stack.pop();
      if (seen.has(k) || !nodes[k]) continue;
      seen.add(k);
      for (const out of outsOf(nodes[k])) if (out.go && !seen.has(out.go)) stack.push(out.go);
      if (nodes[k].skip) stack.push(nodes[k].skip.to);
      if (nodes[k].reach) stack.push(...nodes[k].reach);
    }
    for (const [k, n] of Object.entries(nodes)) {
      if (!seen.has(k)) issues.push(`${id}: ${k} unreachable`);
      for (const bad of unknown(n, NODE_KEYS)) issues.push(`${id}.${k}: unknown node key ${bad}`);
      for (const o of n.o ?? []) {
        for (const bad of unknown(o, OPT_KEYS)) issues.push(`${id}.${k}: unknown option key ${bad}`);
        for (const out of [o.y, o.n]) for (const bad of unknown(out, OUT_KEYS)) {
          issues.push(`${id}.${k}: unknown outcome key ${bad}`);
        }
      }
      for (const bad of unknown(n.beat, OUT_KEYS)) issues.push(`${id}.${k}: unknown outcome key ${bad}`);
      for (const o of n.o ?? []) if ((o.s || o.risk) && !o.n) issues.push(`${id}.${k}: "${o.l}" has a check but no n`);
      if (n.skip && !nodes[n.skip.to]) issues.push(`${id}.${k}: skip to ${n.skip.to}`);
      for (const out of outsOf(n)) {
        if (out.go && !nodes[out.go]) issues.push(`${id}.${k}: go ${out.go}`);
        if (out.end && !ends[out.end]) issues.push(`${id}.${k}: end ${out.end}`);
      }
      const texts = [n.t, ...(n.o ?? []).flatMap((o) => [o.l, o.y?.m, o.n?.m]), n.beat?.m]
        .filter((x) => typeof x === "string");
      for (const t of texts) for (const [, r] of t.matchAll(/\{cast:(\w+)\}/g)) {
        if (!roles.has(r)) issues.push(`${id}.${k}: cast ${r} not declared`);
      }
    }
  }
  return issues;
}

// Before the old chapter chains, so a story's month is not taken by them.
const at = monthly.findIndex((f) => f.name === "storyMonth");
monthly.splice(at < 0 ? monthly.length : at, 0, narrativeMonth);
