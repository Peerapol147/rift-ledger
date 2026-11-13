// The neighbour child every life grows up beside: met at four to seven, there (or not) until old age. Each scene
// recalls something that really happened between you. Spec: 2026-11-13-lives-that-remember-design.md §5.8.
import { NAMES } from "../families.js";

const fid = (s, st) => st.cast.friend;
const rel = (s, st) => s.relations?.[fid(s, st)] ?? { trust: 0, memories: [] };
const trust = (s, st) => rel(s, st).trust;
const first = (s, st) => rel(s, st).memories[0]?.text ?? "วันแรกที่เจอกัน";
const latest = (s, st) => rel(s, st).memories.at(-1)?.text ?? first(s, st);
const theyHunt = (s, st) => !!s.world.people?.[fid(s, st)]?.hunter;
const iHunt = (s) => !!s.hunter;
const age = (s) => Math.floor(s.ageM / 12);
const go = (node, m, extra = {}) => ({ m, go: node, ...extra });
const end = (ending, m, extra = {}) => ({ m, end: ending, ...extra });
const F = ["friend"];
const mem = (text, trust = 0, extra = {}) => ({ friend: { trust, mem: text, ...extra } });

export const FRIEND = {
  id: "friend", title: "เด็กบ้านข้างๆ", tag: "ความสัมพันธ์", entry: "meet", castGone: "funeral",
  discover: (s) => s.ageM < 48, // a childhood story: an old save of an adult life does not start it
  cast: {
    friend: (s, st, roll) => {
      const sex = roll(0, 1) ? "f" : "m", list = NAMES[s.country][sex];
      return { key: "story:friend:" + s.lifeId, input: {
        name: list[roll(0, list.length - 1)], country: s.country, city: s.city, sex,
        bornWorldM: (s.mon0 ?? 0) + roll(-12, 12),
        // whether they awaken is settled at birth and never shown before it happens
        hunter: roll(1, 100) <= 25 ? { rank: roll(0, 3), cls: null } : null, tags: ["friend"],
        // most people are married by their mid-thirties; settled now so it never changes on reload
        marriedBy35: roll(1, 100) <= 55 } };
    },
  },
  nodes: {
    meet: {
      delay: [48, 84], needCast: F,
      t: "ลูกบอลของเด็กบ้านข้างๆ ข้ามรั้วมาตกในสวนบ้านคุณ เด็กคนนั้นชื่อ {cast:friend} ปีนรั้วตามมาโดยไม่ขออนุญาตใคร",
      o: [
        { l: "ชวนเล่นด้วยกัน", y: go("school", "คุณสองคนเตะบอลจนมืด แม่ต้องออกมาเรียกเข้าบ้าน",
          { rel: mem("เขาปีนรั้วมาเอาลูกบอลคืน แล้วอยู่เล่นกับคุณจนมืด", 20) }) },
        { l: "ส่งลูกบอลคืนแล้วกลับเข้าบ้าน", y: go("school", "เขาพยักหน้าขอบคุณ แล้วปีนรั้วกลับไป",
          { rel: mem("เขาปีนรั้วมาเอาลูกบอลคืน แล้วคุณยื่นให้แล้วกลับเข้าบ้าน", 5) }) },
        { l: "แย่งลูกบอลไว้ก่อน", s: "agi", diff: 8,
          y: go("school", "คุณวิ่งหนีรอบบ้านสามรอบก่อนยอมคืน", { rel: mem(
            "เขาปีนรั้วมาเอาลูกบอลคืน แต่คุณแย่งไว้แล้ววิ่งหนีรอบบ้าน", 0) }),
          n: go("school", "เขาวิ่งเร็วกว่า คุณหกล้มเข่าถลอก", { hp: -2, rel: mem(
            "เขาปีนรั้วมาเอาลูกบอลคืน แล้วคุณแย่งไม่ทันจนหกล้มต่อหน้าเขา", -5) }) },
      ],
    },
    school: {
      delay: [30, 54], needCast: F,
      t: (s, st) => `คุณกับ {cast:friend} รู้จักกันตั้งแต่วันที่${first(s, st)} `
        + "วันนี้ครูกล่าวหาว่าเขาทำกระจกห้องเรียนแตก ทั้งที่คุณเห็นว่าเป็นเด็กห้องอื่น",
      o: [
        { l: "บอกครูตามจริง", s: "cha", diff: 10,
          y: go("teenFork", "ครูเชื่อคุณ เด็กห้องอื่นต้องไปขอโทษ", { rel: mem("คุณยืนยันกับครูว่าเขาไม่ได้ทำกระจกแตก",
            20) }),
          n: go("teenFork", "ครูไม่เชื่อทั้งคุณและเขา คุณสองคนต้องอยู่ทำความสะอาดห้องด้วยกัน", { mind: -2,
            rel: mem("คุณสองคนโดนทำโทษด้วยกันเพราะคุณออกหน้าแทนเขา", 15) }) },
        { l: "เงียบไว้", y: go("teenFork", "เขาโดนทำโทษคนเดียว และมองคุณตอนเดินออกจากห้อง", {
          rel: mem("คุณเงียบตอนเขาโดนกล่าวหาเรื่องกระจกแตก", -15) }) },
        { l: "ชวนกันไปขอโทษภารโรงด้วยกัน", y: go("teenFork", "ภารโรงยิ้มแล้วให้คุณสองคนช่วยกวาดเศษแก้ว",
          { st: { wil: 0.2 }, rel: mem("คุณสองคนไปช่วยภารโรงกวาดเศษกระจกด้วยกัน", 10) }) },
      ],
    },
    teenFork: {
      delay: [30, 54], needCast: F, when: (s) => age(s) >= 13,
      t: (s, st) => `ชมรมเตรียมรับเกตแตกเหลือที่ว่างที่เดียว คุณกับ {cast:friend} ยืนอยู่หน้าบอร์ดรับสมัครพร้อมกัน `
        + `คุณยังนึกถึงตอนที่${latest(s, st)}`,
      o: [
        { l: "ยกที่ให้เขา", y: go("awaken", "เขาได้ที่นั้น และพาคุณไปนั่งดูการฝึกทุกเย็น", { route: "close",
          rel: mem("คุณยกที่ในชมรมให้เขา", 20) }) },
        { l: "สมัครแข่งกันตรงๆ", s: "int", diff: 12,
          y: go("awaken", "คุณได้ที่นั้น เขาพูดว่ายินดีด้วยแต่ไม่มองหน้า", { route: "rival",
            rel: mem("คุณชนะเขาในการคัดเข้าชมรม", -5) }),
          n: go("awaken", "เขาได้ที่นั้น และยิ้มแบบที่คุณจำไปอีกนาน", { route: "rival",
            rel: mem("เขาชนะคุณในการคัดเข้าชมรม", -5) }) },
        { l: "แยกไปชมรมอื่น", y: go("awaken", "คุณไปชมรมดนตรี เขาไปชมรมนั้น เดินกลับบ้านคนละเวลา", { route: "drift",
          rel: mem("ตอนมัธยมคุณสองคนแยกไปคนละชมรม", -5) }) },
      ],
    },
    awaken: {
      // after the player's own screening at eighteen, never before it
      delay: [12, 36], needCast: F, when: (s) => age(s) >= 18 && (s.c["ev:ms18"] ?? 0) > 0,
      t: (s, st) => (iHunt(s) && theyHunt(s, st)
        ? "ผลตรวจพลังของคุณกับ {cast:friend} ออกวันเดียวกัน ตื่นพลังทั้งคู่ เขาโทรมาก่อนคุณจะทันได้โทรหา"
        : theyHunt(s, st)
          ? "{cast:friend} ตื่นพลังแล้ว ส่วนคุณยังเป็นคนธรรมดา ข่าวนี้มาจากแม่ของเขาที่เล่าให้แม่คุณฟังที่ตลาด"
          : iHunt(s)
            ? "คุณตื่นพลังแล้ว ส่วน {cast:friend} ยังเป็นคนธรรมดา เขาส่งข้อความมาสั้นๆ ว่า 'เก่งนี่'"
            : "ผลตรวจพลังของคุณกับ {cast:friend} ว่างเปล่าเหมือนกัน คุณเจอกันที่หน้าศูนย์ตรวจโดยไม่ได้นัด"),
      o: [
        { l: "ลงเกตแรกด้วยกัน", show: (s, st) => iHunt(s) && theyHunt(s, st), y: go("ask",
          "เกตแรงก์ F นั้นง่ายกว่าที่คิด แต่คุณสองคนก็หัวเราะกันทั้งทางกลับ", { rel: mem("คุณลงเกตแรกด้วยกัน", 15) }) },
        { l: "แยกไปสังกัดคนละที่", show: (s, st) => iHunt(s) && theyHunt(s, st), y: go("ask",
          "คุณได้ยินชื่อเขาจากกระดานสมาคมบ้างเป็นครั้งคราว", { route: "drift", rel: mem("คุณสองคนแยกไปคนละสังกัด") }) },
        { l: "ไปส่งเขาที่สมาคมวันแรก", show: (s, st) => !iHunt(s) && theyHunt(s, st), y: go("ask",
          "เขาโบกมือจากประตูกระจก คุณยืนอยู่จนเขาเดินลับไป", { rel: mem("คุณไปส่งเขาที่สมาคมวันแรก", 15) }) },
        { l: "ไม่ไปส่ง", show: (s, st) => !iHunt(s) && theyHunt(s, st), y: go("ask",
          "คุณบอกตัวเองว่ายุ่ง ทั้งที่วันนั้นไม่ได้ทำอะไรเลย", { mind: -2, route: "drift",
            rel: mem("คุณไม่ได้ไปส่งเขาวันที่เขาตื่นพลัง", -10) }) },
        { l: "ชวนเขามาดูคุณซ้อม", show: (s, st) => iHunt(s) && !theyHunt(s, st), y: go("ask",
          "เขานั่งดูอยู่ข้างสนามทั้งบ่าย แล้วบอกว่าท่าที่สามดูไม่ค่อยดี", { rel: mem("เขามานั่งดูคุณซ้อมหลังตื่นพลัง",
            10) }) },
        { l: "ไม่พูดถึงเรื่องนี้เลย", show: (s, st) => iHunt(s) && !theyHunt(s, st), y: go("ask",
          "คุณสองคนคุยเรื่องอื่นได้ทุกเรื่อง ยกเว้นเรื่องนี้", { rel: mem("คุณไม่เคยพูดเรื่องพลังกับเขา", 0) }) },
        { l: "ไปกินหมูกระทะปลอบใจกัน", show: (s, st) => !iHunt(s) && !theyHunt(s, st), y: go("ask",
          "ร้านหมูกระทะหน้าศูนย์ตรวจเต็มไปด้วยคนที่ผลว่างเปล่าเหมือนกัน", { mind: 4,
            rel: mem("คุณสองคนกินหมูกระทะหน้าศูนย์ตรวจวันที่ผลว่างเปล่า", 15) }) },
        { l: "แยกกันกลับบ้านเงียบๆ", show: (s, st) => !iHunt(s) && !theyHunt(s, st), y: go("ask",
          "คุณนั่งรถเมล์คนละสาย ไม่มีใครส่งข้อความหาใครคืนนั้น", { route: "drift",
            rel: mem("วันที่ผลตรวจว่างเปล่า คุณสองคนแยกกันกลับบ้าน", -5) }) },
      ],
    },
    ask: {
      delay: [36, 96], needCast: F,
      // someone you drifted from does not call you at one in the morning
      skip: { to: "silence", when: (s, st) => st.route === "drift" || trust(s, st) < 0 },
      t: (s, st) => `{cast:friend} โทรมาตอนตีหนึ่ง เขาจะเซ็นสัญญาเช่าร้านแรกพรุ่งนี้ ขาดเงินค้ำประกันอีกนิด `
        + `และอยากให้คุณไปเป็นพยาน คุณนึกถึงตอนที่${latest(s, st)}`,
      o: [
        { l: "ให้ยืมเงิน", need: { gold: 3000 }, noAuto: true, y: go("godparent",
          "ร้านของเขาเปิดในเดือนนั้น ป้ายร้านเขียนผิดหนึ่งตัว",
          { gold: -3000, goldLabel: "ให้เพื่อนยืมค้ำประกัน", rel: mem("คุณให้เขายืมเงินค้ำประกันร้านแรก", 25,
            { owe: 20 }) }) },
        { l: "ไปเป็นพยานแต่ไม่ให้ยืม", y: go("godparent", "คุณเซ็นชื่อเป็นพยาน เขาหาเงินที่เหลือได้จากญาติ",
          { rel: mem("คุณไปเป็นพยานตอนเขาเซ็นสัญญาเช่าร้านแรก", 5) }) },
        { l: "ไม่รับสาย", y: go("silence", "โทรศัพท์สั่นอยู่บนหมอนสามรอบแล้วเงียบไป", { route: "drift",
          rel: mem("คุณไม่รับสายคืนที่เขาโทรมาขอความช่วยเหลือ", -20) }) },
      ],
    },
    godparent: {
      delay: [12, 48], needCast: F,
      skip: { to: "silence", when: (s, st) => st.route === "drift" || st.route === "rival" || trust(s, st) < 40 },
      t: (s, st) => `ลูกคนแรกของ {cast:friend} เกิดแล้ว เขาขอให้คุณเป็น${s.sex === "f" ? "แม่" : "พ่อ"}ทูนหัวของเด็ก `
        + `คุณนึกถึงตอนที่${latest(s, st)}`,
      o: [
        { l: (s) => `รับเป็น${s.sex === "f" ? "แม่" : "พ่อ"}ทูนหัว`, y: go("silence",
          "เด็กคนนั้นเรียกคุณด้วยชื่อเล่นที่ผิดไปหนึ่งตัวจนโต", { mind: 6,
          rel: mem("คุณรับเป็นผู้ปกครองทูนหัวของลูกคนแรกของเขา", 15) }) },
        { l: "ขอเป็นแค่ญาติห่างๆ ที่มาเยี่ยมบ่อยๆ", y: go("silence",
          "คุณมาเยี่ยมทุกวันเกิดเด็ก พร้อมของขวัญที่ใหญ่เกินตัวเด็ก",
          { rel: mem("คุณไปเยี่ยมลูกของเขาทุกวันเกิด", 8) }) },
      ],
    },
    silence: {
      delay: [24, 72],
      beat: { m: "หลายปีที่คุณกับ {cast:friend} แทบไม่ได้คุยกัน เหลือแค่กดไลก์รูปกันปีละครั้ง", go: "reunion" },
    },
    reunion: {
      delay: [24, 96], needCast: F, when: (s) => age(s) >= 35,
      t: (s, st) => `คุณเจอ {cast:friend} ที่งานศพครูประถม ผมเขาเริ่มขาวที่ขมับ คุณสองคนหัวเราะเรื่องวันที่${
        first(s, st)}`,
      o: [
        { l: "นัดกินข้าวกันทุกเดือน", y: go("old", "นัดแรกยาวจนร้านปิด นัดที่สองเขามาสาย", { route: "close",
          rel: mem("คุณสองคนกลับมานัดกินข้าวกันทุกเดือน", 15) }) },
        { l: "ขอคบกันจริงจัง", show: (s, st) => trust(s, st) >= 60 && !(s.c.married > 0)
          && !s.world.people?.[fid(s, st)]?.marriedBy35, noAuto: true,
          y: go("old", "อีกหนึ่งปีต่อมาคุณสองคนจดทะเบียนกันเงียบๆ ที่เขต", { route: "partner", mind: 15,
            c: { married: 1, dating: 1 }, rel: mem("คุณสองคนจดทะเบียนกันหลังเจอกันที่งานศพครู", 20,
              { tag: "partner" }) }) },
        { l: "ท้าแข่งอะไรสักอย่างแบบตอนเด็ก", show: (s, st) => st.route === "rival", s: "luk", diff: 10,
          y: go("old", "คุณชนะเกมปาลูกดอกหลังงาน เขาขอแข่งใหม่ปีหน้า", { rel: mem("คุณชนะเขาเกมปาลูกดอกหลังงานศพครู",
            5) }),
          n: go("old", "เขาชนะ แล้วหัวเราะเสียงดังกว่าที่ควรในงานศพ", { rel: mem("เขาชนะคุณเกมปาลูกดอกหลังงานศพครู",
            5) }) },
        { l: "ทักทายแล้วแยกกัน", y: go("old", "คุณสองคนแลกเบอร์ใหม่ ทั้งที่รู้ว่าคงไม่ได้โทร", { route: "drift" }) },
      ],
    },
    old: {
      delay: [60, 240], needCast: F, when: (s) => age(s) >= 60,
      t: (s, st) => `อายุหกสิบกว่าแล้ว คุณยังนึกถึง {cast:friend} เวลาเห็นลูกบอลข้ามรั้วบ้านใคร `
        + `เรื่องล่าสุดระหว่างคุณสองคนคือ${latest(s, st).replace(/^คุณ/, "คุณ")}`,
      o: [
        { l: "นั่งม้าหินหน้าบ้านด้วยกันทุกเย็น", show: (s, st) => st.route === "partner",
          y: end("together", "คุณสองคนนั่งดูเด็กข้างบ้านเตะบอลข้ามรั้ว ไม่มีใครลุกไปคืนให้", { mind: 10 }) },
        { l: "ไปเยี่ยมเขาที่บ้าน", show: (s, st) => st.route !== "partner" && trust(s, st) >= 40,
          y: end("lifelong", "เขาเปิดประตูก่อนคุณจะกดกริ่ง เหมือนรู้อยู่แล้วว่าวันนี้คุณจะมา", { mind: 8 }) },
        { l: "ท้าแข่งอีกครั้ง", show: (s, st) => st.route === "rival" && trust(s, st) < 40,
          y: end("rivals-to-end", "คุณสองคนแข่งกันเดินรอบสวนสาธารณะ ไม่มีใครยอมเดินช้าลง", { mind: 5 }) },
        { l: "โทรหาเขาอีกครั้ง", show: (s, st) => st.route !== "partner" && trust(s, st) < 40, s: "cha", diff: 12,
          y: end("lifelong", "เขารับสายตั้งแต่เสียงแรก คุยกันจนแบตหมด", { mind: 6 }),
          n: end("apart", "เบอร์นั้นไม่มีคนใช้แล้ว คุณนั่งมองหน้าจออยู่นาน", { mind: -3 }) },
        { l: "ปล่อยให้เป็นความทรงจำ", show: (s, st) => st.route !== "partner",
          y: end("apart", "บางคนอยู่ในชีวิตแค่ช่วงหนึ่ง และนั่นก็พอแล้ว") },
      ],
    },
    funeral: {
      delay: [0, 1],
      t: (s, st) => `ข่าวมาถึงทางโทรศัพท์ {cast:friend} ไม่อยู่แล้ว ระหว่างนั่งในงานศพ คุณนึกถึงวันที่${first(s, st)}`,
      o: [
        { l: "วางดอกไม้แล้วนั่งอยู่จนงานเลิก", show: (s, st) => trust(s, st) >= 40,
          y: end("lifelong", "ญาติของเขาบอกว่าเขาพูดถึงคุณบ่อย", { mind: -8 }) },
        { l: "วางดอกไม้แล้วกลับ", show: (s, st) => trust(s, st) < 40,
          y: end("apart", "คุณกลับบ้านก่อนพระสวดจบ", { mind: -4 }) },
      ],
    },
  },
  endings: {
    lifelong: { title: "เพื่อนทั้งชีวิต" }, apart: { title: "คนที่เคยรู้จัก" },
      "rivals-to-end": { title: "คู่แข่งจนวันสุดท้าย" },
    together: { title: "อยู่ด้วยกัน" },
  },
};
