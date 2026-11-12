import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/workspace/.browser-tools/node_modules/playwright/index.mjs');
import * as C from '../src/core/index.js';
import {CLASSES} from '../src/data/classes.js';
import {CAREERS} from '../src/data/careers.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.addInitScript(()=>{
  const play=HTMLMediaElement.prototype.play;
  window.musicGesture=false;
  document.addEventListener('click',e=>{if(e.target.closest('#bgm'))window.musicGesture=true;},true);
  HTMLMediaElement.prototype.play=function(){return window.musicGesture?play.call(this):Promise.reject(new DOMException('User gesture required','NotAllowedError'));};
 });
 await p.goto(process.env.UX_URL||'http://127.0.0.1:5183/play.html');
 await p.locator('#bgm').click();
 await p.waitForFunction(()=>{const a=document.querySelector('#bgm-audio');return !a.paused&&a.currentTime>.2;});
 assert.equal(await p.locator('#bgm').getAttribute('aria-pressed'),'true');
 assert.ok(await p.locator('#bgm-audio').evaluate(a=>a.src.startsWith('data:audio/mpeg;base64,')));
 await p.locator('#bgm').click();assert.ok(await p.locator('#bgm-audio').evaluate(a=>a.paused));
 await p.reload();assert.equal(await p.locator('#bgm').getAttribute('aria-pressed'),'false');
 await p.locator('#bgm').click();await p.waitForFunction(()=>!document.querySelector('#bgm-audio').paused);
 console.log('PASS start-screen music button reachable, blocked autoplay retried on first tap, embedded MP3 advances, pause and stored-off work');
 for(const sex of ['m','f'])for(const ageM of [0,18,72,168,300,600,800,950]){
  const s=C.newLife('young-art');s.ageM=ageM;s.sex=sex;
  await p.evaluate(s=>localStorage.setItem('riftledger.slot.v2.0',JSON.stringify(s)),s);
  await p.reload();await p.locator('#start [data-a="load:0"]').click();
  await p.locator('[data-a="pause"]').click();await p.locator('[data-a="tab:me"]').click();
  const portrait=p.locator('#view .profile-sprite');
  assert.ok(await portrait.evaluate(el=>el.complete&&el.naturalWidth===256));
  assert.notEqual(await portrait.evaluate(el=>getComputedStyle(el).animationName),'none');
  await p.screenshot({path:`.tools/ux-refresh/young-${ageM}-${sex}.png`});
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await portrait.evaluate(el=>getComputedStyle(el).animationName),'none');
  await p.emulateMedia({reducedMotion:'no-preference'});
 }
 console.log('PASS infant/toddler portraits decode, move and respect reduced motion');
 await p.setViewportSize({width:1280,height:900});
 for(const sex of ['m','f'])for(const [kind,ids] of [['class',Object.keys(CLASSES)],['career',Object.keys(CAREERS)]])for(const id of ids){
  const s=C.newLife('motion-gallery');s.ageM=300;s.sex=sex;
  if(kind==='class')s.hunter={rank:3,rank0:3,ceil:4,cls:id,lv:1,xp:0,skills:[],slots:[],ex:false,broke:0};
  else s.job={id,tier:1};
  await p.evaluate(s=>localStorage.setItem('riftledger.slot.v2.0',JSON.stringify(s)),s);
  await p.reload();await p.locator('#start [data-a="load:0"]').click();await p.locator('[data-a="pause"]').click();
  const sprite=p.locator('#card .profile-sprite');
  assert.ok(await sprite.evaluate(el=>el.complete&&el.naturalWidth===256),id);
  assert.equal(await sprite.evaluate(el=>getComputedStyle(el).animationName),'character-frames',id);
  assert.ok((await sprite.locator('..').getAttribute('data-character')).endsWith('-'+sex));
  if(id==='knight'||id==='fmage')await p.screenshot({path:`.tools/ux-refresh/motion-${id}-${sex}.png`});
 }
 console.log('PASS all 15 class and 12 career portraits load and animate');
}finally{await browser.close();}
