// The main cast: the same people in every world (owner, 2026-11-13). Their lives are not fixed: core/cast.js rolls
// them on each person's own stream, and the player's stories change them. Spec: 2026-11-13-main-cast-design.md §4.
// bornY: years from 2051 (the first player's birth year). rank/ceiling: 0 F .. 6 S. awakenAt: a peer awakens then.
const c = (name, sex, country, city, bornY, rank, ceiling, cls, guild, family, role, romance = false,
  awakenAt = null) => ({ name, sex, country, city, bornY, rank, ceiling, cls, guild, family, role, romance, awakenAt });

export const CAST = {
  poramet: c("ปรเมศวร์ ศิลาวงศ์", "m", "th", "bkk", -24, 6, 6, "barrier", "chaophraya", "silawong", "mentor"),
  lalin: c("ลลิล ศิลาวงศ์", "f", "th", "bkk", 1, 0, 5, "healer", null, "silawong", "peer", true, 18),
  seojin: c("ยุน ซอจิน", "m", "kr", "sel", -20, 6, 6, "mblade", "baekho", "yoon", "rival"),
  harin: c("ยุน ฮาริน", "f", "kr", "sel", -1, 0, 5, "sword", null, "yoon", "peer", true, 18),
  thongbai: c("ครูทองใบ", "m", "th", "bkk", -32, 4, 4, "knight", "saengnuea", null, "mentor"),
  mingyu: c("ชเว มินกยู", "m", "kr", "pus", -10, 5, 5, "healer", "haneul", null, "ally"),
  hong: c("เจ๊หงส์", "f", "th", "bkk", -18, 3, 3, "appraiser", "mekdam", null, "fixer"),
  dohyun: c("คัง โดฮยอน", "m", "kr", "icn", -6, 4, 5, "trapper", "geomeun", null, "rival"),
  pim: c("พิมพ์ ศิลาวงศ์", "f", "th", "bkk", 26, 0, 6, "barrier", null, "silawong", "peer", true, 18),
};
// The tower record holders the world calendar names (data/calendar.js): fixed people now.
export const HOLDERS = { silentHolder: "poramet", drownedHolder: "seojin" };
