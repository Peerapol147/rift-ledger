// The office career as a branching story: one file, one hunter who comes back, six ways it can end. Graph from the
// owner's handoff pack §03.2, text our own. Spec: 2026-11-13-lives-that-remember-design.md §5.4 and §5.7.
import { NAMES } from "../families.js";
import { RANKS } from "../world.js";

const rankOf = (s, st) => RANKS[s.world.people?.[st.cast.claimant]?.hunter?.rank ?? 2];
const trust = (s, st) => s.relations?.[st.cast.claimant]?.trust ?? 0;
const present = (s, st) => {
  const p = s.world.people?.[st.cast.claimant];
  return !!p && p.diedWorldM == null && p.goneWorldM == null;
};
const go = (node, m, extra = {}) => ({ m, go: node, ...extra });
const end = (ending, m, extra = {}) => ({ m, end: ending, ...extra });
const CLAIMANT = ["claimant"];
const INDEPENDENT = ["independent-offer", "client-return", "client-search"];
const backToWork = { act: "job:office" };

export const OFFICE = {
  id: "office", title: "แฟ้มที่ไม่ได้ปิด", tag: "งาน", entry: "intake", castGone: "claimant-gone",
  // starts for an office worker of 18+ whose old chapter chain never began (old saves finish their own chain)
  discover: (s) => s.job?.id === "office" && s.ageM >= 18 * 12 && !(s.c["ch:office"] > 0)
    && !String(s.ev?.id ?? "").startsWith("office:"),
  active: (s, st) => s.job?.id === "office" || INDEPENDENT.includes(st.node), pauseMax: 36, pauseEnd: "transfer",
  pauseLog: "แฟ้มเคลมของ {cast:claimant} ถูกส่งต่อให้คนอื่นดูแล คุณไม่ได้กลับไปที่โต๊ะนั้นอีก",
  cast: {
    claimant: (s) => {
      const n = Object.keys(s.world.people ?? {}).length;
      const sex = (n + s.ageM) % 2 ? "f" : "m", list = NAMES[s.country][sex];
      return { key: "story:office:claimant:" + s.lifeId, input: {
        name: list[(s.ageM * 7 + n) % list.length], country: s.country, city: s.city, sex,
        bornWorldM: (s.mon0 ?? 0) + s.ageM - (26 + (s.ageM % 9)) * 12,
        hunter: { rank: 1 + (s.ageM % 3), cls: null }, tags: ["claimant"] } };
    },
    investigator: (s) => {
      const list = NAMES[s.country][s.ageM % 2 ? "m" : "f"];
      return { key: "story:office:investigator:" + s.lifeId, input: { name: list[(s.ageM * 3 + 1) % list.length],
        country: s.country, city: s.city, tags: ["assoc"] } };
    },
  },
  nodes: {
    intake: {
      delay: [1, 3],
      t: "บริษัทได้งานทำประกันให้ฮันเตอร์ในเขต แฟ้มแรกที่ตกถึงมือคุณหนาเกินกว่าจะเป็นแค่งานกรอกฟอร์ม "
        + "ตรงช่องวันเกิดผู้เอาประกันมีรอยแก้ด้วยปากกาสีน้ำเงิน",
      o: [
        { l: "อ่านแฟ้มทั้งคืน", s: "int", diff: 16,
          y: go("claim", "รอยแก้นั้นทำให้ผู้บาดเจ็บหลุดสิทธิ์ไปสองวันพอดี คุณถ่ายสำเนาเก็บไว้", { vars: { evidence: 1 },
            st: { int: 0.3 } }),
          n: go("seek-help", "คุณหลับคาแฟ้มตอนตีสาม ตื่นมาพร้อมรอยปากกาบนแก้ม", { mind: -2 }) },
        { l: "ทำตามแบบฟอร์ม", y: go("routine", "แฟ้มผ่านมือคุณไปภายในบ่ายเดียว") },
        { l: "ถามรุ่นพี่ที่เคยทำแฟ้มแบบนี้", s: "cha", diff: 12,
          y: go("claim", "รุ่นพี่ชี้ให้ดูรอยแก้ แล้วบอกว่าอย่าเพิ่งเซ็นอะไร", { vars: { evidence: 1 } }),
          n: go("seek-help", "รุ่นพี่บอกว่ายุ่ง แล้วก็ยุ่งจริงไปทั้งสัปดาห์") },
      ],
    },
    "seek-help": {
      delay: [1, 3],
      t: "หัวหน้าเดินมาหยุดที่โต๊ะ ถามว่าแฟ้มเดียวทำไมใช้เวลาสามวัน",
      o: [
        { l: "ขอคำปรึกษาหัวหน้า", y: go("claim", "หัวหน้าอธิบายให้ฟังครึ่งชั่วโมง แล้วบอกว่าครั้งนี้ติดไว้ก่อน",
          { vars: { oweBoss: 1 }, jobXp: 1 }) },
        { l: "ทำเองให้เสร็จ", y: go("claim", "คุณส่งแฟ้มตอนหกโมงเย็น ไม่มีใครถามต่อ") },
        { l: "เลิกยุ่งกับแฟ้มนี้", y: go("routine", "คุณส่งแฟ้มกลับเข้ากองกลาง") },
      ],
    },
    claim: {
      delay: [6, 14], needCast: CLAIMANT,
      t: (s, st) => `ฮันเตอร์แรงก์ ${rankOf(s, st)} ชื่อ {cast:claimant} มานั่งรอที่เคาน์เตอร์ แขนซ้ายยังพันผ้า `
        + "มีลูกสาวตัวเล็กนั่งข้างๆ เขามาถามว่าทำไมค่ารักษาถึงไม่ผ่าน",
      o: [
        { l: "ใช้สิ่งที่คุณเจอช่วยเขา", show: (s, st) => st.vars.evidence === 1, noAuto: true,
          y: go("paid", "คุณยื่นสำเนารอยแก้ให้ฝ่ายเคลม ค่ารักษาผ่านในสองสัปดาห์", { route: "care",
            rel: { claimant: { trust: 40, mem: "คุณเอาหลักฐานรอยแก้ไปยื่นแทนเขา" } } }) },
        { l: "ขอยื่นอุทธรณ์ให้", show: (s, st) => st.vars.evidence !== 1, noAuto: true,
          y: go("appeal", "คุณกรอกแบบฟอร์มอุทธรณ์ที่ไม่มีใครในแผนกเคยกรอก",
            { rel: { claimant: { trust: 15, mem: "คุณยื่นอุทธรณ์ให้ทั้งที่ไม่มีใครขอ" } } }) },
        { l: "ปฏิเสธตามสัญญา", noAuto: true,
          y: go("denied", "คุณอ่านข้อสัญญาให้เขาฟังทีละข้อ เขาฟังจนจบโดยไม่พูดอะไร", { route: "compliance",
            rel: { claimant: { trust: -15, mem: "คุณอ่านข้อสัญญาให้ฟังแล้วปฏิเสธเคลม" } } }) },
      ],
    },
    appeal: {
      delay: [5, 10], needCast: CLAIMANT,
      t: "เรื่องอุทธรณ์ของ {cast:claimant} ค้างอยู่ในระบบมาหลายเดือน เขากลับไปลงเกตแล้วทั้งที่แขนยังไม่หายดี",
      o: [
        { l: "ช่วยรวบรวมเอกสาร", s: "int", diff: 14,
          y: go("paid-late", "เอกสารครบในที่สุด เงินออกช้าไปสี่เดือน",
            { rel: { claimant: { trust: 25, mem: "คุณนั่งรวบรวมเอกสารอุทธรณ์ให้จนครบ" } } }),
          n: go("denied-honest", "เอกสารใบหนึ่งหายไปจากระบบ คุณหาไม่เจอ") },
        { l: "บอกตามตรงว่าทำไม่ได้", y: go("denied-honest", "คุณโทรไปบอกเขาเอง ไม่ปล่อยให้เป็นจดหมาย",
          { rel: { claimant: { trust: 5, mem: "คุณโทรมาบอกตรงๆ ว่าอุทธรณ์ไม่ผ่าน" } } }) },
        { l: "ให้เงินเขาเงียบเรื่องนี้", need: { gold: 2000 }, noAuto: true,
          y: go("cover-up", "เขารับซองไปโดยไม่มองหน้าคุณ", { gold: -2000, goldLabel: "เงินปิดเรื่องเคลม",
            route: "complicity", vars: { hush: 1 }, rel: { claimant: { trust: -30,
              mem: "คุณยื่นซองเงินให้เขาเลิกตามเรื่อง" } } }) },
      ],
    },
    paid: {
      delay: [1, 2], needCast: CLAIMANT,
      t: "{cast:claimant} กลับมาที่บริษัทพร้อมลูกสาว ถือถุงส้มจากตลาดมาด้วยหนึ่งถุง",
      o: [
        { l: "รับของฝากไว้", y: go("audit", "ส้มถุงนั้นวางอยู่บนโต๊ะทั้งแผนกจนหมดในบ่ายเดียว", { mind: 3,
          rel: { claimant: { trust: 5 } } }) },
        { l: "ปฏิเสธของฝากอย่างสุภาพ", y: go("audit", "เขายืนยันจะให้ลูกสาวเก็บไว้กินเอง แล้วโค้งให้คุณ",
          { rel: { claimant: { trust: 10 } } }) },
      ],
    },
    "paid-late": {
      delay: [1, 2], needCast: CLAIMANT,
      t: "เงินของ {cast:claimant} ออกแล้ว แต่ช้าเกินไป เขาขายชุดเกราะไปเมื่อเดือนก่อนเพื่อจ่ายค่าเทอมลูก",
      o: [
        { l: "ช่วยหาอุปกรณ์มือสอง", s: "cha", diff: 12,
          y: go("audit", "คนรู้จักของคุณขายเกราะให้ครึ่งราคา เขาได้กลับลงเกตในเดือนนั้น",
            { rel: { claimant: { trust: 15, mem: "คุณหาเกราะมือสองราคาครึ่งเดียวให้" } } }),
          n: go("audit", "ทุกร้านบอกว่าเกราะไซซ์นั้นหมด") },
        { l: "ขอโทษแทนบริษัท", y: go("audit", "เขาบอกว่าไม่ใช่ความผิดคุณ แต่ก็ไม่ได้ยิ้ม",
          { rel: { claimant: { trust: 5 } } }) },
      ],
    },
    denied: {
      delay: [1, 3], needCast: CLAIMANT,
      t: "{cast:claimant} กลับมาที่บริษัทอีกครั้ง คราวนี้ไม่ได้พาลูกมา ขอพบคนที่ปฏิเสธเคลม",
      o: [
        { l: "ออกไปอธิบายเหตุผลทีละข้อ", s: "cha", diff: 14,
          y: go("routine-review", "เขาไม่พอใจ แต่ยอมรับว่าคุณไม่ได้โกหกเขา", { rel: { claimant: { trust: 10 } } }),
          n: go("routine-review", "เสียงเขาดังขึ้นจนรปภ.เดินมา", { mind: -4,
            rel: { claimant: { trust: -10, mem: "ทะเลาะกันกลางล็อบบี้บริษัท" } } }) },
        { l: "ไม่ออกไปพบ", y: go("routine-review", "คุณได้ยินว่าเขานั่งรอจนบริษัทปิด", { mind: -3,
          rel: { claimant: { trust: -20, mem: "คุณไม่ยอมออกมาพบเขา" } } }) },
      ],
    },
    "denied-honest": {
      delay: [1, 3], needCast: CLAIMANT,
      t: "{cast:claimant} รู้แล้วว่าเงินจะไม่มา เขาโทรมาหาคุณ เสียงเหนื่อยแต่ไม่โกรธ",
      o: [
        { l: "ให้เบอร์มูลนิธิช่วยฮันเตอร์บาดเจ็บ", y: go("routine-review",
          "สองเดือนต่อมาเขาส่งรูปลูกสาวในชุดนักเรียนใหม่มา",
          { rel: { claimant: { trust: 15, mem: "คุณหาเบอร์มูลนิธิให้ตอนที่เคลมไม่ผ่าน" } } }) },
        { l: "ขอบคุณที่เข้าใจ แล้ววางสาย", y: go("routine-review", "คุณนั่งมองโทรศัพท์อยู่พักหนึ่ง",
          { rel: { claimant: { trust: 5 } } }) },
      ],
    },
    routine: {
      delay: [12, 24],
      t: "เพื่อนร่วมโต๊ะรับแฟ้มที่คุณส่งคืนไปแทน คุณเห็นเขานั่งคุยกับฮันเตอร์ที่แขนพันผ้าอยู่นาน",
      o: [
        { l: "ช่วยงานเพื่อนร่วมโต๊ะ", y: go("routine-review", "คุณสองคนเลิกงานพร้อมกันเกือบทุกวันในเดือนนั้น",
          { jobXp: 2, st: { cha: 0.2 } }) },
        { l: "อยู่ในขอบเขตงานตัวเอง", y: go("routine-review", "งานของคุณเสร็จตรงเวลาทุกชิ้น", { mind: 2 }) },
      ],
    },
    "routine-review": {
      delay: [24, 48],
      t: "ถึงรอบประเมินผลงานประจำปี หัวหน้าส่งแฟ้มตัวเลขของแผนกมาให้คุณสรุป",
      o: [
        { l: "อยู่ต่อ", y: end("steady", "คุณได้ขึ้นเงินเดือนเล็กน้อย และได้โต๊ะริมหน้าต่าง", { jobXp: 3, mind: 5 }) },
        { l: "สมัครงานที่อื่น", noAuto: true, y: end("transfer", "คุณยื่นใบลาออกในวันศุกร์ หัวหน้าไม่แปลกใจ",
          { act: "quitJob" }) },
        { l: "ไล่ดูตัวเลขที่ไม่ตรง", s: "int", diff: 15, noAuto: true,
          y: go("audit", "ค่าความเสียหายจากเกตแตกของกิลด์ลูกค้าเล็กกว่าที่ควรเป็นสามเท่า", { vars: { numbers: 1 } }),
          n: end("steady", "ตัวเลขยาวเกินไป คุณสรุปตามที่เห็นแล้วส่ง", { jobXp: 2 }) },
      ],
    },
    audit: {
      delay: [12, 30],
      t: "กิลด์ลูกค้ารายใหญ่ส่งคนมาขอให้บริษัทลดตัวเลขความเสียหายจากเกตแตกครั้งล่าสุด หัวหน้าส่งงานนี้ให้คุณ",
      o: [
        { l: "ปฏิเสธ", s: "wil", diff: 16, noAuto: true,
          y: go("pushback", "คุณส่งตัวเลขจริงกลับไป คนของกิลด์ปิดแฟ้มดังกว่าปกติ", { c: { offClean: 1 } }),
          n: go("pushback", "คุณปฏิเสธได้ แต่มือสั่นทั้งบ่าย", { mind: -5, c: { offClean: 1 } }) },
        { l: "ยอมแก้ตัวเลข", noAuto: true, y: go("cover-up", "คุณแก้ตัวเลขสามบรรทัด ใช้เวลาไม่ถึงสิบนาที",
          { route: "complicity" }) },
        { l: "เก็บสำเนาแล้วส่งให้ผู้ตรวจสมาคม", noAuto: true,
          y: go("investigation", "คุณส่งสำเนาทางไปรษณีย์ ไม่ใช้อีเมลบริษัท", { vars: { kept: 1 },
            route: "exposure" }) },
      ],
    },
    pushback: {
      delay: [6, 12],
      t: "หลังจากคุณปฏิเสธกิลด์ งานใหญ่ไม่ผ่านโต๊ะคุณอีกเลย หัวหน้าบอกว่าเป็นเรื่องบังเอิญ",
      o: [
        { l: "ขอแรงหนุนจากคนที่เชื่อคุณ", show: (s, st) => present(s, st) && trust(s, st) >= 40, noAuto: true,
          y: go("reform-offer", "จดหมายสนับสนุนสองฉบับถึงโต๊ะผู้บริหาร ฉบับหนึ่งมาจากฮันเตอร์ที่คุณเคยช่วย") },
        { l: "ขอแรงหนุนจากคนในบริษัท", show: (s, st) => !(present(s, st) && trust(s, st) >= 40), s: "cha", diff: 14,
          noAuto: true, y: go("reform-offer", "เพื่อนร่วมแผนกสามคนลงชื่อในจดหมายถึงผู้บริหารกับคุณ"),
          n: end("steady", "ทุกคนพยักหน้าเห็นด้วย แต่ไม่มีใครลงชื่อ คุณทำงานต่อที่เดิม", { mind: -3 }) },
        { l: "ทำงานตามหน้าที่ต่อไป", y: end("steady", "คุณทำงานต่อที่เดิม เรื่องนั้นเงียบไปเอง", { mind: 3 }) },
        { l: "ลาออก", noAuto: true, y: go("independent-offer", "คุณเก็บของในลิ้นชักใส่กล่องเดียวพอดี",
          { act: "quitJob" }) },
      ],
    },
    "cover-up": {
      delay: [1, 3],
      t: (s, st) => (st.vars.hush
        ? "หัวหน้าเรียกคุณไปคุยเรื่องเคลมของ {cast:claimant} ที่เงียบไปเอง แล้ววางซองสีน้ำตาลลงบนโต๊ะ "
          + "'บริษัทประหยัดไปเยอะ นี่ส่วนของคุณ' ข้างในมีเงินสามพัน"
        : "ซองสีน้ำตาลวางอยู่บนโต๊ะคุณตอนเช้า ข้างในมีเงินสามพันกับกระดาษเขียนว่า 'ขอบคุณที่เข้าใจ'"),
      o: [
        { l: "รับเงิน", noAuto: true, y: go("liability", "คุณเก็บซองไว้ในลิ้นชักล่างสุด", { gold: 3000,
          goldLabel: "ซองเงินจากบริษัท", c: { offDirty: 1 }, route: "complicity", vars: { tookCash: 1 } }) },
        { l: "ส่งซองคืน", s: "wil", diff: 15, noAuto: true,
          y: go("investigation", "คุณส่งซองคืนพร้อมสำเนาตัวเลขเดิมไปที่สมาคม", { vars: { kept: 1 } }),
          n: go("liability", "คุณส่งซองคืน แต่ตัวเลขที่แก้ไปแล้วยังอยู่ในระบบ มีชื่อคุณกำกับ", { mind: -6 }) },
      ],
    },
    liability: {
      delay: [12, 24],
      t: (s, st) => (st.vars.hush
        ? "ผู้ตรวจสอบจากสมาคมชื่อ {cast:investigator} เริ่มสอบเคลมฮันเตอร์ที่ถูกปิดเงียบ "
          + "แฟ้มของ {cast:claimant} มีชื่อคุณอยู่"
        : "ผู้ตรวจสอบจากสมาคมชื่อ {cast:investigator} เริ่มขอเอกสารเก่าของกิลด์ลูกค้า ชื่อคุณอยู่ท้ายตัวเลขที่ถูกแก้"),
      o: [
        { l: "ไปให้การเอง", show: (s, st) => !st.vars.tookCash, noAuto: true,
          y: go("investigation", "{cast:investigator} จดทุกคำ แล้วบอกว่าการมาเองนับเป็นเรื่องดี",
            { vars: { kept: 1 } }) },
        { l: "คืนเงินแล้วให้การ", show: (s, st) => st.vars.tookCash === 1, need: { gold: 3000 }, noAuto: true,
          y: go("investigation", "{cast:investigator} จดทุกคำ แล้วบอกว่าการมาเองนับเป็นเรื่องดี", { gold: -3000,
            goldLabel: "คืนเงินซองกิลด์", vars: { kept: 1 } }) },
        { l: "เก็บเงียบ", s: "luk", diff: 14,
          y: end("complicit", "การตรวจหยุดที่ชั้นผู้บริหาร คุณได้เลื่อนตำแหน่งในปีนั้น และไม่เคยนอนหลับสนิทอีก",
            { mind: -8, jobXp: 3, c: { offDirty: 1 } }),
          n: go("fallout", "{cast:investigator} วางสำเนาตัวเลขที่มีลายเซ็นคุณลงบนโต๊ะ") },
      ],
    },
    investigation: {
      delay: [4, 8],
      t: "{cast:investigator} จากสมาคมขอพบคุณที่ร้านกาแฟหน้าสำนักงาน แฟ้มที่คุณส่งไปวางอยู่ตรงกลางโต๊ะ",
      o: [
        { l: "ให้ข้อมูลแบบเปิดหน้า", s: "wil", diff: 16, noAuto: true,
          y: go("reform-offer", "ชื่อคุณอยู่ในรายงานของสมาคม และกิลด์ลูกค้าต้องจ่ายส่วนต่างทั้งหมด", { fame: 3,
            c: { offClean: 1 }, fac: { assoc: 5 } }),
          n: go("fallout", "คุณพูดได้ครึ่งเดียว ที่เหลือเป็นคำถามที่คุณตอบไม่ได้") },
        { l: "ให้ข้อมูลแบบไม่ระบุชื่อ", s: "int", diff: 14,
          y: end("steady", "ข่าวออกในอีกสองสัปดาห์ ไม่มีใครรู้ว่าเริ่มจากโต๊ะคุณ", { c: { offLeak: 1 }, mind: 4 }),
          n: go("fallout", "รายละเอียดในเอกสารชี้กลับมาที่แผนกคุณ") },
        { l: "ถอนตัว", noAuto: true, y: go("fallout", "คุณขอเอกสารคืน {cast:investigator} ส่ายหน้า") },
      ],
    },
    fallout: {
      delay: [1, 3],
      t: "เรื่องตัวเลขความเสียหายหลุดถึงผู้บริหาร ชื่อคุณอยู่ในรายชื่อคนที่ต้องรับผิดชอบ",
      o: [
        { l: "คืนผลประโยชน์ทั้งหมด", show: (s, st) => st.vars.tookCash === 1, need: { gold: 3000 }, noAuto: true,
          y: end("burned", "คุณคืนเงินครบ ถูกลดตำแหน่ง แต่ยังมีงานทำ", { gold: -3000, goldLabel: "คืนเงินซองกิลด์",
            fame: -2, fac: { assoc: -5 } }) },
        { l: "ยอมรับผลทางงาน", y: end("burned", "คุณถูกย้ายไปแผนกเอกสารเก่า ห้องที่ไม่มีหน้าต่าง", { fame: -2,
          fac: { assoc: -5 }, mind: -5 }) },
        { l: "ลาออกไปเริ่มใหม่", noAuto: true, y: end("transfer", "คุณออกจากบริษัทพร้อมจดหมายรับรองที่เขียนไว้กลางๆ",
          { act: "quitJob" }) },
      ],
    },
    "reform-offer": {
      delay: [12, 24],
      t: (s) => (s.job?.tier >= 3
        ? "บอร์ดบริหารเรียกคุณเข้าห้องประชุม ขอให้คุณร่างระบบประกันฮันเตอร์ใหม่ทั้งบริษัท"
        : "หัวหน้าแผนกเสนอให้คุณช่วยทีมทดลองที่จะตรวจแฟ้มเคลมฮันเตอร์ใหม่ทุกแฟ้ม ทีมมีสามคน"),
      o: [
        { l: "รับผิดชอบโครงการทั้งบริษัท", need: { jobTier: 3 }, s: "cha", diff: 16, noAuto: true,
          y: end("reform", "ระบบของคุณถูกใช้ทั้งบริษัท ในปีถัดมาบริษัทอื่นเริ่มลอกแบบ", { fame: 10,
            flags: { insureReform: true }, c: { offClean: 1 } }),
          n: end("steady", "บอร์ดฟังจนจบแล้วพับเก็บ คุณกลับไปโต๊ะเดิม", { mind: -4 }) },
        { l: "รับเป็นผู้ช่วยทีมทดลอง", y: end("reform",
          "ทีมเล็กของคุณตรวจแฟ้มเคลมไปสามร้อยแฟ้มในปีแรก ไม่มีแฟ้มไหนมีรอยแก้",
          { fame: 3, jobXp: 3, c: { offClean: 1 } }) },
        { l: "ขอทำงานเดิมต่อ", y: end("steady", "คุณเลือกโต๊ะเดิมกับเวลาเลิกงานเดิม", { mind: 3 }) },
      ],
    },
    "independent-offer": {
      delay: [1, 3],
      t: "หลังออกจากบริษัท คนรู้จักหลายคนถามว่าคุณจะเปิดที่ปรึกษาประกันเองไหม",
      o: [
        { l: "เปิดบริษัทที่ปรึกษา", show: (s, st) => present(s, st) && trust(s, st) >= 40, need: { gold: 15000 },
          noAuto: true, y: go("client-return", "คุณเริ่มหาห้องเช่าเล็กๆ ใกล้สาขาสมาคม") },
        { l: "เปิดบริษัทที่ปรึกษา", show: (s, st) => !(present(s, st) && trust(s, st) >= 40), need: { gold: 15000 },
          noAuto: true, y: go("client-search", "คุณเริ่มหาห้องเช่าเล็กๆ ใกล้สาขาสมาคม") },
        { l: "หางานบริษัทใหม่", y: end("transfer", "คุณได้งานที่บริษัทอื่นในอีกสองเดือน เริ่มใหม่จากตำแหน่งแรกเข้า",
          backToWork) },
        { l: "กลับไปขอทำงานเดิม", y: end("steady", "หัวหน้ารับคุณกลับ แต่ไม่ได้ให้โต๊ะริมหน้าต่างอีก",
          { mind: -2, ...backToWork }) },
      ],
    },
    "client-return": {
      delay: [1, 2], needCast: CLAIMANT,
      t: "{cast:claimant} รู้ข่าวว่าคุณจะเปิดบริษัท เขาพาฮันเตอร์ในปาร์ตี้มาสามคน ทุกคนอยากได้คนอ่านสัญญาที่ไว้ใจได้",
      o: [
        { l: "เปิดกิจการ", need: { gold: 15000 }, noAuto: true,
          y: end("independent", "ลูกค้ารายแรกของคุณคือ {cast:claimant} กับเพื่อนอีกสามคน", { gold: -15000,
            goldLabel: "ทุนเปิดบริษัท", act: "open:ownFirm", rel: { claimant: { trust: 10,
              mem: "เขาพาลูกค้ากลุ่มแรกมาให้บริษัทของคุณ" } } }) },
        { l: "เลื่อนไปก่อน", y: end("steady", "คุณกลับไปทำงานประจำ และเก็บนามบัตรที่พิมพ์ไว้ในลิ้นชัก", backToWork) },
      ],
    },
    "client-search": {
      delay: [1, 3],
      t: "ห้องเช่าพร้อมแล้ว แต่ยังไม่มีลูกค้าสักราย คุณต้องหาเองทั้งหมด",
      o: [
        { l: "เปิดแล้วหาลูกค้าเอง", need: { gold: 15000 }, noAuto: true,
          y: end("independent", "เดือนแรกมีลูกค้าสองราย เดือนที่หกมีสิบสอง", { gold: -15000, goldLabel: "ทุนเปิดบริษัท",
            act: "open:ownFirm" }) },
        { l: "หาหุ้นส่วนมาช่วยลงทุน", need: { gold: 8000 }, s: "cha", diff: 15, noAuto: true,
          y: end("independent", "หุ้นส่วนของคุณนำลูกค้าเก่ามาด้วยครึ่งหนึ่ง", { gold: -8000, goldLabel: "ทุนเปิดบริษัท",
            act: "open:ownFirm" }),
          n: end("transfer", "หุ้นส่วนถอนตัวก่อนเซ็นสัญญา คุณกลับไปหางานประจำที่บริษัทใหม่", backToWork) },
        { l: "เลื่อนไปก่อน", y: end("steady", "คุณกลับไปทำงานประจำ และเก็บนามบัตรที่พิมพ์ไว้ในลิ้นชัก", backToWork) },
      ],
    },
    "claimant-gone": {
      delay: [0, 1],
      t: (s, st) => (trust(s, st) >= 20
        ? "ครอบครัวของ {cast:claimant} ส่งการ์ดมาที่บริษัท ข้างในเขียนว่าเขาพูดถึงคุณบ่อย และขอบคุณสำหรับทุกอย่าง"
        : "คุณเห็นชื่อ {cast:claimant} ในข่าวสั้นท้ายหน้า เขาไม่อยู่แล้ว แฟ้มของเขายังอยู่ในระบบ"),
      o: [
        { l: "เก็บเรื่องนี้ไว้ แล้วทำงานต่อ", show: (s, st) => st.resume !== "client-return",
          y: go("routine-review", "คุณปิดแฟ้มนั้นด้วยมือตัวเอง", { mind: -3 }) },
        { l: "เก็บเรื่องนี้ไว้ แล้วหาลูกค้าเอง", show: (s, st) => st.resume === "client-return",
          y: go("client-search", "คุณเปิดห้องเช่าเล็กๆ นั้นต่อไปโดยไม่มีเขา", { mind: -3 }) },
      ],
    },
  },
  endings: {
    steady: { title: "งานที่มั่นคง" }, transfer: { title: "ทางอาชีพใหม่" }, reform: { title: "ระบบที่ยุติธรรมขึ้น" },
    independent: { title: "บริษัทของตัวเอง" }, complicit: { title: "ความเงียบที่มีราคา" },
    burned: { title: "บทเรียนราคาแพง" },
  },
};
