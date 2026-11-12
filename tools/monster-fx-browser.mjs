import assert from 'node:assert/strict';
import esbuild from 'esbuild';
import {mkdirSync,readFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/workspace/.browser-tools/node_modules/playwright/index.mjs');
const bundle=await esbuild.build({stdin:{contents:"export * from './src/stage.js';export {monsterRaster} from './src/monster-art.js';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'Demo',loader:{'.png':'dataurl'},write:false,plugins:[{name:'stage-probe',setup(build){build.onLoad({filter:/[\/]src[\/]stage\.js$/},args=>({contents:readFileSync(args.path,'utf8')+'\nexport const activeEffectNames=()=>fxs.map(f=>f.name);',loader:'js'}));}}]});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
mkdirSync('.tools/monster-fx',{recursive:true});
const names=['ปลาไร้น้ำ','เงาใต้ท่าเทียบ','ผู้โดยสารคนสุดท้าย','อาจารย์ที่ยังสอนอยู่'];
try{
 const page=await browser.newPage({viewport:{width:800,height:500}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setContent('<style>body{background:#101723;color:white}canvas{width:768px;height:432px;image-rendering:pixelated}#ov{display:none}</style><canvas id="cv"></canvas><div id="ov"></div>');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(()=>{Demo.initStage(document.querySelector('canvas'),document.querySelector('#ov'));Demo.setHero('#b9a',false,300,null,'knight','f');Demo.setScene('tower');});
 await page.waitForFunction(names=>names.every(n=>Demo.monsterRaster(n,false)),names);
 for(const name of names)assert.equal(await page.evaluate(n=>Demo.monsterRaster(n,false).flip,name),false);
 assert.equal(await page.evaluate(()=>Demo.monsterRaster('ปลาบิน',false).flip),true);
 for(let i=0;i<names.length;i++){
  await page.evaluate(name=>{Demo.stage.speed=1;Demo.trigger({n:'fight',a:{foe:{n:name,hp:100,lv:10},win:true,wfx:'impacts/hit-spark',rounds:[{who:'e',dmg:5,crit:true},{who:'p',dmg:12},{who:'e',dmg:3},{who:'p',dmg:88}]}});},names[i]);
  await page.waitForTimeout(300);await page.screenshot({path:`.tools/monster-fx/combat-${i}.png`});
  await page.waitForTimeout(150);assert.ok(!(await page.evaluate(()=>Demo.activeEffectNames())).includes('impacts/crit-hit'),'critical hit must use one impact cue');
  await page.waitForFunction(()=>!Demo.stage.busy);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>Demo.stage.renderDisabled),false);
 }
 await page.evaluate(()=>{Demo.stage.calm=true;Demo.stage.speed=8;for(let i=0;i<20;i++)Demo.trigger({n:'surge'});});
 await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>Demo.stage.renderDisabled),false);
 assert.deepEqual(errors,[]);console.log('PASS four new monsters decode and finish combat; normal/calm/fast stage has no errors');
}finally{await browser.close();}
