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
};

// What a won operation can drop, weighted. loot points from decisions add rolls.
// Items of one rarity that a shop could sell (no relics, nothing unique).
export const RARITY_ITEMS = (r) => Object.keys(ITEMS).filter((k) => ITEMS[k].rarity === r && ITEMS[k].kind !== "relic");

export const LOOT_TABLE = [
  { id: "manaShard", w: 10 },
  { id: "beastHide", w: 8 },
  { id: "healPotion", w: 5 },
  { id: "coreStone", w: 2 },
  { id: "hunterBow", w: 1 },
  { id: "gateplate", w: 0.6 },
  { id: "bookTelekinesis", w: 0.15 },
];
