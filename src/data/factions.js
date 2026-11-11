// Factions (spec §6.7). Standing −100..100, shown only as a word. FAC_FROM: counters/flags that already exist in
// the content and what they mean to each faction, so old content moves standing without rewriting it.
export const FACTIONS = { assoc: "สมาคมฮันเตอร์", state: "รัฐ", church: "ศาสนจักร", research: "นักวิจัย",
  under: "องค์กรใต้ดิน" };

export const FAC_WORDS = [[60, "ไว้วางใจ"], [25, "เป็นมิตร"], [-24, "เฉยๆ"], [-59, "ระแวง"], [-100, "เป็นศัตรู"]];

export const FAC_FROM = {
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
