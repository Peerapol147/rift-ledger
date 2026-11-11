// Elements: name, colour, which element it beats, and the pixelfx effects stage.js plays for it.
const el = (n, c, beat, fx) => ({ n, c, beat, fx });

export const ELEMENTS = {
  fire: el("เพลิง", "#ff7a3d", "wood", ["fire/flame-pillar", "explosions/small-explosion", "fire/fire-ring"]),
  ice: el("เยือกแข็ง", "#7fd8ff", "bolt", ["ice/ice-spikes", "ice/frost-nova", "ice/snowflake-burst"]),
  bolt: el("อสนี", "#ffe76a", "metal", ["lightning/lightning-strike", "lightning/zap-hit", "lightning/ball-lightning"]),
  wood: el("พงไพร", "#7ddb6a", "ice", ["nature/earth-spike", "nature/thorns", "nature/leaf-storm"]),
  dark: el("เงา", "#a57bff", "holy", ["shadow/grasping-hands", "shadow/shadow-tendrils", "shadow/dark-explosion"]),
  holy: el("รุ่งแสง", "#fff0a8", "void", ["holy/smite", "holy/holy-pillar", "holy/sunburst"]),
  void: el("มิติ", "#ff5fd2", "dark", ["arcane/mana-burst", "explosions/implosion", "scifi/emp-blast"]),
  metal: el("ศาสตรา", "#c9d3e0", "fire", ["melee/sword-slash", "melee/double-slash", "melee/heavy-cleave"]),
};
