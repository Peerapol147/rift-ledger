// Items. kind: weapon | armor | charm | potion | material | book | relic. Rarity uses RARITY from classes.js.
const item = (n, kind, rarity, price, extra = {}) => ({ n, kind, rarity, price, ...extra });

export const ITEMS = {
  rustyKnife: item("Rusty Knife", "weapon", 0, 40, { slot: "weapon", stats: { atk: 3 } }),
  ironSword: item("Iron Sword", "weapon", 0, 300, { slot: "weapon", stats: { atk: 10 } }),
  hunterBow: item("Hunter Bow", "weapon", 1, 900, { slot: "weapon", stats: { atk: 18 } }),
  manaBlade: item("Mana-forged Blade", "weapon", 2, 4000, { slot: "weapon", stats: { atk: 40 } }),
  leatherVest: item("Leather Vest", "armor", 0, 200, { slot: "armor", stats: { def: 5, hp: 10 } }),
  gateplate: item("Gate-steel Plate", "armor", 1, 1600, { slot: "armor", stats: { def: 16, hp: 40 } }),
  luckyCharm: item("Lucky Charm", "charm", 0, 150, { slot: "charm", stats: { hp: 15 } }),
  healPotion: item("Healing Potion", "potion", 0, 120, { use: "heal", amount: 40 }),
  manaShard: item("Mana Shard", "material", 0, 60),
  beastHide: item("Mutant Hide", "material", 0, 90),
  coreStone: item("Gate Core Stone", "material", 1, 700),
  bookTelekinesis: item("Skill Book: Telekinesis", "book", 2, 6000, { use: "learn", skill: "telekinesis" }),
  phoenixToken: item("Phoenix Token", "relic", 4, 0, { use: "revive" }),
  shadowlessBlade: item("Shadowless Blade", "weapon", 3, 30000, { slot: "weapon", stats: { atk: 70 } }),

  // ---- builds (loot pass): role = the class role that gets +25% from it; set = a tower set (SETS)
  rebarClub: item("Rebar Club", "weapon", 0, 120, { slot: "weapon", stats: { atk: 7 }, role: "vanguard" }),
  scoutSneakers: item("Scout Sneakers", "charm", 0, 140, { slot: "charm", stats: { hp: 8, atk: 2 }, role: "scout" }),
  aidSatchel: item("First-aid Satchel", "charm", 0, 140, { slot: "charm", stats: { hp: 18 }, role: "support" }),
  signalDagger: item("Signal Dagger", "weapon", 1, 1100, { slot: "weapon", stats: { atk: 17 }, role: "scout" }),
  riotVest: item("Riot Shield Vest", "armor", 1, 1300, { slot: "armor", stats: { def: 15, hp: 30 }, role: "vanguard" }),
  medicHarness: item("Medic Harness", "charm", 1, 1100, { slot: "charm", stats: { hp: 35 }, role: "support" }),
  craftGauntlet: item("Craftsman's Gauntlet", "charm", 1, 1200, { slot: "charm", stats: { atk: 6, def: 6 },
    role: "artisan" }),
  bulwark: item("Bulwark of Concrete", "armor", 2, 5200, { slot: "armor", stats: { def: 34, hp: 90 },
    role: "vanguard" }),
  choirBell: item("Choir Bell", "charm", 2, 4600, { slot: "charm", stats: { hp: 60, def: 6 }, role: "support" }),
  silentFang: item("Silent Fang", "weapon", 2, 4800, { slot: "weapon", stats: { atk: 37 }, role: "scout" }),
  forgeHammer: item("Forgemaster Hammer", "weapon", 2, 4800, { slot: "weapon", stats: { atk: 33, def: 4 },
    role: "artisan" }),
  lastCityAegis: item("Aegis of the Last City", "armor", 3, 32000, { slot: "armor", stats: { def: 60, hp: 160 },
    role: "vanguard" }),
  // The Silent Tower set: the office that never closed
  shiftLanyard: item("Lanyard of the Last Shift", "charm", 1, 1400, { slot: "charm", stats: { hp: 25 },
    set: "silent" }),
  fluoroCoat: item("Fluorescent Coat", "armor", 1, 1500, { slot: "armor", stats: { def: 12, hp: 30 }, set: "silent" }),
  staplerGun: item("Stapler Gun", "weapon", 2, 4200, { slot: "weapon", stats: { atk: 26 }, set: "silent" }),
  // The Drowned Tower set: walkers of a sea that dried up
  coralHarpoon: item("Coral Harpoon", "weapon", 1, 1500, { slot: "weapon", stats: { atk: 20 }, set: "drowned" }),
  saltMail: item("Salt-crust Mail", "armor", 2, 4400, { slot: "armor", stats: { def: 18, hp: 50 }, set: "drowned" }),
  dryPearl: item("Pearl of a Dry Sea", "charm", 1, 1400, { slot: "charm", stats: { hp: 30 }, set: "drowned" }),
};

// Tower sets: bonuses for wearing 2 or 3 pieces at once (added to hero power, never to item stats).
export const SETS = {
  silent: { n: "กะสุดท้ายของหอเงียบ", tower: "silent", 2: { atk: 12 }, 3: { atk: 12, def: 12, hp: 40 } },
  drowned: { n: "ผู้เดินทะเลแห้ง", tower: "drowned", 2: { hp: 60 }, 3: { hp: 60, def: 15, atk: 10 } },
};

// Items of one rarity that a shop could sell (no relics, nothing unique).
export const RARITY_ITEMS = (r) => Object.keys(ITEMS).filter((k) => ITEMS[k].rarity === r && ITEMS[k].kind !== "relic");

