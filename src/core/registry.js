// Shared hook lists that core modules register into. This file imports nothing, so any core module can be
// imported on its own without an initialisation-order error. core/index.js decides the wiring order.
export const monthly = []; // fn(s, step) each tick, in registration order
export const onNewLife = []; // fn(s) after a life is created
export const deathHooks = []; // fn(s, cause) -> true cancels the death (revival item)
export const gearHooks = []; // fn(s) -> { atk, def, hp } added to hero power
export const afterOpHooks = []; // fn(s, op, result) after an operation pays out
export const hooks = { die: null, injure: null, changeMind: null, decide: null, act: {} };
export const resolvers = { role: () => null, skillName: (id) => id, jobName: (id) => id, clsName: (id) => id };
