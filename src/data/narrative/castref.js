// Shared bits for the main cast's stories (data only: reads the save, never imports core).
export const who = (castId) => (s) => {
  const p = Object.values(s.world.people ?? {}).find((x) => x.cast === castId);
  return p ? { id: p.id } : null;
};
export const personOf = (s, st, role) => s.world.people?.[st.cast[role]] ?? null;
export const trust = (s, st, role) => s.relations?.[st.cast[role]]?.trust ?? 0;
export const first = (s, st, role, fallback) => s.relations?.[st.cast[role]]?.memories?.[0]?.text ?? fallback;
export const latest = (s, st, role, fallback) => s.relations?.[st.cast[role]]?.memories?.at(-1)?.text ?? fallback;
export const age = (s) => Math.floor(s.ageM / 12);
export const go = (node, m, extra = {}) => ({ m, go: node, ...extra });
export const end = (ending, m, extra = {}) => ({ m, end: ending, ...extra });
export const mem = (role, text, trustDelta = 0, extra = {}) => ({ [role]: { trust: trustDelta, mem: text, ...extra } });
export const hunts = (s) => !!s.hunter && !s.flags?.stoppedHunting;
