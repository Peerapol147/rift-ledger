// Browser checks for the UX report (docs/feedback/ux-2026-11-13/REPORT.md): one PASS/FAIL line per report id, exit 1
// on any FAIL. Builds nothing: run `npm run build` first. Usage: node tools/ux-check.mjs [UX-11 UX-12 ...]
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import * as C from "../src/core/index.js";
import { ITEMS } from "../src/data/items.js";
import { FOCUS } from "../src/data/stats.js";
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
  await page.locator('[data-a="pause"]').first().click();
  const age = async () => Number((await cardText(page)).match(/อายุ\s*(\d+)/)?.[1] ?? -1);
  const before = await age();
  await page.locator('[data-a="speed:16"]').click(); // also resumes
  await page.waitForTimeout(1500);
  const after = await age();
  await ctx.close();
  return [after > before, `16× moves the life on (age ${before} → ${after})`];
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
// a small event the old default ("important") would answer by itself
const minor = (() => {
  const s = C.newLife("ux-minor");
  for (let i = 0; i < 20000; i++) {
    if (s.ev && C.autoDecide(s, "important") >= 0) return s;
    if (s.ev) C.choose(s, firstOpen(s)); else C.advance(s);
  }
  throw new Error("no minor event fixture");
})();
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

// ---- Blind spots the report did not test (docs/superpowers/specs/2026-11-13-ux-blind-spots-design.md)
const failWrites = (page) => page.evaluate(() => {
  window.__setItem ??= Storage.prototype.setItem;
  Storage.prototype.setItem = function () { throw new DOMException("full", "QuotaExceededError"); };
});
const healWrites = (page) => page.evaluate(() => { Storage.prototype.setItem = window.__setItem; });
// every text the banner shows, with when it appeared and when it was replaced
const watchBanner = (page) => page.evaluate(() => {
  window.__banners = [];
  const b = document.querySelector("#banner"), at = () => performance.now();
  new MutationObserver(() => {
    const last = window.__banners.at(-1);
    if (last && last.end == null && (b.hidden || last.text !== b.textContent)) last.end = at();
    if (!b.hidden && b.textContent && (!last || last.text !== b.textContent || last.end != null)) {
      window.__banners.push({ text: b.textContent, start: at(), end: null });
    }
  }).observe(b, { childList: true, characterData: true, subtree: true, attributes: true });
});

CASES["B-save-fail"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await failWrites(page);
  await settings(page);
  await page.locator('#modal [data-a="save:1"]').click(); await page.waitForTimeout(150);
  const t = await page.locator("#banner").innerText();
  // the next save the player makes, at once and into a slot that works, is answered and not hidden by the failure
  await healWrites(page);
  await page.locator('#modal [data-a="save:2"]').click(); await page.waitForTimeout(150);
  const t2 = await page.locator("#banner").innerText();
  await ctx.close();
  return [/ไม่สำเร็จ/.test(t) && !/บันทึกแล้ว/.test(t) && /บันทึกแล้ว/.test(t2),
    `a save that cannot be written says so ("${t}"), the next one that works says so ("${t2}")`];
};

CASES["B-autosave-fail"] = async (b) => {
  const { ctx, page } = await loaded(b, adult.s, { init: { [CFGK]: { policy: "skip", speed: 16, fs: 2 } } });
  await failWrites(page); await watchBanner(page);
  await page.locator('[data-a="speed:16"]').click();
  // answer whatever the autopilot leaves to the player, so at least one birthday (and its autosave) passes
  for (let i = 0; i < 30; i++) {
    const c = page.locator('[data-a^="choose:"]:not([disabled])').first();
    if (await c.count()) await c.click({ timeout: 300 }).catch(() => {});
    await page.waitForTimeout(200);
  }
  const seen = await page.evaluate(() => window.__banners);
  await ctx.close();
  const fail = seen.find((x) => /บันทึกอัตโนมัติไม่สำเร็จ/.test(x.text));
  const shown = fail ? ((fail.end ?? fail.start + 1e9) - fail.start) / 1000 : 0;
  // readable (≥ 1 s) and then gone (its 3.5 s, with room for frames), not stuck on screen
  return [shown >= 1 && shown <= 4.5, `the autosave failure stays readable, then goes (${fail ? Math.min(shown, 99)
    .toFixed(2) + " s" : "never shown"}, ${seen.length} banners)`];
};

// file:// pages do not always share storage between tabs; a real player is on a web page, so serve one
async function served() {
  const { createServer } = await import("node:http"), { readFileSync } = await import("node:fs");
  const html = readFileSync(process.cwd() + "/play.html");
  const srv = createServer((q, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end(html); });
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  return { url: `http://127.0.0.1:${srv.address().port}/play.html`, close: () => srv.close() };
}

CASES["B-two-tabs"] = async (b) => {
  const web = await served();
  const ctx = await b.newContext();
  await ctx.addInitScript(({ k, v, ck, c }) => {
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, v); localStorage.setItem(ck, c);
  }, { k: SLOT0, v: C.serialize(adult.s), ck: CFGK, c: JSON.stringify({ policy: "skip", speed: 16, fs: 2 }) });
  const tab = async () => {
    const p = await ctx.newPage(); await p.goto(web.url); await p.waitForTimeout(300);
    await p.locator('[data-a="load:0"]').click(); await p.waitForTimeout(200);
    return p;
  };
  // pause for sure: the button toggles, so press it until it offers "เล่นต่อ"
  const hold = async (p) => {
    for (let i = 0; i < 3 && (await p.locator('[data-a="pause"]').first().innerText()) !== "เล่นต่อ"; i++) {
      await p.locator('[data-a="pause"]').first().click(); await p.waitForTimeout(100);
    }
  };
  const A = await tab(); await hold(A);
  const B = await tab(); await hold(B);
  const ageIn = () => B.evaluate((k) => localStorage.getItem(k), SLOT0).then((x) => C.deserialize(x)?.ageM);
  const start = await ageIn();
  await B.bringToFront(); await B.locator('[data-a="speed:16"]').click();
  for (let i = 0; i < 30 && (await ageIn()) < start + 24; i++) {
    const c = B.locator('[data-a^="choose:"]:not([disabled])').first();
    if (await c.count()) await c.click({ timeout: 300 }).catch(() => {});
    await B.waitForTimeout(200);
  }
  await hold(B);
  await settings(B); await B.locator('#modal [data-a="save:0"]').click(); await B.waitForTimeout(150);
  const ahead = await ageIn();
  // tabs see each other's storage a moment later (as in a real browser): wait until A's page sees B's save
  for (let i = 0; i < 20 && C.deserialize(await A.evaluate((k) => localStorage.getItem(k), SLOT0))?.ageM !== ahead; i++) {
    await A.waitForTimeout(100);
  }
  const ageA = await A.evaluate(() => document.querySelector('[data-a="pause"]').textContent);
  const seenA = () => A.evaluate((k) => localStorage.getItem(k), SLOT0).then((x) => C.deserialize(x)?.ageM);
  const pre = await seenA();
  await A.bringToFront(); await settings(A); await A.locator('#modal [data-a="save:0"]').click(); await A.waitForTimeout(150);
  const post = await seenA();
  const after = await ageIn(), said = await A.locator("#banner").innerText();
  // the older tab plays on past the other one's age: its autosave must still not take the slot by itself
  await A.keyboard.press("Escape"); await A.waitForTimeout(100);
  await A.locator('[data-a="speed:16"]').click();
  const yearsA = async () => +((await cardText(A)).match(/อายุ\s*(\d+)/)?.[1] ?? 0);
  for (let i = 0; i < 80 && (await yearsA()) * 12 <= ahead + 12; i++) {
    const c = A.locator('[data-a^="choose:"]:not([disabled])').first();
    if (await c.count()) await c.click({ timeout: 300 }).catch(() => {});
    await A.waitForTimeout(200);
  }
  const ageA2 = (await cardText(A)).match(/อายุ\s*(\d+)/)?.[1], later = await ageIn();
  await ctx.close(); web.close();
  return [ahead > start && after === ahead && /อีกแท็บ/.test(said) && later === ahead && +ageA2 * 12 > ahead,
    `an older tab cannot save over a newer life (slot ${start} → ${ahead} → ${after} → ${later} months, A at `
    + `${ageA} then ${ageA2}; "${said}"; A saw ${pre}→${post})`];
};

CASES["B-focus-return"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await page.locator('[data-a="settings"]').first().focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
  // the toolbar is drawn again while settings is open (the game redraws it when the life moves on)
  await page.evaluate(() => { const t = document.querySelector('[data-a="settings"]').parentElement; t.innerHTML += ""; });
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  const on = await page.evaluate(() => document.activeElement?.dataset?.a ?? document.activeElement?.tagName);
  await ctx.close();
  return [on === "settings", `closing settings puts focus back on the settings button (on ${on})`];
};

const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const old = (() => { // a long life: about 300 log lines
  const s = C.newLife("ux-old");
  for (let i = 0; i < 80000 && !s.dead && C.ageY(s) < 62; i++) { if (s.ev) C.choose(s, firstOpen(s)); else C.advance(s); }
  for (let i = 0; i < 400 && !s.ev; i++) C.advance(s);
  return s;
})();

CASES["B-log-phone"] = async (b) => {
  const { ctx, page } = await loaded(b, old, { w: 390, h: 844, mobile: true });
  const r = await page.evaluate(() => {
    const c = document.querySelector('[data-a^="choose:"]') ?? document.querySelector('[data-a^="focus:"]');
    return { top: c ? Math.round(c.getBoundingClientRect().top + scrollY) : -1, h: document.documentElement.scrollHeight };
  });
  const side = await sideways(page);
  await ctx.close();
  return [r.top >= 0 && r.top <= 844 * 1.5 && side <= 0,
    `a long life on a phone: choices at ${r.top}px of a ${r.h}px page, sideways ${side}px`];
};

CASES["B-big-font"] = async (b) => {
  const { ctx, page } = await loaded(b, old, { w: 320, h: 568, mobile: true, init: { [CFGK]: { ...STOP, fs: 3 } } });
  const side = await sideways(page);
  await settings(page);
  // reachable by a finger: on screen already, or inside a box the player can scroll (script scrolling ignores
  // overflow:hidden, so the box's own style decides)
  const last = await page.evaluate(() => {
    const l = [...document.querySelectorAll("#modal button")].at(-1), r = l.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= innerHeight) return true;
    for (let e = l.parentElement; e; e = e.parentElement) {
      const cs = getComputedStyle(e), root = e === document.documentElement || e === document.body;
      if (e.scrollHeight > e.clientHeight + 1 && (/(auto|scroll)/.test(cs.overflowY) || (root && cs.overflowY !== "hidden"))) {
        return true;
      }
      if (cs.position === "fixed") return false; // the page scrolling cannot move a fixed box
    }
    return false;
  });
  await ctx.close();
  return [side <= 0 && last, `biggest text at 320 px: sideways ${side}px, last settings button reachable ${last}`];
};

CASES["B-landscape"] = async (b) => {
  const { ctx, page } = await loaded(b, infant, { w: 844, h: 390, mobile: true });
  const ok = await page.evaluate(() => {
    const c = document.querySelector('[data-a^="choose:"]'); if (!c) return false;
    c.scrollIntoView({ block: "nearest" }); const r = c.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });
  const side = await sideways(page);
  await ctx.close();
  return [ok && side <= 0, `a phone held sideways: a choice can be reached ${ok}, sideways ${side}px`];
};

// ---- The choice card over the stage (docs/superpowers/specs/2026-11-14-choice-card-design.md)
const cardOpen = (page) => page.evaluate(() => {
  const c = document.querySelector("#choice"), k = c?.querySelector(".card");
  return !!c && !c.hidden && !!k && getComputedStyle(k).display !== "none" && k.getClientRects().length > 0;
});

CASES["C-open"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  const open = await cardOpen(page);
  const inCard = await page.locator('#choice [data-a^="choose:"]').count();
  const inSide = await page.locator('#event [data-a^="choose:"]').count();
  const note = await page.locator("#event").innerText();
  await ctx.close();
  return [open && inCard > 0 && inSide === 0 && /มีเรื่องรอคุณตัดสินใจ/.test(note),
    `a waiting decision opens over the stage (card ${open}, ${inCard} choices in it, ${inSide} beside)`];
};

CASES["C-phone"] = async (b) => {
  const { ctx, page } = await loaded(b, infant, { w: 390, h: 844, mobile: true });
  const r = await page.evaluate(() => {
    const k = document.querySelector("#choice .card"); if (!k) return null;
    const box = k.getBoundingClientRect(), c = k.querySelector('[data-a^="choose:"]');
    c?.scrollIntoView({ block: "nearest" }); const x = c?.getBoundingClientRect();
    return { bottom: Math.round(box.bottom), w: Math.round(box.width), ok: !!x && x.top >= 0 && x.bottom <= innerHeight };
  });
  const side = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await ctx.close();
  return [!!r && r.bottom <= 845 && r.w >= 360 && r.ok && side <= 0,
    `on a phone the card is a sheet at the bottom (${JSON.stringify(r)}, sideways ${side}px)`];
};

CASES["C-auto"] = async (b) => {
  const { ctx, page } = await loaded(b, adult.s, { init: { [CFGK]: { policy: "skip", speed: 16, fs: 2 } } });
  await page.locator('[data-a="speed:16"]').click();
  let flashes = 0;
  for (let i = 0; i < 15; i++) {
    const waiting = await page.locator('#choice [data-a^="choose:"]').count();
    if ((await cardOpen(page)) && !waiting) flashes++;
    const c = page.locator('#choice [data-a^="choose:"]:not([disabled])').first();
    if (await c.count()) await c.click({ timeout: 300 }).catch(() => {});
    await page.waitForTimeout(200);
  }
  await ctx.close();
  return [flashes === 0, `the autopilot's own choices never open an empty card (${flashes})`];
};

// a decision card covers the screen (as in the model game): fold it to use the screen behind
const foldCard = async (page) => {
  const f = page.locator('#choice [data-a="fold"]');
  if (await f.count()) { await f.click(); await page.waitForTimeout(100); }
};
CASES["C-fold"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  const age0 = await cardText(page);
  await page.locator('#choice [data-a="fold"]').click(); await page.waitForTimeout(1500);
  const hidden = !(await cardOpen(page)), reopen = await page.locator('[data-a="unfold"]').first().isVisible();
  const still = (await cardText(page)) === age0;
  await page.locator('#unfold').click(); await page.waitForTimeout(150);
  const back = await cardOpen(page);
  await ctx.close();
  return [hidden && reopen && still && back, `fold hides the card (${hidden}), a button reopens it (${reopen}, ${back}),`
    + ` the life waits meanwhile (${still})`];
};

CASES["C-start-folded"] = async (b) => {
  const { ctx, page } = await loaded(b, infant, { init: { [CFGK]: { ...STOP, fold: true } } });
  const open = await cardOpen(page), reopen = await page.locator("#unfold").isVisible().catch(() => false);
  await ctx.close();
  return [!open && reopen, `with "start folded" a decision opens folded (card ${open}, reopen button ${reopen})`];
};

CASES["C-keys"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  const inCard = () => page.evaluate(() => !!document.activeElement?.closest("#choice .card"));
  // loaded() pressed pause, which took focus there: fold and reopen so the card opens again in front of the player
  await page.locator('#choice [data-a="fold"]').click(); await page.locator("#unfold").click(); await page.waitForTimeout(100);
  const first = await page.evaluate(() => document.activeElement?.dataset?.a ?? "");
  let inside = true;
  let out = "";
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    const here = await inCard();
    if (!here && !out) out = await page.evaluate(() => document.activeElement?.dataset?.a ?? document.activeElement?.id
      ?? document.activeElement?.tagName);
    inside &&= here;
  }
  await page.keyboard.press("f"); await page.waitForTimeout(100); const f1 = !(await cardOpen(page));
  await page.keyboard.press("f"); await page.waitForTimeout(100); const f2 = await cardOpen(page);
  await page.keyboard.press("Escape"); await page.waitForTimeout(100); const esc = !(await cardOpen(page));
  await ctx.close();
  return [/^choose:/.test(first) && inside && f1 && f2 && esc,
    `focus starts on a choice (${first}), Tab stays in the card (${inside}${out ? ", left to " + out : ""}), F folds/unfolds (${f1}/${f2}), Esc folds (${esc})`];
};

CASES["C-settings-over"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await settings(page);
  let inModal = true;
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    inModal &&= await page.evaluate(() => !!document.activeElement?.closest("#modal"));
  }
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  const open = await cardOpen(page);
  await ctx.close();
  return [inModal && open, `settings over a card keeps its own focus (${inModal}); closing it leaves the card open (${open})`];
};

CASES["C-fold-setting"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await page.locator('#choice [data-c="foldStart"]').check(); await page.waitForTimeout(100);
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}").fold, CFGK);
  const dim = await page.evaluate(() => document.querySelector("#ctrl")?.classList.contains("waiting"));
  await ctx.close();
  return [saved === true && dim === true, `the card's "start folded" box is saved (${saved}); speeds look dimmed while`
    + ` a decision waits (${dim})`];
};

CASES["C-plan"] = async (b) => {
  // the infant's waiting decision, with a main plan that one of its options fits
  const s = C.deserialize(C.serialize(infant));
  const plan = Object.keys(FOCUS[C.stageOf(s)]).find((id) => {
    s.focus = id; s.focus2 = null;
    return s.ev.opts.some((o) => C.optionView(s, o).visible && C.planFit(s, o) === "main");
  });
  const { ctx, page } = await loaded(b, s);
  const marked = await page.locator("#choice .opt.fit-main").count();
  await ctx.close();
  return [!!plan && marked > 0, `an option that fits the main plan (${plan}) has the plan border (${marked})`];
};

CASES["C-key-result"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await page.keyboard.press("1"); await page.waitForTimeout(200);
  const res = await page.locator("#event .result").count();
  await ctx.close();
  return [res > 0, `choosing with a number key shows what happened, as a click does (${res})`];
};

// a save loaded onto a waiting decision, with nothing pressed afterwards (loaded() presses pause)
async function fresh(b, life, o = {}) {
  const r = await open(b, { ...o, init: { [CFGK]: STOP, ...(o.init ?? {}) }, raw: { [SLOT0]: C.serialize(life) } });
  await r.page.locator('[data-a="load:0"]').click(); await r.page.waitForTimeout(300);
  return r;
}
const clear = (page) => page.evaluate(() => {
  const c = document.querySelector("#ctrl").getBoundingClientRect(), k = document.querySelector("#choice .card");
  if (!k) return { ok: false, why: "no card" };
  const r = k.getBoundingClientRect(), overlap = r.top < c.bottom && r.bottom > c.top;
  return { ok: !overlap && r.bottom <= innerHeight + 1 && r.top >= 0, card: [Math.round(r.top), Math.round(r.bottom)],
    ctrl: [Math.round(c.top), Math.round(c.bottom)], h: innerHeight };
});

CASES["C-fresh-load"] = async (b) => {
  const out = [];
  for (const o of [{}, { w: 390, h: 844, mobile: true }]) {
    const { ctx, page } = await fresh(b, infant, o);
    out.push(await clear(page)); await ctx.close();
  }
  return [out.every((x) => x.ok), `a save opened onto a decision: the card clears the controls (${JSON.stringify(out)})`];
};

CASES["C-rotate"] = async (b) => {
  const { ctx, page } = await fresh(b, infant, { w: 390, h: 844, mobile: true });
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(300);
  const r = await clear(page);
  await ctx.close();
  return [r.ok, `turning the phone moves the card with the screen (${JSON.stringify(r)})`];
};

CASES["C-no-scroll"] = async (b) => {
  const { ctx, page } = await fresh(b, old, { w: 390, h: 844, mobile: true });
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.move(195, 120); await page.mouse.wheel(0, 600); await page.waitForTimeout(200);
  const y1 = await page.evaluate(() => scrollY);
  await ctx.close();
  return [y1 === y0, `the page behind an open card does not scroll (${y0} → ${y1})`];
};

CASES["C-space-safe"] = async (b) => {
  // the life runs at 16×; when the next decision opens, Space (meant as "pause") must not answer it
  const { ctx, page } = await fresh(b, infant, { init: { [CFGK]: { policy: "stop", speed: 16, fs: 2 } } });
  await page.locator('#choice [data-a^="choose:"]:not([disabled])').first().click();
  const n0 = await page.evaluate(() => document.querySelectorAll("#log .l, .l").length);
  let opened = false;
  for (let i = 0; i < 100 && !opened; i++) { await page.waitForTimeout(30); opened = await cardOpen(page); }
  const before = await page.locator("#choice .card p").first().innerText().catch(() => "");
  await page.keyboard.press(" "); await page.waitForTimeout(250);
  const after = await page.locator("#choice .card p").first().innerText().catch(() => "");
  await ctx.close();
  return [opened && before && after === before, `Space as a new card opens does not choose (${opened}, same event ${after === before})`];
};

CASES["C-fold-focus"] = async (b) => {
  const { ctx, page } = await loaded(b, infant, { w: 390, h: 844, mobile: true });
  await page.locator('#choice [data-a="fold"]').focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
  const on = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  await page.locator("#unfold").click(); await page.waitForTimeout(150);
  const h = await page.evaluate(() => Math.round(document.querySelector("#choice .foldstart")?.getBoundingClientRect().height ?? 0));
  await ctx.close();
  return [on === "unfold" && h >= 44, `folding moves focus to the reopen button (${on}); the "start folded" box is tall enough (${h}px)`];
};

// ---- Top bar and the where/doing line (docs/superpowers/specs/2026-11-14-top-bar-design.md)
CASES["T-bar"] = async (b) => {
  const out = [];
  for (const o of [{}, { w: 390, h: 844, mobile: true }]) {
    const { ctx, page } = await loaded(b, adult.s, o);
    out.push(await page.evaluate((name) => {
      const w = document.querySelector("#who"), st = document.querySelector("#stagewrap");
      if (!w) return "no bar";
      const a = w.getBoundingClientRect(), z = st.getBoundingClientRect();
      return a.bottom <= z.top + 1 && w.innerText.includes(name) && /อายุ\s*\d+/.test(w.innerText) ? "ok" : w.innerText;
    }, adult.s.name));
    await ctx.close();
  }
  return [out.every((x) => x === "ok"), `a bar above the stage names the life and its age (${out.join(" / ")})`];
};

CASES["T-where"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  const t = await page.locator("#where").innerText().catch(() => "");
  await ctx.close();
  return [/·/.test(t) && /มีเรื่องรอตัดสินใจ/.test(t), `the scene says where you are and what is happening ("${t.replace(/\n/g, " / ")}")`];
};

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
  await foldCard(page);
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

CASES["R-scroll"] = async (b) => {
  const { ctx, page } = await loaded(b, adult.s, { w: 390, h: 844, mobile: true });
  await foldCard(page);
  await page.locator('[data-a="pause"]').first().click(); // running again
  const btn = page.locator('#card [data-a^="focus:"]').last();
  await btn.scrollIntoViewIfNeeded(); await btn.tap(); await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(2500);
  const y = await page.evaluate(() => scrollY);
  await ctx.close();
  return [y < 50, `the page stays where the player scrolled (scrollY ${y})`];
};

CASES["R-import-playing"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  page.on("dialog", (d) => d.accept());
  const other = C.newLife("ux-imported"); other.name = "นำเข้ามา";
  await settings(page);
  await page.locator('#modal [data-c="importText"]').fill(C.serialize(other));
  await page.locator('#modal [data-a="import:0"]').click(); await page.waitForTimeout(150);
  await page.locator('#modal [data-a="quit"]').click(); await page.waitForTimeout(200);
  const name = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).name, SLOT0);
  await ctx.close();
  return [name === "นำเข้ามา", "a life imported into the slot being played is not written over"];
};

CASES["R-space-hold"] = async (b) => {
  const { ctx, page } = await loaded(b, infant);
  await page.locator('[data-a="pause"]').first().focus();
  const press = async (repeat) => {
    await page.evaluate((r) => document.activeElement.dispatchEvent(new KeyboardEvent("keydown",
      { key: " ", repeat: r, bubbles: true, cancelable: true })), repeat);
    await page.waitForTimeout(80);
    return page.locator('[data-a="pause"]').first().innerText();
  };
  const first = await press(false);
  const held = [await press(true), await press(true), await press(true)];
  await ctx.close();
  return [held.every((l) => l === first), `holding Space acts once (${first} then ${held.join(", ")})`];
};

CASES["UX-15"] = async (b) => {
  const { ctx, page } = await open(b, { raw: { [SLOT0]: C.serialize(minor) } }); // a fresh profile: no settings
  await page.locator('[data-a="load:0"]').click();
  await page.waitForTimeout(2500);
  const shown = await page.locator(".ev p").first().innerText().catch(() => "");
  await ctx.close();
  return [shown === minor.ev.t, "a first play leaves every choice to the player"];
};

CASES["cast-world"] = async (b) => {
  const { ctx, page, errors } = await loaded(b, adult.s, { w: 390, h: 844, mobile: true });
  await foldCard(page);
  await page.locator('[data-a="tab:world"]').first().click(); await page.waitForTimeout(200);
  const r = await page.evaluate(() => ({ text: document.querySelector("#view").innerText,
    over: document.documentElement.scrollWidth > innerWidth }));
  await ctx.close();
  const ok = ["ตำนาน", "ใหญ่", "เงา", "ตระกูลศิลาวงศ์"].every((w) => r.text.includes(w)) && !r.over && !errors.length;
  return [ok, "the world tab shows guilds by tier and families on a phone"];
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
