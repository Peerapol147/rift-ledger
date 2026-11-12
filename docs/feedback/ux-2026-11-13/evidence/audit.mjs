import {mkdirSync} from 'node:fs';
mkdirSync('.tools/ux-audit',{recursive:true});
mkdirSync('.tools/ux-research',{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || '/workspace/.browser-tools/node_modules/playwright/index.mjs');
import * as C from '../../../../src/core/index.js';
import {writeFileSync} from 'node:fs';
const event=C.newLife('ux-click-audit');for(let i=0;i<100&&!event.ev;i++)C.advance(event);if(!event.ev)throw Error('No real event fixture');
let adult=C.newLife('ux-adult-audit');for(let i=0;i<2000&&!adult.dead&&adult.ageM<240;i++){if(adult.ev){const k=adult.ev.opts.findIndex(o=>{const v=C.optionView(adult,o);return v.visible&&!v.locked;});C.choose(adult,k);}else C.advance(adult);}if(adult.ageM<240)throw Error('Adult fixture failed');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const reports=[];const errors=[];
async function open({width=1440,height=900,fixture=event,mobile=false,blockedStorage=false}={}){
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(({fixture,blockedStorage})=>{localStorage.setItem('riftledger.cfg.v2',JSON.stringify({policy:'stop',speed:1,fs:2}));if(fixture)localStorage.setItem('riftledger.slot.v2.0',JSON.stringify(fixture));if(blockedStorage)Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')};},{fixture,blockedStorage});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5182/play.html',{waitUntil:'domcontentloaded'});await page.locator('#start h1').waitFor();
 if(fixture){await page.locator('#start [data-a="load:0"]').click();await page.waitForFunction(()=>document.querySelector('#card').textContent.length>30);await page.locator('[data-a="pause"]').click();}
 return {context,page};
}
async function settings(page){await page.locator('[data-a="settings"]').click();await page.locator('#modal [data-a="close"]').waitFor();}
async function snapshot(page){return page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,active:document.activeElement?.outerHTML?.slice(0,200),modalRole:document.querySelector('#modal').getAttribute('role'),modalAria:document.querySelector('#modal').getAttribute('aria-modal'),minButtonHeight:Math.min(...[...document.querySelectorAll('button')].map(b=>b.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>r.height))}));}
try {
// Basic mouse flow and save/export/reload.
{
 const {context,page}=await open();const tabs=[];for(const a of ['tab:me','tab:world','tab:book','tab:log']){await page.locator(`[data-a="${a}"]`).click();await page.waitForFunction(a=>document.querySelector(`[data-a="${a}"]`).classList.contains('on'),a);tabs.push(a);}
 const focus=page.locator('#card [data-a^="focus:"]').last();const focusAction=await focus.getAttribute('data-a');await focus.click();await page.waitForFunction(a=>document.querySelector(`[data-a="${a}"]`).classList.contains('on'),focusAction);
 await settings(page);await page.locator('[data-a="save:0"]').click();await page.locator('[data-a="export:0"]').click();const exported=await page.locator('#modal textarea').inputValue();const saved=JSON.parse(exported);await page.locator('#modal [data-a="quit"]').click();await page.locator('#start [data-a="load:0"]').click();await page.locator('#game').waitFor({state:'visible'});
 reports.push({test:'mouse_core_flow',tabs,plan:saved.focus,exportedBytes:exported.length,reloadVisible:await page.locator('#game').isVisible()});await context.close();
}
// Keyboard Space on focused button.
{
 const {context,page}=await open();await page.locator('[data-a="settings"]').focus();await page.keyboard.press('Space');await page.waitForTimeout(70);reports.push({test:'space_on_settings_button',modalVisible:await page.locator('#modal').isVisible(),pauseLabel:await page.locator('[data-a="pause"]').innerText(),...await snapshot(page)});await context.close();
}
// Dialog focus leak, and shortcut 1 changes a pending event behind it.
{
 const {context,page}=await open();const before=await page.locator('#event .ev p').first().innerText();await settings(page);const modalOpen=await snapshot(page);await page.keyboard.press('Tab');const tabFocus=await snapshot(page);await page.locator('#modal [data-a="close"]').focus();await page.keyboard.press('1');await page.waitForTimeout(70);await page.locator('#modal [data-a="save:0"]').click();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('riftledger.slot.v2.0')));await page.screenshot({path:'.tools/ux-audit/modal-shortcut.png'});reports.push({test:'modal_focus_and_hidden_choice',beforeEvent:event.ev.id,beforeText:before,afterEvent:after.ev?.id??null,modalStillVisible:await page.locator('#modal').isVisible(),modalOpen,tabFocus});await context.close();
}
// Typing a save code followed by a font action loses the visible value.
{
 const {context,page}=await open();await settings(page);await page.locator('[data-c="importText"]').fill('audit-save-code');await page.locator('[data-a="fs:3"]').click();await page.waitForTimeout(70);reports.push({test:'import_field_after_font_change',typed:'audit-save-code',visibleValue:await page.locator('[data-c="importText"]').inputValue()});await context.close();
}
// Pointer cancellation must not choose a consequential option.
{
 const {context,page}=await open({width:390,height:844,mobile:true});const choice=page.locator('[data-a^="choose:"]:not([disabled])').first();await choice.scrollIntoViewIfNeeded();const box=await choice.boundingBox();const before=await page.locator('#event').innerText();const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+Math.min(15,box.height/2)}]});await page.waitForTimeout(60);const afterDown=await page.locator('#event').innerText();await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await settings(page);await page.locator('[data-a="save:0"]').click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('riftledger.slot.v2.0')));reports.push({test:'touch_cancel_choice',beforeEvent:event.ev.id,afterEvent:saved.ev?.id??null,changedBeforeFingerLift:before!==afterDown});await page.screenshot({path:'.tools/ux-audit/touch-cancel.png'});await context.close();
}
// Storage errors are deliberately injected only in this isolated test profile.
{
 const {context,page}=await open({blockedStorage:true});await settings(page);await page.locator('[data-a="save:1"]').click();await page.waitForTimeout(60);reports.push({test:'failed_save_feedback',banner:await page.locator('#banner').innerText(),slot1:await page.evaluate(()=>localStorage.getItem('riftledger.slot.v2.1'))});await context.close();
}
// Deletion confirmation.
{
 const {context,page}=await open();let dialogs=0;page.on('dialog',async d=>{dialogs++;await d.dismiss();});await settings(page);await page.locator('#modal [data-a="del:0"]').click();reports.push({test:'delete_save_confirmation',dialogs,slotDeleted:await page.evaluate(()=>localStorage.getItem('riftledger.slot.v2.0')===null)});await context.close();
}
// Desktop and phone layout with all age-gated tabs available.
for(const [width,height,mobile] of [[1440,900,false],[390,844,true],[320,568,true]]){
 const {context,page}=await open({width,height,mobile,fixture:adult});const layout=await snapshot(page);const tabMetrics=await page.locator('#tabs').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));await page.screenshot({path:`.tools/ux-audit/adult-${width}.png`,fullPage:true});await settings(page);const modal=await snapshot(page);const close=await page.locator('#modal [data-a="close"]').boundingBox();await page.locator('[data-a="fs:3"]').click();const font=await page.evaluate(()=>getComputedStyle(document.body).fontSize);await page.screenshot({path:`.tools/ux-audit/settings-${width}.png`,fullPage:true});reports.push({test:'layout',width,height,layout,tabMetrics,modal,close,font});await context.close();
}
} finally {await browser.close();writeFileSync('.tools/ux-audit/results.json',JSON.stringify({fixture:{seed:event.seed,event:event.ev.id,age:event.ageM},reports,errors},null,2));console.log(JSON.stringify({reports,errors},null,2));}
