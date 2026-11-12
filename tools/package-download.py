"""Run after npm run build to package the current self-contained game for download."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

root = Path(__file__).resolve().parent.parent
source = root / 'play.html'
output = root / 'downloads/rift-ledger-play.zip'
output.parent.mkdir(exist_ok=True)
instructions = '''วิธีเปิดเกม Rift Ledger
1. แตกไฟล์ ZIP นี้ก่อน
2. เปิด play.html ด้วย Chrome, Edge, Firefox หรือ Safari
3. กด “เปิดเพลง” ภายในเกมเพื่อเปิดเสียง
เพลงและภาพฝังอยู่ใน play.html แล้ว ไม่ต้องดาวน์โหลดแยก
หากเล่นผ่านหน้าต่าง preview แล้วเกมไม่ทำงาน ให้เปิดไฟล์ด้วยเบราว์เซอร์โดยตรง
'''
with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    archive.write(source, 'rift-ledger/play.html')
    archive.writestr('rift-ledger/วิธีเปิดเกม.txt', instructions)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert archive.read('rift-ledger/play.html') == source.read_bytes()
print(f'{output.name}: {output.stat().st_size:,} bytes; ZIP integrity and HTML equality verified')
print('play.html SHA256:', hashlib.sha256(source.read_bytes()).hexdigest())
