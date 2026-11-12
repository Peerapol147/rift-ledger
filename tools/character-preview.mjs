// Native-pixel review board; uses the same strips and step timing as the game.
import {readFileSync,writeFileSync} from 'node:fs';
import {motionProfile} from '../src/character-motion.js';
const manifest=JSON.parse(readFileSync('art/animation/manifest.json'));
const html=`<!doctype html><meta charset="utf-8"><title>Rift Ledger · Character animation review</title>
<style>body{background:#182235;color:#eee;font:13px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fill,160px);gap:16px}.window{width:128px;height:128px;overflow:hidden;margin:auto}img{display:block;max-width:none;width:400%;height:100%;image-rendering:pixelated;animation:frames var(--period) steps(4,end) infinite}figure{margin:0;text-align:center;border:1px solid #384559;padding:12px 0}figcaption{margin-top:8px}@keyframes frames{to{transform:translateX(-100%)}}@media(prefers-reduced-motion:reduce){img{animation:none}}</style>
<h1>Rift Ledger · 68 original character sequences</h1><p>Four frames per identity · Female and male · Original project references · Reduced motion respected</p><main>`+
Object.keys(manifest).map(key=>{
 const kind=key.replace(/-[mf]$/,''),cls=kind.startsWith('class-')?kind.slice(6):null,career=kind.startsWith('career-')?kind.slice(7):null;
 const age={infant:0,toddler:18,child:72,teen:168,adult:300,middle:600,elder:800,old:950}[kind.slice(4)]??300;
 return `<figure><div class="window" style="--period:${motionProfile(age,cls,career).period}s"><img src="${key}.png" alt="${key}"></div><figcaption>${key}</figcaption></figure>`;
}).join('')+'</main>';
writeFileSync('art/animation/preview.html',html);
