import * as C from "../../core/index.js";
import { TOWERS, CALENDAR, CLASSES, RANKS, COUNTRIES, FACTIONS } from "../../data/index.js";
import { esc } from "../dom.js";
import { GUILDS } from "../../data/guilds.js";
import { HUNTER_FAMILIES } from "../../data/families.js";

const TIER = [["legend", "ตำนาน"], ["major", "ใหญ่"], ["shadow", "เงา"]];
// The cast this life knows of: famous (record holders), named in the news, or met. Nothing about their future.
const known = (s, p) => p.cast && (p.heard || s.world.roster?.some((n) => n.personId === p.id)
  || s.relations?.[p.id]?.memories?.length || p.ties?.[s.familyId]);
const status = (p) => (p.diedWorldM != null ? "จากไปแล้ว" : p.retired ? "เกษียณ" : p.hunter ? `แรงก์ ${RANKS[p.rank]}`
  : "ยังไม่ตื่นพลัง");
function guildsHtml(s) {
  const cast = Object.values(s.world.people ?? {}).filter((p) => known(s, p));
  const who = (pred) => cast.filter(pred).map((p) => `<div class="dim">· ${esc(p.name)} · ${status(p)}</div>`).join("");
  const rows = TIER.map(([t, word]) => Object.entries(GUILDS).flatMap(([c, list]) => list.filter((g) => g.tier === t)
    .map((g) => `<div class="kv"><span>${esc(g.n)} · ${COUNTRIES[c].n}</span><b>${word}</b></div>`
      + who((p) => p.guild === g.id))).join("")).join("");
  const fams = Object.entries(HUNTER_FAMILIES).map(([id, f]) => {
    const members = who((p) => p.family === id && !p.guild);
    return `<div class="kv"><span>${esc(f.n)} · ${COUNTRIES[f.country].n}</span><b>ตระกูล</b></div>${members}`;
  }).join("");
  return rows + fams;
}

export function worldTab(s) {
  const towers = Object.values(TOWERS).map((t) => `<div class="kv"><span>${esc(t.n)} · ${COUNTRIES[t.country].n}</span><b>ชั้น ${Number(s.world.records[t.id])}</b></div>`).join("");
  const seen = CALENDAR.filter((e) => s.world.done[e.id]).map((e) => `<div>ปีที่ ${e.year} · ${esc(e.news.replace("{npc} ", ""))}</div>`).join("");
  const roster = s.world.roster.map((n) =>
    `<tr><td>${esc(n.title ?? n.n)}</td><td>${COUNTRIES[n.country].n}</td><td>${RANKS[n.rank]}</td><td>${esc(CLASSES[n.cls]?.n ?? "")}</td></tr>`).join("");
  return `<h3>ตอนนี้</h3><div>${esc(C.dateText(s))}</div>
    <h3>สถิติหอคอย</h3>${towers}${s.c.floor ? `<div class="dim">ชั้นสูงสุดของคุณ: ${s.c.floor}</div>` : ""}
    <h3>กิลด์และตระกูล</h3>${guildsHtml(s)}
    <h3>ฝ่ายต่างๆ มองคุณ</h3>${Object.entries(FACTIONS).map(([k, n]) => `<div class="kv"><span>${n}</span><b>${C.facWord(s.fac?.[k])}</b></div>`).join("")}
    <h3>เหตุการณ์ที่ผ่านมา</h3>${seen || `<div class="dim">ยังไม่มี</div>`}
    <h3>ฮันเตอร์ที่โลกจับตา</h3><table>${roster}</table>`;
}
