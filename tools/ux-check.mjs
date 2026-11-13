// Browser checks for the UX report (docs/feedback/ux-2026-11-13/REPORT.md): one PASS/FAIL line per report id, exit 1
// on any FAIL. Builds nothing: run `npm run build` first. Usage: node tools/ux-check.mjs [UX-11 UX-12 ...]
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
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
