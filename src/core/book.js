// The collection book across lives: what a life leaves behind, and what it opens for the next. Spec §10.
import { ageY, log } from "./state.js";
import { stream } from "./state.js";
import { wp } from "./rng.js";
import { businesses } from "./business.js";
import { questsOf } from "./secrets.js";
import { SECRETS } from "../data/secrets.js";
import { UNLOCK_FAMILIES, STAT_BONUS, BONUS_CAP } from "../data/unlocks.js";
import { FAMILIES } from "../data/families.js";

// What one finished life adds to the book, as [kind, id] pairs.
export function lifeRecord(s) {
  const out = [];
  for (const id of Object.keys(s.world.done)) if (id.startsWith("cal")) out.push(["cal", id]);
  if (s.hunter) out.push(["cls", s.hunter.cls]);
  for (const id of questsOf(s)) if ((s.c["sq:" + id] ?? 0) >= SECRETS[id].steps.length) out.push(["secret", id]);
  if (s.c.truthFinal) out.push(["flag", "truthFinal"]);
  if (s.dead?.cause?.startsWith("พ่ายแก่")) out.push(["death", "boss"]);
  if (s.dead?.cause === "อายุขัย" && ageY(s) >= 80) out.push(["death", "old80"]);
  if (businesses(s).length) out.push(["flag", "business"]);
  for (const f of ["gotToken", "legendCraft", "ownForge"]) if (s.flags[f]) out.push(["flag", f]);
  if (s.guild?.role === "master") out.push(["flag", "guildMaster"]);
  if ((s.gen ?? 1) >= 2) out.push(["flag", "heir"]);
  return out;
}

const has = (b, [kind, id]) => {
  if (kind === "count") { const [k, n] = id.split(":"); return (b.seen[k]?.length ?? 0) >= Number(n); }
  return b.seen[kind]?.includes(id) ?? false;
};
export const unlocked = (b, need) => need.some((p) => has(b, p));

export function bookStatus(b) {
  const families = UNLOCK_FAMILIES.map((u) => ({ ...u.family, open: unlocked(b, u.need) }));
  let total = 0;
  const bonuses = STAT_BONUS.map((x) => {
    const open = unlocked(b, x.need) && total + x.pct <= BONUS_CAP;
    if (open) total += x.pct;
    return { ...x, open };
  });
  return { families, bonuses, total };
}

// Runs once when a new life is born: may swap in an unlocked family, applies the stat bonuses.
export function applyUnlocks(s, b) {
  if (s.flags.unlocksApplied) return;
  s.flags.unlocksApplied = true;
  const st = bookStatus(b);
  const pool = [...FAMILIES, ...st.families.filter((f) => f.open)].filter((f) => f.country === s.country);
  const pick = wp(stream(s, "unlock"), pool);
  if (!s.heir && st.families.some((f) => f.open && f.id === pick.id)) { // an heir keeps the parent's family
    const old = FAMILIES.find((f) => f.id === s.family);
    for (const [k, v] of Object.entries(old?.st ?? {})) s.st[k] -= v;
    s.family = pick.id;
    for (const [k, v] of Object.entries(pick.st)) s.st[k] += v;
    s.unlockFamily = { ...pick, gold: Number(pick.gold) || 0 };
    log(s, "ชะตา", `ครอบครัวของคุณคือ${pick.n}: ${pick.d}`, "imp");
  }
  for (const x of st.bonuses) if (x.open) s.st[x.stat] *= 1 + x.pct / 100;
}
