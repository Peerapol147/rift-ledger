// Pixel-preserving idle frames, feet fixed to the ground.
export function idlePose(time, fighting = false) {
 const cycle = ((time % 4.7) + 4.7) % 4.7;
 return { blink: !fighting && cycle > 3.92 && cycle < 4.06,
 breath: Math.sin(time * 2.2) > .35 ? -1 : 0,
 sway: Math.sin(time * 1.6) > .55 ? 1 : 0,
 coat: Math.sin(time * 2.7) > 0 ? 1 : 0 };
}
export function idleRows(rows, time, fighting = false) {
 const pose = idlePose(time, fighting), w = rows[0].length;
 const out = rows.map(r => [...r]);
 if (pose.blink) { for (const x of [25,26,27]) if (out[7][x] !== '.') out[7][x] = 'W'; }
 const result = Array.from({length:rows.length + 1}, () => Array(w + 2).fill('.'));
 out.forEach((row,y) => row.forEach((c,x) => {
  if (c === '.') return;
  const dy = y < 34 ? pose.breath : 0;
  const dx = y < 20 ? pose.sway : x < 16 && y < 40 ? pose.coat : 0;
  result[y + 1 + dy][x + 1 + dx] = c;
 }));
 return result.map(r => r.join(''));
}

export function civilianIdleRows(rows, time) {
 const pose = idlePose(time), h = rows.length, w = rows[0].length;
 const out = Array.from({length:h+1},()=>Array(w+2).fill('.'));
 rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')out[y+1+(y<h*.7?pose.breath:0)][x+1+(y<14?pose.sway:0)]=c;}));
 return out.map(r=>r.join(''));
}
