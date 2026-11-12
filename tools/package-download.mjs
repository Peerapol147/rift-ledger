// Packs the playable download: downloads/rift-ledger-play.zip with play.html, the music it loads and Thai
// instructions. Stored (no compression: the HTML is mostly base64 pictures, the music is already MP3) with a fixed
// date, so the same build always gives the same ZIP. Run by `npm run build`; test/download-zip.test.mjs checks it.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const HOWTO = `วิธีเปิดเกม Rift Ledger (บันทึกหลังรอยแยก)
1. แตกไฟล์ ZIP นี้ก่อน (อย่าเปิดจากในไฟล์ ZIP ตรงๆ)
2. เปิด play.html ด้วย Chrome, Edge, Firefox หรือ Safari
3. กดปุ่มเพลงมุมขวาบนเพื่อเปิดหรือปิดเสียง เพลงอยู่ในโฟลเดอร์ audio ข้างกัน ห้ามแยกออกจากกัน
ภาพทั้งหมดฝังอยู่ใน play.html แล้ว
`;

const FILES = [
  ["rift-ledger/play.html", readFileSync("play.html")],
  ["rift-ledger/audio/shadows-resolve.mp3", readFileSync("audio/shadows-resolve.mp3")],
  ["rift-ledger/วิธีเปิดเกม.txt", Buffer.from(HOWTO, "utf8")],
];
const DOS_TIME = 0, DOS_DATE = ((2026 - 1980) << 9) | (11 << 5) | 13; // 2026-11-13 00:00
const UTF8 = 0x0800;
// CRC-32 (zlib.crc32 needs Node 22; the README promises 20)
const TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const locals = [], centrals = [];
let offset = 0;
for (const [name, data] of FILES) {
  const n = Buffer.from(name, "utf8"), crc = crc32(data) >>> 0;
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(UTF8, 6); head.writeUInt16LE(0, 8);
  head.writeUInt16LE(DOS_TIME, 10); head.writeUInt16LE(DOS_DATE, 12); head.writeUInt32LE(crc, 14);
  head.writeUInt32LE(data.length, 18); head.writeUInt32LE(data.length, 22); head.writeUInt16LE(n.length, 26);
  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(UTF8, 8);
  cen.writeUInt16LE(DOS_TIME, 12); cen.writeUInt16LE(DOS_DATE, 14); cen.writeUInt32LE(crc, 16);
  cen.writeUInt32LE(data.length, 20); cen.writeUInt32LE(data.length, 24); cen.writeUInt16LE(n.length, 28);
  cen.writeUInt32LE(offset, 42);
  locals.push(head, n, data); centrals.push(cen, n);
  offset += head.length + n.length + data.length;
}
const dir = Buffer.concat(centrals), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(FILES.length, 8); end.writeUInt16LE(FILES.length, 10);
end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
mkdirSync("downloads", { recursive: true });
writeFileSync("downloads/rift-ledger-play.zip", Buffer.concat([...locals, dir, end]));
console.log(`downloads/rift-ledger-play.zip: ${(offset / 1024).toFixed(0)} KB, ${FILES.length} files`);
