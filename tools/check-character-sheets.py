"""Read-only raster checks; does not draw or modify images."""
import json, hashlib
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'art/animation/manifest.json').read_text());issues=[];metrics={}
for key,meta in manifest.items():
 im=Image.open(root/meta['file']).convert('RGBA')
 if im.size!=(256,64):issues.append(key+': dimensions')
 hashes=[];feet=[];centers=[]
 for i in range(4):
  frame=im.crop((i*64,0,(i+1)*64,64));a=frame.getchannel('A');bbox=a.getbbox()
  if not bbox:issues.append(key+': blank frame');continue
  if bbox[0]==0 or bbox[1]==0 or bbox[2]==64 or bbox[3]>60:issues.append(key+': clipped margin')
  feet.append(bbox[3]);hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
  xs=[x for y in range(56,60) for x in range(64) if a.getpixel((x,y))]
  centers.append(round(sum(xs)/len(xs),2) if xs else None)
  if set(a.getdata())!={0,255}:issues.append(key+': nonbinary alpha')
 if len(set(hashes))<2:issues.append(key+': no animation variation')
 if max(feet)-min(feet)>1:issues.append(key+': unstable floor')
 if None not in centers and max(centers)-min(centers)>2:issues.append(key+': horizontal foot drift')
 metrics[key]={'baseline':feet,'footCenters':centers,'uniqueFrames':len(set(hashes))}
(root/'.tools/animation-rebuild/qa.json').write_text(json.dumps(metrics,indent=2))
print(f'{len(manifest)} sheets checked; {len(issues)} issues')
print('\n'.join(issues));raise SystemExit(bool(issues))
