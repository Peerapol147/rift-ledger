// What a life leaves behind: children, assets and enemies. Kept for a later play-as-your-child phase. Spec §6.9.
import { ITEMS } from "../data/items.js";

export function addEnemy(s, name, why) {
  if (!name) return;
  s.enemies = (s.enemies ?? []).filter((e) => e.n !== name);
  s.enemies.push({ n: name, why, m: s.ageM });
}

const worth = (list) => (list ?? []).reduce((a, i) => a + (ITEMS[i.id]?.price ?? 0) * 0.5, 0);

export function legacyOf(s) {
  const items = worth(s.items) + worth(s.store?.home) + worth(s.store?.vault);
  return {
    kids: s.c.kids ?? 0,
    assets: Math.round(Math.max(0, s.gold) + items),
    enemies: (s.enemies ?? []).map((e) => e.n),
  };
}
