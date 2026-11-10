// Original procedural pixel assets; no external images or downloads.
export const WEATHER = {normal:{label:'อากาศปกติ',sky:'#8aafc2',horizon:'#d7dcca',far:'#91a4ac',wall:'#667d8d',ground:'#697e68',leaf:'#659568'},winter:{label:'หน้าหนาว',sky:'#8eabc4',horizon:'#e1e9ee',far:'#b0becb',wall:'#71899e',ground:'#cedfe5',leaf:'#dce9e9'},summer:{label:'หน้าร้อน',sky:'#e9b77d',horizon:'#ffe3a0',far:'#b9a083',wall:'#957b6d',ground:'#b79b68',leaf:'#9c9d51'},sunny:{label:'แดดออก',sky:'#66b3df',horizon:'#d5ecdb',far:'#8aafb3',wall:'#658691',ground:'#7b9b62',leaf:'#64a76a'},rainy:{label:'หน้าฝน',sky:'#7f93a0',horizon:'#b9c3c4',far:'#7d8d94',wall:'#5d6f7c',ground:'#5f7363',leaf:'#4f7d5c',amb:'rain'}};
// Seasons last months, not one: hot Mar-May, wet Jun-Oct, cool Nov-Feb. Each place has its own look per season,
// and one roll per season per year picks an off year (a dry rainy season, a warm winter), so the sky holds still until the season turns.
const SEASON={hot:{home:'summer',city:'summer',street:'sunny',off:'sunny'},wet:{home:'rainy',city:'normal',street:'rainy',off:'normal'},cool:{home:'winter',city:'winter',street:'winter',off:'normal'}};
export function weatherFor(month=0,place='home') {
 const m=((month%12)+12)%12,yr=Math.floor(month/12),k=m>=10||m<2?'cool':m<5?'hot':'wet',S=SEASON[k];
 const roll=Math.abs(Math.sin((yr-(m<2?1:0))*12.9898+k.length*78.233)*43758.5453)%1;
 return roll<0.25?S.off:S[place]||S.home;
}
export function drawWeather(set,W,H,G,mode,time=0,foreground=false) {
 const p=WEATHER[mode]||WEATHER.normal;
 const rect=(x,y,w,h,c)=>{for(let j=Math.max(0,Math.floor(y));j<Math.min(H,y+h);j++)for(let i=Math.max(0,Math.floor(x));i<Math.min(W,x+w);i++)set(i,j,c);};
 const cloud=(x,y)=>{rect(x,y+3,31,5,'#e7efec');rect(x+6,y,17,9,'#e7efec');rect(x+3,y+8,26,2,'#c9dadc');};
 if(foreground){
  if(mode==='winter')for(let i=0;i<32;i++){const x=((i*47+Math.sin(time*.7+i)*5+time*4)%W+W)%W,y=(i*29+time*(7+i%4))%(G+4);rect(x,y,1+i%2,1,'#f3f6f1');}
  if(mode==='summer')for(let i=0;i<6;i++)rect((i*47+time*4)%W,G-5-Math.sin(time+i)*3,5,1,'#dcc393');
  return;
 }
 rect(0,0,W,H,p.sky);rect(0,48,W,G-48,p.horizon);
 if(mode==='sunny'||mode==='summer'){const x=W-49;rect(x-10,16,22,18,'#ffe4a0');rect(x-7,12,16,26,'#ffe4a0');rect(x-5,17,12,16,'#fff2bb');for(let i=0;i<4;i++)rect(x-25+i*18,44+i*4,9,1,'#f8dfa4');}
 for(let i=0;i<(mode==='summer'?1:3);i++)cloud(((i*91+time*(mode==='winter'?2:1))%(W+38))-32,14+i%2*16);
 for(let i=0;i<12;i++){const x=i*25-6,h=18+(i*17)%28;rect(x,G-20-h,21,h,p.far);rect(x+4,G-23-h,9,3,p.far);}
 rect(0,G-9,W,9,p.ground);
 for(let i=0;i<5;i++){const x=i*62-18,h=34+(i*13)%22,y=G-10-h;rect(x,y,45,h,p.wall);rect(x-2,y-3,49,4,mode==='winter'?'#edf3ef':'#425667');rect(x+4,y+4,2,h-4,'#8c9c9f');for(let a=0;a<3;a++)for(let b=0;b<3;b++){rect(x+10+a*11,y+8+b*11,6,7,'#344c60');rect(x+11+a*11,y+9+b*11,4,3,mode==='winter'?'#f5cf8e':'#bcd7cf');}}
 for(const x of [20,W-27]){rect(x,G-40,4,30,'#65564c');rect(x-9,G-55,22,16,p.leaf);rect(x-13,G-47,30,12,p.leaf);rect(x-6,G-59,15,7,p.leaf);rect(x-9,G-40,24,4,mode==='winter'?'#b7cdd7':'#47765a');}
 rect(0,G-6,W,6,mode==='winter'?'#eef4f0':'#b2b4a0');rect(0,G,W,H-G,mode==='winter'?'#a0b8c7':'#485663');rect(0,G,W,1,'#334653');
 for(let x=8;x<W;x+=32)rect(x,G+9,15,2,mode==='winter'?'#dce7e6':'#bcbba1');
 if(mode==='summer')for(let x=0;x<W;x+=27){rect(x,G-4,7,1,'#d5ba83');rect(x+5,G-3,1,2,'#907a55');}
}
