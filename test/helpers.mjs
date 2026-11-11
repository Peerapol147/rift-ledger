import { tick, choose, optionView } from "../src/core/index.js";

// Picks the first visible, unlocked option.
export const firstOpen = (s) => s.ev.opts.findIndex((o) => { const v = optionView(s, o); return v.visible && !v.locked; });

export function playUntil(s, stop, maxTicks = 5000) {
  for (let i = 0; i < maxTicks && !s.dead && !stop(s); i++) {
    if (s.ev) choose(s, firstOpen(s));
    else tick(s);
  }
  return s;
}

export const playAll = (s) => playUntil(s, () => false, 20000);
