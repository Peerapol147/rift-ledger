// Who meets which cast story (P2b-1 design §5): n lives per country, played to death with the first open choice,
// then the heir of each life that has one. Shares of lives that started each story, split hunter / civilian.
// Usage: node tools/cast-story-cohort.mjs [n=100]
import * as C from "../src/core/index.js";
import { COUNTRIES } from "../src/data/world.js";
import { firstOpen } from "../test/helpers.mjs";

const N = Number(process.argv[2] ?? 100);
const IDS = ["thongbai", "silawong", "yoon", "hong", "mingyu", "dohyun", "seojin", "poramet", "pim"];

function live(s) {
  for (let n = 0; n < 80000 && !s.dead && C.ageY(s) < 85; n++) {
    if (!s.ev) { C.advance(s); continue; }
    C.choose(s, Math.max(0, firstOpen(s)));
  }
  return s;
}

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "-");
for (const country of ["th", "kr"]) {
  const groups = { "gen 1": [], heirs: [] };
  let noHeir = 0;
  for (let i = 0; i < N; i++) {
    const s = C.newLife(`csc-${country}-${i}`);
    const cities = COUNTRIES[country].cities;
    s.country = country; s.city = cities[i % cities.length].id;
    groups["gen 1"].push(live(s));
    if (C.canHeir(s)) groups.heirs.push(live(C.newHeir(s, `csc-${country}-${i}-h`)));
    else noHeir++;
  }
  console.log(`${country} (${N} lives, ${groups.heirs.length} heirs, ${noHeir} without one):`);
  for (const [name, lives] of Object.entries(groups)) {
    const hunters = lives.filter((s) => s.hunter), civs = lives.filter((s) => !s.hunter);
    const any = lives.filter((s) => IDS.some((id) => s.narrative.stories[id])).length;
    console.log(`  ${name}: at least one cast story ${pct(any, lives.length)} (hunters ${hunters.length},`
      + ` civilians ${civs.length})`);
    for (const id of IDS) {
      const h = hunters.filter((s) => s.narrative.stories[id]).length;
      const c = civs.filter((s) => s.narrative.stories[id]).length;
      console.log(`    ${id.padEnd(9)} ${pct(h + c, lives.length).padStart(4)} · hunters ${pct(h, hunters.length)}`
        + ` · civilians ${pct(c, civs.length)}`);
    }
  }
}
