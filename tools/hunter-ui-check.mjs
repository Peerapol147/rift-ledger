// Functional/browser checks for the approved Hunter UI. Run after npm run build.
// GAME_URL=http://127.0.0.1:5183 CHROMIUM_EXECUTABLE=/usr/bin/chromium node tools/hunter-ui-check.mjs
import { createRequire } from 'node:module';
import * as C from '../src/core/index.js';
import { TABS } from '../src/ui/layout.js';
const {chromium}=createRequire(import.meta.url)('playwright');
const url=process.env.GAME_URL ?? 'http://127.0.0.1:5183';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE
  ? {executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']} : {})});
const results=[];
const check=(ok,message)=>{if(!ok)throw new Error(message);};
async function screen(width,age=30,font=2,notices=false) {
  const context=await browser.newContext({viewport:{width,height:844}});
  const s=C.newLife('hunter-browser');s.ageM=age*12;s.focus=age<4?'cuddle':age<18?'study':'work';
  if(age>=18)s.job={id:'office',tier:1,xp:0};
  if(notices)s.hp=20;
  C.openEvent(s,{id:'browser-choice',tag:'ชีวิต',t:'เหตุการณ์ทดสอบหน้าจอ',o:[
    {l:'รับเงิน',...(notices?{need:{gold:100000}}:{}),y:{gold:50,m:'ได้รับเงินแล้ว'}},{l:'ผ่านไป',y:{mind:1}}]});
  await context.addInitScript(({s,font})=>{
    if(sessionStorage.getItem('hunter-test'))return;
    sessionStorage.setItem('hunter-test','1');
    localStorage.setItem('riftledger.slot.v2.0',s);
    localStorage.setItem('riftledger.cfg.v2',JSON.stringify({speed:2,policy:'stop',fs:font}));
  },{s:C.serialize(s),font});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('[data-a="load:0"]').click();await page.waitForTimeout(180);
  return {page,context,s,errors};
}
async function run(name,fn){if(process.env.HUNTER_CHECK&&!name.includes(process.env.HUNTER_CHECK))return;try{await fn();results.push({name,passed:true});console.log('PASS '+name);}
  catch(e){results.push({name,passed:false,error:e.message});console.log('FAIL '+name+': '+e.message);}}
await run('the title city artwork loads from the embedded game',async()=>{
  const page=await browser.newPage();await page.goto(url,{waitUntil:'networkidle'});
  check(await page.locator('#title-backdrop').count()===1,'title artwork missing');
  check(await page.locator('#title-backdrop').evaluate(e=>e.complete&&e.naturalWidth>0),'title artwork did not load');
  await page.close();
});
await run('desktop exposes all unlocked game tabs',async()=>{
  const {page,context,s,errors}=await screen(1440);
  for(const [id,,ok]of TABS)if(ok(s))check(await page.locator(`[data-a="tab:${id}"]:visible`).count()===1,id+' missing');
  check(await page.locator('#tabs').evaluate(e=>e.getBoundingClientRect().height<80),'navigation is not a single row');
  check(errors.length===0,errors.join(';'));await context.close();
});
await run('mobile More reaches every extra tab and closes after selection',async()=>{
  const {page,context}=await screen(390);
  check(!(await page.locator('#nav-more').evaluate(e=>e.open)),'menu starts open');
  for(const id of ['world','book','work']){
    await page.locator('#nav-more summary').click();await page.locator(`[data-a="tab:${id}"]`).click();
    await page.waitForTimeout(100);check(!(await page.locator('#nav-more').evaluate(e=>e.open)),'menu did not close');
    check(await page.locator(`[data-a="tab:${id}"]`).getAttribute('aria-current')==='page','selection missing');
  }await context.close();
});
await run('Space opens plan and More disclosures without pausing gameplay',async()=>{
  const {page,context}=await screen(390);
  for(const id of ['plan-options','nav-more']){
    await page.locator('#'+id+' summary').focus();await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    check(await page.locator('#'+id).evaluate(e=>e.open),id+' did not open');
    check((await page.locator('.system-status').innerText()).includes('รอคุณเลือก'),'Space paused the game');
  }await context.close();
});
await run('mobile exposes health alerts and pinned goals with working unpin',async()=>{
  const {page,context}=await screen(390,30,2,true);
  await page.locator('[data-a="pin:0"]').click();await page.waitForTimeout(150);
  check(await page.locator('.mobile-notices .alert:visible').count()>0,'health alert is hidden');
  check(await page.locator('.mobile-notices .goal:visible').count()>0,'pinned goal is hidden');
  await page.locator('.mobile-notices [data-a^="unpin:"]').click();await page.waitForTimeout(150);
  check(await page.locator('.mobile-notices .goal').count()===0,'unpin did not remove goal');
  await context.close();
});
await run('plan controls stay open through selection and redraw',async()=>{
  const {page,context}=await screen(390);await page.locator('#plan-options summary').click();
  await page.locator('[data-a="focus:study"]').click();await page.waitForTimeout(200);
  check(await page.locator('#plan-options').evaluate(e=>e.open),'plan lost open state');
  check(await page.locator('.plan-primary').innerText()==='เรียนเพิ่ม','main plan not updated');
  await page.locator('[data-a="focus2:train"]').click();await page.waitForTimeout(150);
  check((await page.locator('.plan-secondary').innerText()).includes('ฝึกฝน'),'secondary plan not updated');
  await context.close();
});
for(const [width,age,font]of [[320,0,2],[390,15,2],[390,30,2],[320,75,3],[820,30,3],[1024,30,2],[1440,30,3]]){
  await run(`layout ${width}px age ${age} font ${font}`,async()=>{
    const {page,context,errors}=await screen(width,age,font);
    check(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'horizontal overflow');
    check(await page.locator('#hud').innerText().then(t=>t.includes('รอคุณเลือก')),'waiting status missing');
    if(width<=820){
      const geometry=await page.locator('#lifeplan').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY}));
      check(geometry.top<900,'plan buried below character details');
      check(await page.locator('#tabs').evaluate(e=>e.scrollWidth<=e.clientWidth),'navigation scrolls horizontally');
    }
    check(errors.length===0,errors.join(';'));await context.close();
  });
}
await run('real choice and keyboard settings still work',async()=>{
  const {page,context}=await screen(390);
  const settingsButton=await page.locator('[data-a="settings"]').elementHandle();
  await page.locator('[data-a="choose:0"]').click();
  await page.waitForTimeout(100);check((await page.locator('#event').innerText()).includes('ได้รับเงินแล้ว'),'choice did not apply');
  check(await settingsButton.evaluate(e=>e.isConnected),'settings button replaced during redraw');
  await page.locator('[data-a="settings"]').click();await page.waitForTimeout(100);
  check(await page.locator('#modal').getAttribute('aria-modal')==='true','not a modal');
  await page.keyboard.press('Escape');await page.locator('#modal').waitFor({state:'hidden'});
  check(await page.locator('#modal').isHidden(),'Escape did not close');
  await context.close();
});
await browser.close();
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
