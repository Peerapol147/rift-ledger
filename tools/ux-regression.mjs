// Browser behavior checks: build first, serve the repository, then run with UX_URL if needed.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import * as C from '../src/core/index.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/workspace/.browser-tools/node_modules/playwright/index.mjs');
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
const url = process.env.UX_URL || 'http://127.0.0.1:5183/play.html';
const event = C.newLife('ux-click-audit'); while (!event.ev) C.advance(event);
const adult = C.newLife('ux-ui-adult'); adult.ageM = 240; adult.ev = null; C.giveItem(adult, 'rustyKnife', 'UI test');
for (let i = 0; i < 600; i++) C.log(adult, 'ชีวิต', 'บันทึกชีวิตที่ผ่านมา เพื่อทดสอบการเข้าถึงแผนเดือนนี้');
mkdirSync('.tools/ux-refresh', {recursive:true});
const errors = []; let failed = 0;
async function open(fixture = event, mobile = false) {
  const context = await browser.newContext({viewport:mobile ? {width:390,height:844} : {width:1440,height:900},hasTouch:mobile,isMobile:mobile});
  await context.addInitScript(({fixture}) => {
    localStorage.setItem('riftledger.cfg.v2', JSON.stringify({policy:'stop',speed:1,fs:2,manualDefaults:1}));
    localStorage.setItem('riftledger.slot.v2.0', JSON.stringify(fixture));
  }, {fixture});
  const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(url); await p.locator('#start [data-a="load:0"]').click();
  await p.locator('[data-a="pause"]').click();
  return {p,context};
}
async function settings(p) { await p.locator('[data-a="settings"]').click(); await p.locator('#modal [data-a="close"]').waitFor(); }
async function test(name, fn) { try { await fn(); console.log('PASS', name); } catch(e) { failed++; console.error('FAIL',name,e.message); } }
try {
  await test('native Space opens focused settings button', async()=>{
    const {p,context}=await open(); try { await p.locator('[data-a="settings"]').focus(); await p.keyboard.press('Space'); await p.waitForTimeout(80); assert.ok(await p.locator('#modal').isVisible()); } finally { await context.close(); }
  });
  await test('dialog contains focus and blocks hidden choices', async()=>{
    const {p,context}=await open(); try {
      await settings(p); assert.ok(await p.evaluate(()=>document.querySelector('#modal').contains(document.activeElement)));
      await p.keyboard.press('Shift+Tab'); assert.ok(await p.evaluate(()=>document.querySelector('#modal').contains(document.activeElement)));
      await p.locator('#modal [data-a="close"]').focus(); await p.keyboard.press('1');
      await p.locator('#modal [data-a="save:0"]').click();
      assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('riftledger.slot.v2.0')).ev?.id),event.ev.id);
      await p.keyboard.press('Escape'); await p.locator('#modal').waitFor({state:'hidden'}); assert.equal(await p.evaluate(()=>document.activeElement?.dataset.a),'settings');
    } finally {await context.close();}
  });
  await test('cancelled touch does not choose, completed tap chooses once', async()=>{
    const {p,context}=await open(event,true);try {
      const choice=p.locator('[data-a^="choose:"]:not([disabled])').first(); await choice.scrollIntoViewIfNeeded();
      const r=await choice.boundingBox(), cdp=await context.newCDPSession(p), before=await p.locator('#event').innerText();
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+12}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}); await p.waitForTimeout(60);
      assert.equal(await p.locator('#event').innerText(),before); await choice.tap(); await p.waitForTimeout(80);
      assert.notEqual(await p.locator('#event').innerText(),before);
      await settings(p);await p.locator('#modal [data-a="save:0"]').click();
      assert.equal(await p.evaluate(id=>JSON.parse(localStorage.getItem('riftledger.slot.v2.0')).c['ev:'+id],event.ev.id),1);
    }finally{await context.close();}
  });
  await test('equipment refreshes while action button has focus', async()=>{
    const {p,context}=await open(adult);try {await p.locator('[data-a="tab:items"]').click();await p.locator('[data-a^="equip:"]').first().click();await p.waitForTimeout(100);assert.match(await p.locator('#view').innerText(),/สวมอยู่/);}finally{await context.close();}
  });
  await test('import draft survives settings and feedback stays above modal', async()=>{
    const {p,context}=await open();try {await settings(p);await p.locator('[data-c="importText"]').fill('draft-save');await p.locator('[data-a="fs:3"]').click();await p.waitForTimeout(80);assert.equal(await p.locator('[data-c="importText"]').inputValue(),'draft-save');await p.locator('#modal [data-a="save:0"]').click();assert.ok(await p.locator('#banner').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));}finally{await context.close();}
  });
  await test('monthly plan reachable with long mobile log', async()=>{
    const {p,context}=await open(adult,true);try {const plan=p.locator('#planbox summary');assert.equal(await plan.count(),1);const r=await plan.boundingBox();assert.ok(r.y+r.height<=844);await plan.click();await p.locator('#plan [data-a^="focus:"]').first().click();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:'.tools/ux-refresh/mobile.png'});}finally{await context.close();}
  });
  await test('inventory pauses time and search updates without losing focus', async()=>{
    const {p,context}=await open(adult);try {
      await p.locator('[data-a="pause"]').click();await p.locator('[data-a="tab:items"]').click();
      await p.waitForTimeout(1100);await settings(p);await p.locator('#modal [data-a="save:0"]').click();
      assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('riftledger.slot.v2.0')).ageM),adult.ageM);
      await p.locator('#modal [data-a="close"]').click();
      await p.locator('[data-c="q"]').fill('not-a-real-item');await p.waitForTimeout(80);
      assert.match(await p.locator('#view').innerText(),/ไม่มีของที่ตรงเงื่อนไข/);
      assert.equal(await p.evaluate(()=>document.activeElement.dataset.c),'q');
      await p.locator('[data-c="q"]').fill('');await p.waitForTimeout(60);assert.ok(await p.locator('[data-a^="equip:"]').count());
      await p.screenshot({path:'.tools/ux-refresh/desktop.png'});
    }finally{await context.close();}
  });
  await test('small-screen large type has no horizontal overflow and controls remain reachable', async()=>{
    const {p,context}=await open(adult,true);try {
      await p.setViewportSize({width:320,height:568});await settings(p);await p.locator('[data-a="fs:3"]').click();await p.waitForTimeout(80);
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await p.locator('#modal [data-a="close"]').click();await p.waitForTimeout(80);
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await p.locator('[data-a="speed:16"]').count(),0);
      const r=await p.locator('#planbox summary').boundingBox();assert.ok(r.y+r.height<568);
      await p.screenshot({path:'.tools/ux-refresh/mobile-320.png'});
    }finally{await context.close();}
  });
  await test('bulk-sale cutoff stays truthful after other inventory actions', async()=>{
    const fixture=structuredClone(adult);C.giveItem(fixture,'hunterBow','UI test');
    const {p,context}=await open(fixture);try {
      await p.locator('[data-a="tab:items"]').click();await p.locator('[data-c="junk"]').selectOption('2');
      await p.locator('[data-a^="equip:"]').first().click();await p.waitForTimeout(80);
      assert.equal(await p.locator('[data-c="junk"]').inputValue(),'2');
    }finally{await context.close();}
  });
  await test('finished life overlay stays above mobile navigation', async()=>{
    const {p,context}=await open(adult,true);try {
      const dead={...structuredClone(adult),dead:{cause:'test ending'}};
      await p.evaluate(dead=>localStorage.setItem('riftledger.slot.v2.1',JSON.stringify(dead)),dead);
      await settings(p);await p.locator('#modal [data-a="load:1"]').click();await p.locator('#end').waitFor({state:'visible'});await p.locator('#modal').waitFor({state:'hidden'});
      assert.ok(await p.evaluate(()=>document.querySelector('#end').contains(document.elementFromPoint(innerWidth/2,innerHeight-25))));
    }finally{await context.close();}
  });
  assert.deepEqual(errors,[]);
} finally {await browser.close();}
if(failed)process.exitCode=1;
