// เจ๊หงส์: the fixer of the black market, for Thai lives short of money or in the trade. Main cast design §7.
import { who, trust, first, go, end, mem } from "./castref.js";

const H = ["hong"];
export const HONG = {
  id: "hong", title: "เจ๊หงส์", tag: "เงิน", entry: "offer", castGone: "gone",
  discover: (s) => s.country === "th" && s.ageM >= 18 * 12 && s.ageM <= 60 * 12
    // short of money, in the trade, or a hunter with loot to sell (spec §12.3)
    && (s.gold < 5000 || ["shop", "appraise"].includes(s.job?.id) || !!s.hunter)
    && Object.values(s.world.people ?? {}).some((p) => p.cast === "hong" && p.diedWorldM == null),
  active: (s) => s.country === "th", pauseMax: 120, pauseEnd: "clean",
  cast: { hong: who("hong") },
  nodes: {
    offer: {
      delay: [1, 24], needCast: H,
      t: "ร้านขายพระหลังตลาดมีป้ายเล็กๆ ว่ารับซื้อทุกอย่าง "
        + "เจ๊หงส์แห่งกิลด์เมฆดำนั่งพัดตัวเองอยู่ เธอรู้ชื่อคุณก่อนคุณบอก",
      o: [
        { l: "ขอยืมเงินห้าพัน", noAuto: true, y: go("bigger", "เธอนับแบงก์ช้าๆ ต่อหน้าคุณ แล้วบอกว่าดอกเดือนละยี่สิบ",
          { gold: 5000, goldLabel: "ยืมเจ๊หงส์", vars: { owe: 1 }, castAct: { hong: "owes" },
            rel: mem("hong", "คุณยืมเงินเจ๊หงส์ห้าพันที่ร้านขายพระหลังตลาด", 5) }) },
        { l: "ขายข่าวว่าเกตไหนจะเปิด", s: "int", diff: 11,
          y: go("bigger", "ข่าวของคุณถูก เธอจ่ายสดแล้วจำหน้าคุณไว้", { gold: 1500, goldLabel: "ค่าข่าวเกต",
            rel: mem("hong", "คุณขายข่าวเกตให้เจ๊หงส์แล้วข่าวนั้นถูก", 15) }),
          n: go("bigger", "ข่าวของคุณผิด เธอยิ้มแล้วบอกว่าครั้งหน้าอย่าเสียเวลาเธอ", { rel: mem("hong",
            "คุณขายข่าวเกตผิดๆ ให้เจ๊หงส์", -10) }) },
        { l: "ถามแค่ราคาของแล้วกลับ", y: go("bigger", "เธอบอกราคาที่ถูกกว่าตลาดทางการครึ่งหนึ่ง",
          { rel: mem("hong", "คุณเคยแวะถามราคาของที่ร้านเจ๊หงส์", 0) }) },
      ],
    },
    bigger: {
      delay: [12, 36], needCast: H,
      t: (s, st) => `เจ๊หงส์เรียกคุณไปหาอีกครั้ง เธอพูดถึงตอนที่${first(s, st, "hong", "เจอกันครั้งแรก")} `
        + "แล้วเสนองานใหญ่: ขนคริสตัลจากเกตที่ไม่ได้ลงทะเบียนข้ามเขตหนึ่งคืน",
      o: [
        { l: "รับงาน", s: "agi", diff: 12, noAuto: true,
          y: go("reckoning", "คุณขนของถึงปลายทาง เธอโอนเงินก่อนคุณกลับถึงบ้าน", { gold: 8000,
            goldLabel: "ค่าขนของเมฆดำ",
            route: "partner", fac: { under: 8 }, castAct: { hong: "friend" }, rel: mem("hong",
              "คุณขนคริสตัลเถื่อนให้เจ๊หงส์ข้ามเขตได้ในคืนเดียว", 20) }),
          n: go("reckoning", "ด่านตรวจเจอของ คุณทิ้งรถแล้ววิ่ง เจ๊หงส์ต้องจ่ายค่าปิดเรื่องเอง", { route: "partner",
            mind: -6, rel: mem("hong", "คุณทำงานขนของให้เจ๊หงส์พลาดจนเธอต้องจ่ายค่าปิดเรื่อง", -15) }) },
        { l: "แจ้งตำรวจเรื่องงานนี้", noAuto: true, y: go("reckoning", "ตำรวจขอบคุณ แต่ร้านขายพระปิดไปก่อนพวกเขาจะถึง",
          { route: "informer", fac: { state: 8, under: -10 }, castAct: { hong: "enemy" },
            rel: mem("hong", "คุณแจ้งตำรวจเรื่องงานขนของของเจ๊หงส์", -40) }) },
        { l: "ปฏิเสธอย่างสุภาพ", y: go("reckoning", "เธอพัดตัวเองช้าลงแล้วบอกว่าคนฉลาดก็มีแบบนี้",
          { rel: mem("hong", "คุณปฏิเสธงานขนของของเจ๊หงส์อย่างสุภาพ", 5) }) },
      ],
    },
    reckoning: {
      delay: [12, 48], needCast: H,
      t: "ตำรวจบุกร้านขายพระหลังตลาด เจ๊หงส์ยังนั่งพัดตัวเองอยู่ที่เดิม เธอมองมาทางคุณที่ยืนอยู่ฝั่งตรงข้าม",
      o: [
        { l: "คืนเงินที่ยืมให้เธอก่อนตำรวจยึด", show: (s, st) => st.vars.owe === 1, need: { gold: 6000 }, noAuto: true,
          y: end("clean", "เธอรับเงินแล้วยัดใส่ชายผ้าถุง บอกว่าคุณเป็นลูกหนี้คนเดียวที่คืนครบ", { gold: -6000,
            goldLabel: "คืนเงินเจ๊หงส์พร้อมดอก", castAct: { hong: "friend" } }) },
        { l: "ไปยืนยันว่าเธอแค่ขายพระ", show: (s, st) => st.route === "partner" || trust(s, st, "hong") >= 20,
          s: "cha", diff: 13, noAuto: true,
          y: end("partner", "ตำรวจกลับไปมือเปล่า เจ๊หงส์แบ่งร้านครึ่งหนึ่งให้คุณดูแล", { gold: 3000,
            goldLabel: "ส่วนแบ่งร้านเจ๊หงส์", fac: { under: 5 }, castAct: { hong: "friend" } }),
          n: end("owed", "ตำรวจไม่เชื่อ เจ๊หงส์ถูกปรับก้อนใหญ่ แต่จำได้ว่าคุณมายืนข้างเธอ",
            { castAct: { hong: "owes" } }) },
        { l: "เดินผ่านไปเหมือนไม่รู้จัก", y: end("clean",
          "พรุ่งนี้ร้านเปิดตามปกติ มีป้ายใหม่ว่ารับซื้อทุกอย่างเหมือนเดิม") },
        { l: "ให้การเพิ่มกับตำรวจ", show: (s, st) => st.route === "informer", noAuto: true,
          y: end("informer", "เจ๊หงส์ถูกพาตัวไป เธอหันมายิ้มให้คุณก่อนขึ้นรถ ยิ้มแบบที่คุณไม่อยากเห็นอีก",
            { fac: { state: 5 }, castAct: { hong: "retire" } }) },
      ],
    },
    gone: {
      delay: [0, 1],
      t: (s, st) => `ร้านขายพระหลังตลาดปิดถาวร เจ๊หงส์ไม่อยู่แล้ว คุณนึกถึงวันที่${first(s, st, "hong", "เจอเธอ")}`,
      o: [
        { l: "ไปวางพวงมาลัยหน้าร้าน", show: (s, st) => trust(s, st, "hong") >= 20,
          y: end("partner", "มีพวงมาลัยวางอยู่แล้วสิบกว่าพวง ไม่มีชื่อผู้ให้สักพวง", { mind: -4 }) },
        { l: "เดินผ่านไป", y: end("clean", "ป้ายรับซื้อทุกอย่างถูกปลดลงแล้ว") },
      ],
    },
  },
  endings: { clean: { title: "มือสะอาด" }, partner: { title: "หุ้นส่วนเมฆดำ" }, owed: { title: "หนี้บุญคุณ" },
    informer: { title: "คนที่แจ้งตำรวจ" } },
};
