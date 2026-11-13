import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const ZIP = new URL("../downloads/rift-ledger-play.zip", import.meta.url);

// The files of a stored (uncompressed) ZIP, read from its local headers: { name: Buffer }.
function storedFiles(buf) {
  const out = {};
  for (let i = 0; buf.readUInt32LE(i) === 0x04034b50;) {
    const method = buf.readUInt16LE(i + 8), size = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26), extraLen = buf.readUInt16LE(i + 28);
    const name = buf.toString("utf8", i + 30, i + 30 + nameLen), start = i + 30 + nameLen + extraLen;
    assert.equal(method, 0, `${name} is stored, not compressed`);
    out[name] = buf.subarray(start, start + size);
    i = start + size;
  }
  return out;
}

test("the download ZIP holds today's play.html, its music and the Thai instructions", () => {
  assert.ok(existsSync(ZIP), "downloads/rift-ledger-play.zip exists (npm run build makes it)");
  const files = storedFiles(readFileSync(ZIP));
  assert.ok(files["rift-ledger/play.html"].equals(readFileSync(new URL("../play.html", import.meta.url))),
    "the ZIP's play.html is the current build");
  assert.ok(files["rift-ledger/วิธีเปิดเกม.txt"], "instructions are inside");
  assert.ok(files["rift-ledger/audio/shadows-resolve.mp3"], "the music play.html loads is inside");
});
