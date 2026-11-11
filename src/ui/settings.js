// Settings modal: autopilot policy, font size, save slots with export/import, glossary.
import { esc, btn } from "./dom.js";
import { POLICIES } from "./layout.js";

export const FONT = { 1: "14px", 2: "15px", 3: "17px" };
const GLOSSARY = [
  ["แรงก์", "ระดับพลังที่สมาคมประเมิน F ต่ำสุด S สูงสุด"],
  ["เกต", "ประตูมิติที่มีมอนสเตอร์และวัตถุดิบ ถ้าไม่มีใครเคลียร์ทันจะแตก"],
  ["เกตแตก", "มอนสเตอร์ทะลักออกจากเกตเข้าเมือง"],
  ["หอคอย", "สิ่งที่โผล่ขึ้นวันฟ้าแตก แต่ละชั้นคือเศษของโลกอื่น"],
  ["สุขภาพจิต", "ต่ำเกินไปจะเลือกบางทางไม่ได้ และอาจทำให้หยุดงานหรือหยุดล่า"],
  ["อันตรายถึงชีวิต", "โอกาสที่ทางเลือกนี้จะจบด้วยบาดแผลร้ายแรงหรือความตาย"],
];

export function settingsView(ui, slotList) {
  const pol = Object.entries(POLICIES).map(([k, n]) => btn("policy:" + k, n, `class="sm ${ui.policy === k ? "on" : ""}"`)).join("");
  const fs = [1, 2, 3].map((n) => btn("fs:" + n, ["เล็ก", "ปกติ", "ใหญ่"][n - 1], `class="sm ${ui.fs === n ? "on" : ""}"`)).join("");
  const slots = slotList.map((x, i) => `<div class="item"><span>ช่อง ${i + 1}: ${x ? `${esc(x.name)} อายุ ${Math.floor(x.ageM / 12)}${x.dead ? " (จบแล้ว)" : ""}` : `<span class="dim">ว่าง</span>`}</span>
    <span>${btn("save:" + i, "บันทึก", 'class="sm"')}${x ? btn("load:" + i, "โหลด", 'class="sm"') + btn("export:" + i, "ส่งออก", 'class="sm"') + btn("del:" + i, "ลบ", 'class="sm"') : ""}</span></div>`).join("");
  return `<div class="st-card"><h3>ตั้งค่า</h3>
    <h4>ออโต้</h4><div class="row">${pol}</div>
    <h4>ขนาดตัวอักษร</h4><div class="row">${fs}</div>
    <h4>เซฟ (บันทึกอัตโนมัติทุกปีลงช่องที่เล่นอยู่)</h4>${slots}
    <div class="row"><input data-c="importText" placeholder="วางข้อความเซฟที่ส่งออกไว้" style="flex:1">${btn("import", "นำเข้าช่อง 3", 'class="sm"')}</div>
    ${ui.exportText ? `<textarea readonly style="width:100%;height:80px;margin-top:6px">${esc(ui.exportText)}</textarea>` : ""}
    <h4>คำศัพท์</h4>${GLOSSARY.map(([k, d]) => `<div><b>${k}</b> <span class="dim">${d}</span></div>`).join("")}
    <div class="row">${btn("close", "ปิด", 'class="pri"')}${btn("quit", "กลับหน้าแรก")}</div></div>`;
}
