// World constants. Spec §3 and §5.
export const WORLD = { RIFT_YEAR: 2030, BIRTH_YEAR: 2051 };

const city = (id, n, cost, gateRate) => ({ id, n, cost, gateRate });

export const COUNTRIES = {
  th: {
    n: "ไทย",
    w: 65,
    tower: "silent",
    cities: [
      city("bkk", "กรุงเทพฯ", 160, 0.05),
      city("cnx", "เชียงใหม่", 110, 0.03),
      city("hkt", "ภูเก็ต", 130, 0.035),
    ],
  },
  kr: {
    n: "เกาหลีใต้",
    w: 35,
    tower: "drowned",
    cities: [
      city("sel", "โซล", 190, 0.055),
      city("pus", "ปูซาน", 140, 0.04),
      city("icn", "อินชอน", 150, 0.045),
    ],
  },
};

export const cityOf = (id) => Object.values(COUNTRIES).flatMap((c) => c.cities).find((c) => c.id === id);

export const RANKS = ["F", "E", "D", "C", "B", "A", "S", "EX"];
export const RANK_W = [40, 20, 15, 10, 9, 5, 1];
export const EX_P = 0.00001;
export const AWAKEN_RATE = 0.25;
export const CEIL_W = [45, 40, 15];
