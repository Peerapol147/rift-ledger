// The life-chapter word on the top bar (top bar design §2): a label from what the life already shows.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const at = (years, extra = {}) => { const s = C.newLife("chap"); s.ageM = years * 12; Object.assign(s, extra); return s; };
const H = { rank: 2, lv: 10, xp: 0, skills: [], cls: "knight" };

test("children, teens and the old have their stage's chapter", () => {
  assert.equal(C.chapterOf(at(8)), "วัยเด็ก");
  assert.equal(C.chapterOf(at(15)), "วัยเรียน");
  assert.equal(C.chapterOf(at(70)), "บั้นปลาย");
});
test("adults: work, looking for work, hunting with a guild or alone, or stopped", () => {
  assert.equal(C.chapterOf(at(30, { job: { id: "office", tier: 1, xp: 0 } })), "ชีวิตการงาน");
  assert.equal(C.chapterOf(at(30, { job: null })), "ช่วงหางาน");
  assert.equal(C.chapterOf(at(30, { hunter: H, guild: { id: "g", n: "แสงเหนือ", role: "member" } })), "ฮันเตอร์กิลด์แสงเหนือ");
  assert.equal(C.chapterOf(at(30, { hunter: H, guild: null })), "ฮันเตอร์อิสระ");
  const quit = at(30, { hunter: H, guild: null }); quit.flags.stoppedHunting = true;
  assert.equal(C.chapterOf(quit), "เลิกล่าแล้ว");
});
test("an injury still healing comes first (a scar for life does not)", () => {
  const s = at(30, { job: { id: "office", tier: 1, xp: 0 } }); s.injuries = [{ id: "breakScar", untilM: s.ageM + 6 }];
  assert.equal(C.chapterOf(s), "ช่วงพักฟื้น");
});
test("a scar for life is not a recovery", () => {
  const s = at(30, { job: { id: "office", tier: 1, xp: 0 } }); s.injuries = [{ id: "breakScar", untilM: null }];
  assert.equal(C.chapterOf(s), "ชีวิตการงาน");
});
