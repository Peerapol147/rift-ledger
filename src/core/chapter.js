// The life's chapter as one word for the top bar (top bar design §2): read only from what the life already shows,
// so it never tells the player anything new. Not the life-arcs system (model game notes §5), just its label.
import { stageOf } from "./state.js";

export function chapterOf(s) {
  if ((s.injuries ?? []).some((i) => i.untilM != null && i.untilM > s.ageM)) return "ช่วงพักฟื้น";
  const st = stageOf(s);
  if (st === "kid") return "วัยเด็ก";
  if (st === "teen") return "วัยเรียน";
  if (st === "old") return "บั้นปลาย";
  if (s.hunter && !s.flags?.stoppedHunting) return s.guild?.n ? `ฮันเตอร์กิลด์${s.guild.n}` : "ฮันเตอร์อิสระ";
  if (s.hunter) return "เลิกล่าแล้ว";
  return s.job ? "ชีวิตการงาน" : "ช่วงหางาน";
}
