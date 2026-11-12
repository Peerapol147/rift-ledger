// Visual time only: these idle movements never advance the life simulation.
export function youngMotion(life, seconds, calm = false) {
  if (calm) return {x:0, lift:0};
  if (life === 'infant') return {x:Math.round(Math.sin(seconds * 1.8)), lift:0};
  if (life === 'toddler') return {
    x:Math.round(Math.sin(seconds * 1.3) * 5),
    lift:Math.round(Math.max(0, Math.sin(seconds * 5)) * 2),
  };
  return {x:0, lift:0};
}
