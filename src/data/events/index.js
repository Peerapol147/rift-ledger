import { KID_EVENTS } from "./kid.js";
import { TEEN_EVENTS } from "./teen.js";
import { ADULT_EVENTS } from "./adult.js";
import { HUNTER_EVENTS } from "./hunter.js";
import { MORE_EVENTS } from "./more.js";
import { SYSTEM_EVENTS } from "./systems.js";
import { PLACE_EVENTS_2 } from "./places2.js";
import { AGE_EVENTS } from "./ages.js";
import { QUIET_EVENTS } from "./quiet.js";
import { LIFE_EVENTS } from "./life.js";
export const ALL_EVENTS = [...KID_EVENTS, ...TEEN_EVENTS, ...ADULT_EVENTS, ...HUNTER_EVENTS, ...MORE_EVENTS,
  ...SYSTEM_EVENTS, ...PLACE_EVENTS_2,
  ...AGE_EVENTS, ...QUIET_EVENTS, ...LIFE_EVENTS];

// One-of-a-kind happenings: a strange ship on the beach or a river frozen in August is a story once and a loop the
// second time. Everything listed here can happen once in a life.
const ONE_OF_A_KIND = [
  "hktStorm", "hktBoat", "hktResort", "selHanRiver", "selIdol", "selIdolGate", "icnPort", "icnAirportRadar", "pusPort",
  "cnxElephant", "cnxLantern", "bkkCanal", "kidCard", "kidHunterCard", "kidStray", "kidLostCat", "babySick",
  "teenClub", "teenPhone", "teenFight", "midTeenNext", "midCareerDoubt", "oldGarden", "oldRiftDream", "smithSecret",
  "vaultHeist", "researchStudy", "guildYoung", "jTeach", "jAppraise", "jPress", "jPolice",
  "jobOffice2", "jobShop2", "jobDoc2", "jobPorter2", "jobPress2", "jobPolice2", "jobTeach2", "jobAgency2",
  "jobAppraise2", "jobRescue2", "jobCook2",
];
// What an event takes for granted about the life it lands in, when the text does not say it: you rent, you are
// single, you are not in a lecture hall all day.
const PREMISE = {
  babyDrawing: { if: { "ev:kidFirstDay": 1 } },
  adultRent: { max: { ownHome: 0 } },
  yaMoveOut: { max: { ownHome: 0 } },
  adultLove: { max: { married: 0 } },
  selIdolGate: { max: { "ev:selIdol": 0 } },
  selIdol: { max: { "ev:selIdolGate": 0 } },
  kidHunterCard: { max: { "ev:kidCard": 0 } },
  kidCard: { max: { "ev:kidHunterCard": 0 } },
};
for (const e of ALL_EVENTS) {
  if (ONE_OF_A_KIND.includes(e.id)) e.once = true;
  const p = PREMISE[e.id];
  if (p?.max) e.max = { ...e.max, ...p.max };
  if (p?.if) e.if = { ...e.if, ...p.if };
  if (e.id === "kidFirstDay") e.age = [3, 5];
  if (e.id === "babySick") { e.country = "th"; e.age = [3, 6]; } // the blessed thread is a Thai grandmother's remedy
}
