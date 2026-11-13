// Browser checks for the UX report (docs/feedback/ux-2026-11-13/REPORT.md): one PASS/FAIL line per report id, exit 1
// on any FAIL. Builds nothing: run `npm run build` first. Usage: node tools/ux-check.mjs [UX-11 UX-12 ...]
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import * as C from "../src/core/index.js";
import { ITEMS } from "../src/data/items.js";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const URL = pathToFileURL(process.cwd() + "/play.html").href;
const CASES = {};
const only = process.argv.slice(2);

async function open(browser, { w = 1280, h = 800, mobile = false, init = {}, raw = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(({ init, raw }) => {
    if (sessionStorage.getItem("ux-init")) return;
    sessionStorage.setItem("ux-init", "1");
    for (const [k, v] of Object.entries(init)) localStorage.setItem(k, JSON.stringify(v));
    for (const [k, v] of Object.entries(raw)) localStorage.setItem(k, v);
  }, { init, raw });
  const page = await ctx.newPage(), errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}
const newLife = async (page) => { await page.locator('[data-a="new"]').click(); await page.waitForTimeout(300); };
const cardText = (page) => page.locator("#card").innerText();

CASES["UX-11"] = async (b) => {
  const { ctx, page } = await open(b, { init: { "riftledger.cfg.v2": { speed: 2, policy: "skip", fs: 2 } } });
  await newLife(page);
  await page.locator('[data-a="speed:16"]').click();
  await page.waitForTimeout(300);
  const before = await cardText(page);
  await page.waitForTimeout(2500);
  const after = await cardText(page);
  await ctx.close();
  return [before !== after, "16× moves the life on"];
};

CASES["UX-12"] = async (b) => {
  const { ctx, page, errors } = await open(b, { raw: { "riftledger.cfg.v2": "null" } });
  const ok = await page.locator("#start h1").isVisible().catch(() => false);
  await ctx.close();
  return [ok && !errors.length, `start screen with a null setting${errors.length ? ": " + errors[0] : ""}`];
};


// ---- fixtures made by the game itself
const firstOpen = (s) => s.ev.opts.findIndex((o) => { const v = C.optionView(s, o); return v.visible && !v.locked; });
const infant = (() => { const s = C.newLife("ux-click-audit"); for (let i = 0; i < 100 && !s.ev; i++) C.advance(s); return s; })();
const adult = (() => {
  const s = C.newLife("ux-inventory");
  for (let i = 0; i < 4000 && !s.dead && s.ageM < 240; i++) { if (s.ev) C.choose(s, firstOpen(s)); else C.advance(s); }
  const id = Object.keys(ITEMS).find((k) => ITEMS[k].slot === "weapon");
  return { s, uid: C.giveItem(s, id, "UX check") };
})();
const SLOT0 = "riftledger.slot.v2.0", CFGK = "riftledger.cfg.v2", STOP = { policy: "stop", speed: 1, fs: 2 };
async function loaded(b, life, o = {}) {
  const r = await open(b, { ...o, init: { [CFGK]: STOP, ...(o.init ?? {}) }, raw: { [SLOT0]: C.serialize(life) } });
  await r.page.locator('[data-a="load:0"]').click();
  await r.page.waitForTimeout(300);
  await r.page.locator('[data-a="pause"]').first().click().catch(() => {});
  return r;
}
const choices = (page) => page.locator('#ev [data-a^="choose:"], [data-a^="choose:"]').count();
const settings = async (page) => { await page.locator('[data-a="settings"]').first().click(); await page.waitForTimeout(150); };

CASES["UX-02"] = async (b) => {
  const { ctx, page } = await loaded(b, infant, { w: 390, h: 844, mobile: true });
  const n0 = await choices(page);
  await page.evaluate(() => {
    const el = document.querySelector('[data-a^="choose:"]');
    const o = { pointerType: "touch", button: 0, bubbles: true, isPrimary: true };
    el.dispatchEvent(new PointerEvent("pointerdown", o)); el.dispatchEvent(new PointerEvent("pointercancel", o));
  });
  await page.waitForTimeout(150);
  const n1 = await choices(page);
  await ctx.close();
  return [n0 > 0 && n1 === n0, "a cancelled touch chooses nothing"];
};

CASES["UX-03"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await settings(page);
  await page.keyboard.press("1");
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  const r = await page.evaluate(() => ({ inModal: document.querySelector("#modal").contains(document.activeElement),
    role: document.querySelector("#modal").getAttribute("role"), aria: document.querySelector("#modal").getAttribute("aria-modal") }));
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  const n = await choices(page);
  await ctx.close();
  return [n > 0 && r.inModal && r.role === "dialog" && r.aria === "true", "settings keeps keys and focus to itself"];
};

CASES["UX-04"] = async (b) => {
  const { ctx, page } = await loaded(b, adult.s);
  await page.locator('[data-a="tab:items"]').first().click(); await page.waitForTimeout(150);
  await page.locator(`[data-a="equip:${adult.uid}"]`).click(); await page.waitForTimeout(200);
  const still = await page.locator(`[data-a="equip:${adult.uid}"]`).count();
  await ctx.close();
  return [still === 0, "equip shows at once"];
};

CASES["UX-05"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  let asked = 0;
  page.on("dialog", (d) => { asked++; d.dismiss(); });
  await settings(page);
  await page.locator('#modal [data-a="del:0"]').click(); await page.waitForTimeout(150);
  const kept = await page.evaluate((k) => localStorage.getItem(k) !== null, SLOT0);
  await ctx.close();
  return [asked > 0 && kept, "delete asks first, cancel keeps the save"];
};

CASES["UX-07"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await page.locator('[data-a="settings"]').first().focus();
  await page.keyboard.press("Space"); await page.waitForTimeout(150);
  const open1 = await page.locator("#modal").isVisible();
  await ctx.close();
  return [open1, "Space presses the focused button"];
};

CASES["UX-08"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await settings(page);
  await page.locator('#modal [data-c="importText"]').fill("my-save-code");
  await page.locator('#modal [data-a="fs:3"]').click(); await page.waitForTimeout(150);
  const v = await page.locator('#modal [data-c="importText"]').inputValue();
  await ctx.close();
  return [v === "my-save-code", "the import box keeps its text"];
};

CASES["UX-09"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await settings(page);
  await page.locator('#modal [data-a="save:0"]').click(); await page.waitForTimeout(150);
  const top = await page.evaluate(() => {
    const el = [...document.querySelectorAll("#banner, .banner, [role=status]")].find((x) => !x.hidden && x.getClientRects().length && x.textContent);
    if (!el) return false;
    const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return el.contains(hit);
  });
  await ctx.close();
  return [top, "save feedback shows above the settings"];
};

CASES["UX-13"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  page.on("dialog", (d) => d.accept());
  await settings(page);
  await page.locator('#modal [data-a="del:0"]').click(); await page.waitForTimeout(150);
  await page.locator('#modal [data-a="quit"]').click().catch(() => {}); await page.waitForTimeout(200);
  const back = await page.evaluate((k) => localStorage.getItem(k) !== null, SLOT0);
  await ctx.close();
  return [!back, "a deleted save does not come back on quit"];
};

CASES["UX-14"] = async (b) => {
  const { ctx, page, errors } = await loaded(b, infant);
  page.on("dialog", (d) => d.accept());
  const before = await page.evaluate((k) => localStorage.getItem(k), SLOT0);
  const broken = JSON.parse(C.serialize(infant)); delete broken.c;
  await settings(page);
  await page.locator('#modal [data-c="importText"]').fill(JSON.stringify(broken));
  await page.locator('#modal [data-a="import:0"]').click(); await page.waitForTimeout(200);
  const after = await page.evaluate((k) => localStorage.getItem(k), SLOT0);
  const msg = await page.locator("#banner").innerText().catch(() => "");
  await ctx.close();
  return [after === before && !errors.length && /ไม่ครบ/.test(msg), "a broken import changes nothing and says why"];
};

CASES["UX-06"] = async (b) => {
  const out = [];
  for (const [w, h] of [[390, 844], [320, 568], [1280, 800]]) {
    const { ctx, page } = await loaded(b, adult.s, { w, h, mobile: w < 700 });
    out.push(await page.evaluate(() => {
      const plan = [...document.querySelectorAll('#card [data-a^="focus:"]')][0];
      return plan ? Math.round(plan.getBoundingClientRect().top + scrollY) : 1e9;
    }));
    await ctx.close();
  }
  return [out[0] <= 1200 && out[1] <= 1200 && out[2] <= 700, `monthly plan top at 390/320/1280: ${out.join(" / ")}`];
};

CASES["UX-10"] = async (b) => {
  const small = [];
  for (const w of [390, 320]) {
    const { ctx, page } = await loaded(b, adult.s, { w, h: 800, mobile: true });
    small.push(await page.evaluate(() => [...document.querySelectorAll('[data-a^="choose:"], [data-a^="tab:"], '
      + '[data-a^="focus:"], [data-a="settings"], [data-a^="speed:"]')]
      .filter((x) => x.getClientRects().length).map((x) => x.getBoundingClientRect().height)
      .filter((hh) => hh < 44).length));
    await ctx.close();
  }
  return [small.every((n) => n === 0), `buttons under 44px at 390/320: ${small.join(" / ")}`];
};

const browser = await chromium.launch();
let fail = 0;
for (const [id, run] of Object.entries(CASES)) {
  if (only.length && !only.includes(id)) continue;
  const [ok, what] = await run(browser).catch((e) => [false, "error: " + e.message.split("\n")[0]]);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${id} ${what}`);
}
await browser.close();
process.exit(fail ? 1 : 0);
