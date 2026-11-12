"""Deterministic ImageMagick slicing only; artwork is generated with image_gen."""
import json, subprocess, re
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
TMP=ROOT/'.tools/animation-rebuild';TMP.mkdir(parents=True,exist_ok=True)
def run(*args):
 return subprocess.check_output(['magick',*map(str,args)],text=True).strip()
manifest={}
for job in json.loads((ROOT/'art/animation/generation.json').read_text()):
 source=ROOT/job['file']; w,h=map(int,run('identify','-format','%w %h',source).split())
 for row,key in enumerate(job['keys']):
  cells=[];bounds=[]
  for col in range(4):
   x0,x1=round(w*col/4),round(w*(col+1)/4);y0,y1=round(h*row/4),round(h*(row+1)/4)
   cell=TMP/f'{key}-{col}-crop.png'
   run(source,'-crop',f'{x1-x0}x{y1-y0}+{x0}+{y0}','+repage','-channel','A','-threshold','65%','+channel',cell)
   # Trim alpha noise using alpha threshold, preserving every retained pixel.
   geom=run(cell,'-trim','-format','%@','info:')
   # Use page offsets from trim, not %@ (which describes the trimmed image itself).
   vals=run(cell,'-trim','-format','%w %h %X %Y','info:').split()
   bw,bh,bx,by=map(int,vals);bounds.append((bw,bh,bx,by,x1-x0,y1-y0));cells.append(cell)
  maxh=max(b[1] for b in bounds);maxw=max(b[0] for b in bounds)
  scale=min(56/maxh,58/maxw)
  frames=[]
  for col,(cell,b) in enumerate(zip(cells,bounds)):
   bw,bh,bx,by,cw,ch=b
   # A common scale for the whole sequence avoids size pulsing. Feet remain at y=60.
   nw,nh=max(1,round(bw*scale)),max(1,round(bh*scale))
   # Read alpha only to measure the actual foot anchor; ImageMagick performs all transforms.
   alpha=Image.open(cell).convert('RGBA').getchannel('A')
   band=max(1,round(4/scale))
   xs=[x for y in range(max(by,by+bh-band),by+bh) for x in range(bx,bx+bw) if alpha.getpixel((x,y))]
   anchor=sum(xs)/len(xs)
   left=round(32+(bx-anchor)*scale);top=60-nh
   frame=TMP/f'{key}-{col}.png'
   run('-size','64x64','xc:none','(',cell,'-trim','+repage','-filter','box','-resize',f'{nw}x{nh}!','-channel','A','-threshold','55%','+channel',')','-geometry',f'+{left}+{top}','-compose','over','-composite',frame)
   frames.append(frame)
  out=ROOT/'art/animation'/f'{key}.png';run(*frames,'+append','+dither','-colors','48','-channel','A','-threshold','50%','+channel','-strip',out)
  manifest[key]={'file':f'art/animation/{key}.png','source':job['file'],'row':row,'frames':4,'width':64,'height':64,'baseline':60,'scale':round(scale,6)}
(ROOT/'art/animation/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
lines=[f'import a{i} from "../{v["file"]}";' for i,v in enumerate(manifest.values())]
lines+=['export const FRAME_URLS={']+[f' "{key}":a{i},' for i,key in enumerate(manifest)]+['};']
(ROOT/'src/character-sheets.gen.js').write_text('\n'.join(lines)+'\n')
print(f'Normalized {len(manifest)} sequences / {len(manifest)*4} frames')
