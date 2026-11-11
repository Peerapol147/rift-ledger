import * as C from "../../core/index.js";
import { CLASSES, ROLES, RANKS } from "../../data/index.js";
import { GUILD_PERK, FOUND } from "../../data/guilds.js";
import { esc, btn, money } from "../dom.js";

const row = (m, s, acts) => `<div class="item"><span><b>${esc(m.n)}</b> · ${esc(CLASSES[m.cls]?.n)} · ${ROLES[m.role]}
  · แรงก์ ${RANKS[m.rank]} Lv.${Number(m.lv)}${acts.mood ? ` <small class="dim">· ${acts.mood}</small>` : ""}</span><span>${acts.btns}</span></div>`;

export function teamTab(s) {
  let out = "";
  if (s.party) {
    const p = s.party;
    out += `<h3>ทีมของ ${esc(p.leader.n)}</h3><div class="kv"><span>ตำแหน่งของคุณ</span><b>${p.role === "vice" ? "รองหัวหน้า" : "ลูกทีม"}</b></div>
      <div class="kv"><span>หัวหน้ามองคุณ</span><b>${C.moodWord(p.trust)}</b></div>
      <p class="dim">หัวหน้าเลือกเกตและแผนการสู้ คุณได้ส่วนแบ่ง ${p.role === "vice" ? 60 : 40}% แต่ได้ประสบการณ์มากขึ้น</p>
      <div class="row">${btn("party:leave", "แยกทางด้วยดี", 'class="sm"')}${btn("party:split", "แยกไปตั้งทีมเอง", 'class="sm"')}${btn("party:betray", "หอบเงินทีมหนี", 'class="sm"')}</div>`;
  } else if (s.hunter) {
    const mine = s.team.filter((m) => m.alive).map((m) => row(m, s, {
      mood: `อารมณ์: ${C.moodWord(m.loyalty)}${m.hurtUntilM > s.ageM ? " · กำลังพักรักษาตัว" : ""}`,
      btns: btn("dismiss:" + m.id, "ให้ออก", 'class="sm"'),
    })).join("") || `<div class="dim">ยังไม่มีลูกทีม</div>`;
    const offers = C.recruitOffers(s).map((m) => row(m, s, {
      btns: btn("hire:" + m.id, "จ้าง " + money(C.feeOf(m)), `class="sm" ${s.gold < C.feeOf(m) ? "disabled" : ""}`),
    })).join("") || `<div class="dim">ปีนี้ไม่มีใครสมัคร</div>`;
    const fallen = s.team.filter((m) => !m.alive).map((m) => esc(m.n)).join(", ");
    out += `<h3>ลูกทีม ${s.team.filter((m) => m.alive).length}/${C.teamMax(s)}</h3>${mine}
      ${fallen ? `<div class="dim" style="margin-top:4px">ผู้ที่จากไป: ${fallen}</div>` : ""}
      <h3>คนที่อยากเข้าทีมปีนี้</h3>${offers}`;
    out += guildHtml(s);
  } else out += `<h3>ทีม</h3><p class="dim">ทีมฮันเตอร์เปิดเมื่อคุณตื่นพลัง ส่วนลูกน้องในกิจการจะเปิดเมื่อคุณมีกิจการของตัวเอง</p>`;
  const rel = [s.c.married && "แต่งงานแล้ว", s.c.firstLove && "เคยมีรักแรก", s.c.lentFriend && "เคยให้เพื่อนยืมเงิน"].filter(Boolean);
  return out + `<h3>ความสัมพันธ์</h3>${rel.map((r) => `<div>${esc(r)}</div>`).join("") || `<div class="dim">ยังไม่มีเรื่องที่บันทึกไว้</div>`}`;
}

const ROLE_WORD = { member: "สมาชิก", officer: "แกนนำ", master: "หัวหน้ากิลด์" };

function guildHtml(s) {
  const g = s.guild;
  let out = "<h3>กิลด์</h3>";
  if (g) {
    const d = C.guildDef(s);
    out += `<div class="kv"><span>สังกัด</span><b>${esc(g.n)}</b></div>
      <div class="kv"><span>ตำแหน่ง</span><b>${ROLE_WORD[g.role] ?? ""}</b></div>
      ${d ? `<div class="kv"><span>กิลด์มองคุณ</span><b>${C.moodWord(g.standing)}</b></div>
      <p class="dim">${GUILD_PERK[d.perk]} · กิลด์หักส่วนแบ่ง ${Math.round(d.cut * (g.role === "officer" ? 50 : 100))}% ของค่าเกต</p>`
    : `<p class="dim">ค่าบำรุงจากชื่อเสียงและลูกทีมเข้ากิลด์ทุกเดือน หักค่าดำเนินการ ${money(FOUND.upkeep)}</p>`}
      ${g.role !== "master" ? `<div class="row">${btn("guildLeave", "ออกจากกิลด์", 'class="sm"')}</div>` : ""}`;
  } else out += `<p class="dim">ยังไม่ได้สังกัดกิลด์ไหน</p>`;
  if (C.canFound(s)) out += `<div class="row">${btn("guildFound", `ตั้งกิลด์ของตัวเอง ${money(FOUND.gold)}`, 'class="sm"')}</div>`;
  return out;
}
