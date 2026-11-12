import { KID_EVENTS } from "./kid.js";
import { TEEN_EVENTS } from "./teen.js";
import { ADULT_EVENTS } from "./adult.js";
import { HUNTER_EVENTS } from "./hunter.js";
import { MORE_EVENTS } from "./more.js";
import { SYSTEM_EVENTS } from "./systems.js";
import { PLACE_EVENTS_2 } from "./places2.js";
import { AGE_EVENTS } from "./ages.js";
import { QUIET_EVENTS } from "./quiet.js";
export const ALL_EVENTS = [...KID_EVENTS, ...TEEN_EVENTS, ...ADULT_EVENTS, ...HUNTER_EVENTS, ...MORE_EVENTS,
  ...SYSTEM_EVENTS, ...PLACE_EVENTS_2,
  ...AGE_EVENTS, ...QUIET_EVENTS];

// Habits of life that may come back once more (5 years apart at least). Every other random event comes once.
const HABITS = ["adultRent", "adultHealth", "adultScam", "midBackPain", "oldScamCall", "oldHospital", "oldHealth",
  "lateHealthCheck", "eldClinic"];
for (const e of ALL_EVENTS) if (HABITS.includes(e.id) && e.cap == null && !e.once) e.cap = 2;
