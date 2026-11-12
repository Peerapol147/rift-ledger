import assert from 'node:assert/strict';
import esbuild from 'esbuild';
import {readFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/workspace/.browser-tools/node_modules/playwright/index.mjs');
const bundle=await esbuild.build({stdin:{contents:"export * from './src/character-frames.js'",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'Frames',loader:{'.png':'dataurl'},write:false});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 const keys=Object.keys(JSON.parse(readFileSync('art/animation/manifest.json')));
 await page.evaluate(keys=>keys.forEach(Frames.loadCharacter),keys);
 await page.waitForFunction(keys=>keys.every(k=>Frames.characterFrame(k,0,4)),keys);
 const results=await page.evaluate(keys=>keys.map(key=>{
  const frames=[0,1,2,3].map(t=>Frames.characterFrame(key,t,4));
  const hash=f=>f.pixels.reduce((a,b)=>Math.imul(a^b,16777619)>>>0,2166136261);
  return {key,hashes:frames.map(hash),rest:hash(Frames.characterFrame(key,2,4,true)),busy:hash(Frames.characterFrame(key,2,4,false,true))};
 }),keys);
 for(const r of results){assert.ok(new Set(r.hashes).size>1,r.key);assert.equal(r.rest,r.hashes[0]);assert.equal(r.busy,r.hashes[0]);}
 assert.deepEqual(errors,[]);console.log(`PASS ${keys.length} browser-decoded stage sequences: distinct frames, calm/busy freeze, no errors`);
}finally{await browser.close();}
