// Businesses a civilian can own, opened by story-chain flags. base = monthly profit before staff. Spec §6.1.
export const BUSINESSES = {
  ownFirm: { n: "บริษัทที่ปรึกษา", base: 900 },
  shopChain: { n: "ร้านค้าหลายสาขา", base: 1400 },
  ownLogistics: { n: "บริษัทขนส่งเกต", base: 1200 },
  ownPress: { n: "สำนักข่าวอิสระ", base: 600 },
  ownAgency: { n: "เอเจนซีฮันเตอร์", base: 1600 },
  ownAppraisal: { n: "สำนักประเมินวัตถุดิบ", base: 1000 },
  ownRestaurant: { n: "ร้านอาหาร", base: 800 },
  ownClinic: { n: "คลินิกฟื้นฟูฮันเตอร์", base: 1500 },
  ownForge: { n: "โรงตีอาวุธ", base: 1300 },
};
export const STAFF_MAX = 4;
export const STAFF_WAGE = 250; // per staff member per month
export const STAFF_BONUS = 0.25; // profit added per staff member present
