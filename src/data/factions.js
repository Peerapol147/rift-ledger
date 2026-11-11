// Factions (spec §6.7). Standing −100..100, shown only as a word. FAC_FROM: counters/flags that already exist in
// the content and what they mean to each faction, so old content moves standing without rewriting it.
export const FACTIONS = { assoc: "สมาคมฮันเตอร์", state: "รัฐ", church: "ศาสนจักร", research: "นักวิจัย",
  under: "องค์กรใต้ดิน" };

export const FAC_WORDS = [[60, "ไว้วางใจ"], [25, "เป็นมิตร"], [-24, "เฉยๆ"], [-59, "ระแวง"], [-100, "เป็นศัตรู"]];

export const FAC_FROM = {
  // career and story choices that used to be recorded but never read
  snitch: { assoc: 4, under: -10 }, offLeak: { under: 6, assoc: -4 }, docLegend: { church: 3, research: 3 },
  hdocBent: { under: 5, assoc: -3 }, pressAccess: { state: 3 }, copCalm: { state: 3 }, copBrave: { state: 5 },
  agRisk: { under: 3 }, agHonest: { assoc: 4 }, aprHero: { assoc: 3 }, fairMarket: { assoc: 2, under: -3 },
  resFirst: { research: 5 }, resBrave: { research: 3 }, resLoyal: { research: 4 }, rescueStandard: { state: 4,
    assoc: 2 },
  rescueFund: { state: 3 }, rescueInspire: { church: 2 }, monsterChef: { research: 2 }, theWall: { state: 5, assoc: 3 },
  vgMentor: { assoc: 3 }, stRecordRun: { assoc: 3 }, spTriage: { church: 3 }, spGuild: { assoc: 3 },
    spLaw: { state: 4 },
  supportSchool: { state: 3 }, underClinic: { under: 6, state: -3 }, scMerc: { under: 4 }, gateAtlas: { research: 6 },
  gateBroker: { under: 5, assoc: -2 }, arCraft: { research: 3 }, drownedKind: { church: 4 },
    silentNotebook: { research: 4 },
  silentWarning: { state: 2 }, allyBlack: { under: 5 }, shopKit: { assoc: 2 }, porterBrave: { assoc: 2 },
  schoolHunter: { assoc: 2 }, teachDream: { state: 2 },
  blackMarket: { under: 25, assoc: -15 }, shopGrey: { under: 5 }, aprBent: { under: 5, assoc: -3 },
    agDark: { under: 10 },
  porterSkim: { under: 3 }, vgIllegal: { under: 8, assoc: -5 }, stIllegal: { under: 8, assoc: -5 },
    scSold: { under: 6 },
  arDark: { under: 10, assoc: -5 }, spUnder: { under: 8 }, arInformer: { assoc: 8, under: -15 }, vgClean: { assoc: 6 },
  stClean: { assoc: 6 }, scHonest: { assoc: 5 }, shopLegal: { assoc: 3 }, shopCert: { assoc: 5 }, heroic: { assoc: 2,
    state: 2 },
  protest: { state: -5, assoc: -3 }, pressExpose: { assoc: -20, state: 5 }, awakenedCrimes: { state: 10, assoc: -8 },
  clawCase: { state: 8, assoc: -10 }, insureReform: { state: 6 }, survivalCurriculum: { state: 8 },
    docResearch: { research: 10 },
  aprMethod: { research: 6 }, drownedPrayer: { church: 6 }, silentAnswer: { research: 4 }, docBrave: { research: 4,
    church: 2 },
  lowRankFund: { church: 6, assoc: 4 }, freeClinic: { church: 8 }, earlyAwakeCenter: { church: 4, research: 4 },
};

// Long-term arcs (once each per life): a faction that trusts you (≥ HI) makes an offer; one that turns on you (≤ lo)
// makes trouble. Perks are flags read by core/factions.js. Every event keeps an option with no need.
export const FAC_HI = 40;
export const FAC_ARCS = {
  assoc: {
    lo: -60,
    hi: { t: "สมาคมฮันเตอร์เชิญคุณเข้าร่วมคณะกรรมการประเมินแรงก์ มีเบี้ยประชุมทุกเดือน", hunter: true, minRank: 3,
      o: [{ l: "รับตำแหน่ง", y: { m: "ชื่อคุณอยู่ในรายชื่อกรรมการ", fame: 4, flags: { patronAssoc: true } } },
        { l: "ขอทำงานภาคสนามต่อ", y: { m: "พวกเขาเคารพการตัดสินใจของคุณ" } }] },
    bad: { t: "สมาคมขึ้นชื่อคุณในบัญชีดำ ทีมและกิลด์ส่วนใหญ่จะไม่รับคุณอีก", hunter: true,
      o: [{ l: "ไม่สนใจ ล่าคนเดียวก็ได้", y: { m: "คุณเหลือแต่ตัวเองกับคนที่ไม่กลัวบัญชีดำ",
        flags: { blacklisted: true } } },
        { l: "ยื่นอุทธรณ์พร้อมเงินบริจาค", need: { gold: 20000 }, y: { m: "ชื่อคุณถูกลบออกเงียบๆ", gold: -20000,
          goldLabel: "เงินบริจาคสมาคม", fac: { assoc: 30 } } }] },
  },
  state: {
    lo: -40,
    hi: { t: "เจ้าหน้าที่รัฐมาพบที่บ้าน เสนอเงินเดือนประจำให้คุณเป็นที่ปรึกษาด้านความปลอดภัยจากเกต",
      o: [{ l: "รับข้อเสนอ", y: { m: "คุณได้บัตรเจ้าหน้าที่และเงินเดือนทุกเดือน แต่ต้องอยู่ในกรอบของรัฐ",
        flags: { patronState: true }, fac: { under: -15 } } },
        { l: "ปฏิเสธอย่างสุภาพ", y: { m: "เขาวางนามบัตรไว้บนโต๊ะ" } }] },
    bad: { t: "กรมสรรพากรส่งหมายเรียกตรวจสอบบัญชีย้อนหลังห้าปีของคุณ",
      o: [{ l: "จ่ายค่าปรับให้จบ", y: { m: "เงินก้อนหนึ่งหายไปกับเรื่องนี้", act: "facTaxFine" } },
        { l: "จ้างทนายสู้", s: "int", diff: 16, y: { m: "ศาลยกฟ้อง แต่รัฐยังจำชื่อคุณได้", gold: -3000,
          goldLabel: "ค่าทนาย" }, n: { m: "แพ้คดี ต้องจ่ายทั้งค่าปรับและค่าทนาย", act: "facTaxFine", gold: -3000,
          goldLabel: "ค่าทนาย" } }] },
  },
  church: {
    lo: -40,
    hi: { t: "ศาสนจักรมอบเครื่องรางที่ผ่านพิธีให้คุณ และเชิญมาสวดภาวนาด้วยกันทุกเดือน",
      o: [{ l: "รับไว้ด้วยความขอบคุณ", y: { m: "ทุกเดือนหลังพิธี ใจคุณเบาลงอย่างประหลาด", mind: 5,
        flags: { patronChurch: true } } },
        { l: "รับเครื่องรางแต่ไม่ไปพิธี", y: { m: "เครื่องรางนั้นอุ่นอยู่ในกระเป๋า", mind: 3 } }] },
    bad: { t: "บาทหลวงประกาศกลางพิธีว่าคนอย่างคุณคือเหตุที่ฟ้าแตก ข่าวลือไปทั่วเมือง",
      o: [{ l: "เงียบไว้", y: { m: "ผ่านไปหลายเดือนกว่าคนจะเลิกมอง", mind: -8, fame: -3 } },
        { l: "ไปขอพบบาทหลวง", s: "cha", diff: 16, y: { m: "เขายอมถอนคำพูดต่อหน้าทุกคน", fac: { church: 20 } },
          n: { m: "เขาไม่ยอมพบคุณ", mind: -5 } }] },
  },
  research: {
    lo: -40,
    hi: { t: "สถาบันวิจัยมานาเสนอทุนให้คุณ แลกกับการเปิดเผยข้อมูลร่างกายทั้งหมด",
      o: [{ l: "รับทุน", y: { m: "รายงานผลการตรวจละเอียดจนคุณเข้าใจร่างกายตัวเองมากขึ้น", act: "facResearchGrant" } },
        { l: "ขอเก็บข้อมูลไว้เอง", y: { m: "พวกเขาเสียดายแต่เข้าใจ" } }] },
    bad: { t: "บทความวิชาการฉบับใหม่ยกตัวคุณเป็นกรณีศึกษาของ 'คนที่ใช้พลังอย่างไร้ความรับผิดชอบ'",
      o: [{ l: "ปล่อยไป", y: { m: "คนจำนวนหนึ่งเริ่มมองคุณแปลกๆ", fame: -3 } },
        { l: "เขียนตอบโต้", s: "int", diff: 15, y: { m: "บทความของคุณถูกอ้างถึงมากกว่าต้นฉบับ", fame: 2 },
          n: { m: "บทความของคุณไม่มีใครอ่าน", mind: -3 } }] },
  },
  under: {
    lo: -40,
    hi: { t: "คนจากองค์กรใต้ดินบอกว่าตลาดมืดเปิดประตูหลังให้คุณแล้ว ปีละครั้งจะมีของดีราคาพิเศษ",
      o: [{ l: "ขอบคุณ", y: { m: "คุณได้เบอร์ติดต่อที่เปลี่ยนทุกเดือน", flags: { patronUnder: true } } },
        { l: "ไม่ยุ่งด้วย", y: { m: "เขายักไหล่", fac: { under: -5 } } }] },
    bad: { t: "รถตู้สีดำจอดรอหน้าบ้านคุณสามคืนติด คืนที่สี่มีคนเคาะประตู",
      o: [{ l: "จ่ายเงินให้จบ", need: { gold: 5000 }, y: { m: "พวกเขารับเงินแล้วหายไป", gold: -5000,
        goldLabel: "ค่าคุ้มครอง", fac: { under: 20 } } },
        { l: "สู้", s: "str", diff: 17, risk: 0.04, nerve: true, y: { m: "พวกเขาไม่กลับมาอีก", fame: 2 },
          n: { m: "คุณรอดมาได้ แต่ต้องนอนโรงพยาบาลหลายสัปดาห์", hp: -40 } },
        { l: "แจ้งตำรวจ", y: { m: "ตำรวจมาตรวจหนึ่งครั้งแล้วเงียบไป", fac: { state: 3 }, mind: -5 } }] },
  },
};
