import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/workspace/.browser-tools/node_modules/playwright/index.mjs');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
let failures=0;
try{
 const p=await browser.newPage();
 await p.addInitScript(()=>{const native=HTMLMediaElement.prototype.play;let first=true;
  HTMLMediaElement.prototype.play=function(){if(first&&this.id==='bgm-audio'){first=false;return new Promise((_,reject)=>window.rejectOldMusic=reject);}return native.call(this);};
 });
 await p.goto(process.env.UX_URL||'http://127.0.0.1:5184/play.html');
 await p.locator('#bgm').click();await p.waitForFunction(()=>document.querySelector('#bgm-audio').currentTime>.7);
 await p.evaluate(()=>window.rejectOldMusic(new DOMException('Old blocked request','NotAllowedError')));
 await p.waitForTimeout(50);
 try{assert.equal(await p.locator('#bgm').textContent(),'🔊 ปิดเพลง');console.log('PASS stale play rejection cannot overwrite playing button');}catch(e){failures++;console.error('FAIL stale play rejection',e.message);}
 const time=await p.evaluate(async()=>{
  const {replaceView}=await import('/src/ui/interaction.js');
  const root=document.createElement('div');document.body.append(root);
  const markup='<div class="profile-art"><img class="profile-sprite" style="animation:character-frames 5s steps(4,end) infinite"></div>';
  replaceView(root,markup);await new Promise(r=>setTimeout(r,200));
  const before=root.querySelector('img').getAnimations()[0].currentTime;
  replaceView(root,markup);await new Promise(requestAnimationFrame);
  return {before,after:root.querySelector('img').getAnimations()[0].currentTime};
 });
 try{assert.ok(time.after>=time.before,JSON.stringify(time));console.log('PASS portrait animation remains continuous across DOM refresh');}catch(e){failures++;console.error('FAIL portrait continuity',e.message);}
}finally{await browser.close();}process.exitCode=failures?1:0;
