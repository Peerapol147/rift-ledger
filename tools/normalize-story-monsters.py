"""ImageMagick normalization of generated source; no procedural monster drawing."""
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
names=['beast/waterless-fish','spirit/pier-shadow','spirit/last-passenger','spirit/teacher-still-teaching']
# Measured source boundaries preserve the commuter strap above the nominal half-row.
regions=['630x580+0+0','631x590+630+0','630x667+0+580','631x657+630+590']
for name,region in zip(names,regions):
 subprocess.run(['magick',str(ROOT/'art/monsters/source-atlases/story-quartet-refined.png'),'-crop',region,'+repage','-channel','A','-threshold','60%','+channel','-trim','+repage','-filter','box','-resize','48x48','-channel','A','-threshold','55%','+channel','+dither','-colors','14','-background','none','-gravity','center','-extent','56x56',str(ROOT/'art/monsters'/f'{name}.png')],check=True)
