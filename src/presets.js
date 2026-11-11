// Game moments mapped to pixelfx effects. build.mjs bundles only what is named here and in src/data/elements.js.
// Skill visuals only: no stock characters, chests, item icons or banners. build.mjs refuses effects that draw the stock body.
export const PRESET = { levelup: ["holy/sunburst"], coin: ["pickups/collect-burst"], loot: ["pickups/collect-burst"], skill: ["arcane/rune-circle"], heal: ["holy/heal-aoe"], love: ["pickups/collect-burst"], awaken: ["arcane/magic-circle-cast", "holy/sunburst"], rank: ["explosions/firework-burst"], quest: ["arcane/spell-charge"], enh_ok: ["impacts/crit-hit"], enh_fail: ["impacts/parry"], break: ["explosions/implosion"], death: ["shadow/dark-explosion"], surge: ["scifi/emp-blast"], event: [] };
export const AMBIENT = { rain: "weather/rain", clouds: "weather/clouds", fog: "weather/fog", portal: "arcane/portal", fireflies: "weather/fireflies", rays: "weather/god-rays" };
export const HIT = ["impacts/hit-spark", "impacts/blunt-hit", "impacts/crit-hit", "holy/heal-aoe"];
// How each profession sprite (art/professions) fights, read from what the model holds. Visual only, stats untouched.
// hit: lands on the foe. go: projectile flown from the weapon to the foe. from: launched at the hero, travels by itself.
// cast: flourish at the hero when a skill fires. Skills keep their element fx on the foe in place of hit.
export const STYLE = {
  sword: { hit: "melee/sword-slash" }, dual: { hit: "melee/double-slash" }, spin: { hit: "melee/spin-slash" }, heavy: { hit: "melee/heavy-cleave" },
  hammer: { hit: "melee/hammer-smash" }, spear: { hit: "melee/thrust" }, dagger: { hit: "melee/dagger-flurry" }, scythe: { hit: "melee/scythe-reap" },
  fist: { hit: "melee/uppercut" }, whip: { hit: "melee/whip-crack" }, claw: { hit: "melee/claw-swipe" }, slam: { hit: "impacts/ground-slam" },
  sns: { hit: "melee/sword-slash", cast: "impacts/shield-block" }, wall: { hit: "impacts/blunt-hit", cast: "impacts/shield-block" }, holyblade: { hit: "melee/sword-slash", cast: "holy/sunburst" },
  bow: { go: "projectiles/arrow", hit: "impacts/hit-spark" }, gun: { cast: "projectiles/muzzle-pistol", go: "projectiles/bullet-tracer", hit: "impacts/bullet-impact" },
  staff: { from: "projectiles/magic-missile", cast: "arcane/magic-circle-cast" }, tome: { from: "arcane/arcane-missiles", cast: "arcane/rune-circle" }, beam: { from: "arcane/arcane-beam" },
  holy: { hit: "holy/smite", cast: "holy/sunburst" }, hex: { hit: "shadow/grasping-hands", cast: "shadow/hex-sigil" }, necro: { hit: "shadow/dark-explosion", cast: "shadow/necro-skulls" },
  void: { hit: "shadow/void-orb" }, star: { hit: "arcane/star-fall" }, time: { hit: "arcane/time-stop" }, chi: { hit: "arcane/mana-burst", cast: "arcane/spell-charge" },
  voice: { hit: "arcane/mana-burst", cast: "arcane/spell-charge" }, acid: { hit: "nature/acid-splash" }, vine: { hit: "nature/vine-whip" }, rock: { from: "nature/boulder" },
  dig: { hit: "nature/earth-spike" }, coin: { hit: "impacts/ricochet", cast: "pickups/collect-burst" }, paint: { hit: "explosions/firework-burst" },
};
// Style -> class and career ids. build.mjs fails if a class or career is missing here.
const BY = {
  sword: "blade warrior duel bknight legass ltsw demon", dual: "qdraw", spin: "mblade phant swsaint", heavy: "flay berserk exec dragon chef cook",
  hammer: "tank fort bsmith smith", spear: "spear sentry", dagger: "shade runner trap stalk medc tailor bounty", scythe: "reap",
  fist: "fist clerk press porter rescue adjuster mortician lawyer pawn vet arena", whip: "puppet explr teach", claw: "bind beast pet", slam: "mech iron",
  sns: "guard knight shieldm ward", wall: "barrier", holyblade: "paladin", bow: "arch archer flarch bowst xbow", gun: "sharp gun arcgun cop",
  staff: "arcan audit grmag fmage image boom storm spirit", tome: "seal illu curse dmaker ench rune", beam: "sig lightg dupe signal",
  holy: "heal priest saint", hex: "dmage bsum pact skcol", necro: "necro shcmd medium", void: "vwalk", star: "grav", time: "chrono",
  chi: "qigong aura", voice: "orator bard", acid: "brew poison alheal doc res", vine: "farm", rock: "archi", dig: "miner ruin", coin: "merch trader", paint: "paint",
};
export const LOOK = Object.fromEntries(Object.entries(BY).flatMap(([st, ids]) => ids.split(" ").map((id) => [id, st])));
