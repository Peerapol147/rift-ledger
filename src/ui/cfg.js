// Player settings: what is allowed and safe defaults, so a stored setting from any build can never stop the game
// from starting (UX-12) and every speed the screen offers really runs (UX-11).
export const SPEEDS = [1, 2, 4, 8, 16];
// seconds of real time per game step at each speed
export const STEP_S = { 1: 0.8, 2: 0.4, 4: 0.17, 8: 0.05, 16: 0.025 };
export const POLICY_IDS = ["stop", "important", "skip"];
// A first play leaves every choice to the player; the autopilot is theirs to turn on (UX-15, as in the model game).
export const DEFAULT_CFG = { speed: 2, policy: "stop", fs: 2 };

export function cleanCfg(raw) {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    speed: SPEEDS.includes(r.speed) ? r.speed : DEFAULT_CFG.speed,
    policy: POLICY_IDS.includes(r.policy) ? r.policy : DEFAULT_CFG.policy,
    fs: [1, 2, 3].includes(r.fs) ? r.fs : DEFAULT_CFG.fs,
  };
}
