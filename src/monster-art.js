// Story monster art. PixelLab sprite images are embedded by build.mjs as data URLs. Which creature wears which picture is in monsters.js.
import sewerHound from "../art/monsters/beast/sewer-hound.png";
import acidSnail from "../art/monsters/beast/acid-snail.png";
import flyingFish from "../art/monsters/beast/flying-fish.png";
import waterlessFish from "../art/monsters/beast/waterless-fish.png";
import signalBat from "../art/monsters/beast/signal-bat.png";
import glassFrog from "../art/monsters/beast/glass-frog.png";
import wireEater from "../art/monsters/construct/wire-eater.png";
import concreteHumanoid from "../art/monsters/construct/concrete-humanoid.png";
import streetlightSpider from "../art/monsters/construct/streetlight-spider.png";
import driverlessMachine from "../art/monsters/construct/driverless-machine.png";
import railCentipede from "../art/monsters/construct/rail-centipede.png";
import floatingEyes from "../art/monsters/spirit/floating-eyes.png";
import oldHouseOwner from "../art/monsters/spirit/old-house-owner.png";
import fleshMatriarch from "../art/monsters/boss/flesh-matriarch.png";
import parkingKing from "../art/monsters/boss/parking-king.png";
import timeEater from "../art/monsters/boss/time-eater.png";
import voicelessChoir from "../art/monsters/boss/voiceless-choir.png";
import scaffoldGiant from "../art/monsters/boss/scaffold-giant.png";
import waterShadowLord from "../art/monsters/boss/water-shadow-lord.png";
import stalledElevatorGod from "../art/monsters/boss/stalled-elevator-god.png";
import deathManager from "../art/monsters/boss/death-manager.png";
import cableDragon from "../art/monsters/boss/cable-dragon.png";
import thingOnTopFloor from "../art/monsters/boss/thing-on-top-floor.png";
import riftMother from "../art/monsters/boss/rift-mother.png";
import shipEatingVine from "../art/monsters/beast/ship-eating-vine.png";
import containerCrab from "../art/monsters/beast/container-crab.png";
import skyLureBird from "../art/monsters/beast/sky-lure-bird.png";
import pierShadow from "../art/monsters/spirit/pier-shadow.png";
import lastPassenger from "../art/monsters/spirit/last-passenger.png";
import offbeatReflection from "../art/monsters/spirit/offbeat-reflection.png";
import teacherStillTeaching from "../art/monsters/spirit/teacher-still-teaching.png";
import youFromTheOtherSide from "../art/monsters/spirit/you-from-the-other-side.png";
import eveningAnchor from "../art/monsters/boss/evening-anchor.png";
import lastMayor from "../art/monsters/boss/last-mayor.png";
import dryLighthouseKeeper from "../art/monsters/boss/dry-lighthouse-keeper.png";
import lastTideQueen from "../art/monsters/boss/last-tide-queen.png";
import saltGeneral from "../art/monsters/boss/salt-general.png";
import { MONSTERS, monsterOf, tintOf } from "./data/monsters.js";

const ART = {
  "beast/ship-eating-vine": shipEatingVine,
  "beast/container-crab": containerCrab,
  "beast/sky-lure-bird": skyLureBird,
  "spirit/pier-shadow": pierShadow,
  "spirit/last-passenger": lastPassenger,
  "spirit/offbeat-reflection": offbeatReflection,
  "spirit/teacher-still-teaching": teacherStillTeaching,
  "spirit/you-from-the-other-side": youFromTheOtherSide,
  "boss/evening-anchor": eveningAnchor,
  "boss/last-mayor": lastMayor,
  "boss/dry-lighthouse-keeper": dryLighthouseKeeper,
  "boss/last-tide-queen": lastTideQueen,
  "boss/salt-general": saltGeneral,
  "beast/waterless-fish": waterlessFish,
  "beast/sewer-hound": sewerHound, "beast/acid-snail": acidSnail, "beast/flying-fish": flyingFish, "beast/signal-bat": signalBat, "beast/glass-frog": glassFrog,
  "construct/wire-eater": wireEater, "construct/concrete-humanoid": concreteHumanoid, "construct/streetlight-spider": streetlightSpider, "construct/driverless-machine": driverlessMachine, "construct/rail-centipede": railCentipede,
  "spirit/floating-eyes": floatingEyes, "spirit/old-house-owner": oldHouseOwner,
  "boss/flesh-matriarch": fleshMatriarch, "boss/parking-king": parkingKing, "boss/time-eater": timeEater, "boss/voiceless-choir": voicelessChoir, "boss/scaffold-giant": scaffoldGiant,
  "boss/water-shadow-lord": waterShadowLord, "boss/stalled-elevator-god": stalledElevatorGod, "boss/death-manager": deathManager, "boss/cable-dragon": cableDragon,
  "boss/thing-on-top-floor": thingOnTopFloor, "boss/rift-mother": riftMother,
};
// Each picture is decoded once; a borrowed body is tinted per name the first time that name is asked for.
const base = {}, raster = {};
for (const [key, url] of Object.entries(ART)) {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true }); context.imageSmoothingEnabled = false; context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data, pixels = new Uint32Array(canvas.width * canvas.height);
    for (let i = 0; i < pixels.length; i++) { const j = i * 4, a = data[j + 3]; if (a) pixels[i] = ((a << 24) | (data[j + 2] << 16) | (data[j + 1] << 8) | data[j]) >>> 0; }
    base[key] = { width: canvas.width, height: canvas.height, pixels };
  };
  image.src = url;
}
function tinted(b, name) {
  const t = tintOf(name), pixels = new Uint32Array(b.pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    const c = b.pixels[i]; if (!c) continue; let r = c & 255, g = (c >>> 8) & 255, bl = (c >>> 16) & 255;
    if (r + g + bl > 120 && r + g + bl < 690) { r = (r * 3 + t[0]) >> 2; g = (g * 3 + t[1]) >> 2; bl = (bl * 3 + t[2]) >> 2; }
    pixels[i] = ((c & 0xff000000) | (bl << 16) | (g << 8) | r) >>> 0;
  }
  return { ...b, pixels };
}
// boss: what the fight says the foe is, used only for names missing from monsters.js.
export function monsterRaster(name, boss) {
  if (raster[name]) return raster[name];
  const m = monsterOf(name, boss), b = base[m.art]; if (!b) return null;
  return (raster[name] = { ...(m.borrow ? tinted(b, name) : b), fly: m.fly, big: m.kind === "boss" });
}
// Portraits for the DOM: one CSS class per picture, so a page full of them never repeats the image data.
const cls = (art) => "mon-" + art.replace("/", "-");
export const monsterCss = () => Object.entries(ART).map(([k, url]) => `.${cls(k)}{background-image:url(${url})}`).join("");
export function monsterIcon(name, boss, hidden = false) {
  const m = monsterOf(name, boss), t = tintOf(name);
  return `<i class="mon ${cls(m.art)}${hidden ? " unk" : ""}"${m.borrow && !hidden ? ` style="filter:hue-rotate(${t[0] * 2}deg)"` : ""}></i>`;
}
export { MONSTERS };
