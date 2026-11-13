// The story you are following and the people you know, as the player sees them: words, never numbers, never the
// names of roads not taken. Spec: 2026-11-13-lives-that-remember-design.md §5.5.
import * as C from "../core/index.js";
import { esc } from "./dom.js";

const ROLE = { friend: "เพื่อนวัยเด็ก", claimant: "ฮันเตอร์ที่เคยมาเคลมประกัน", assoc: "ผู้ตรวจจากสมาคม" };
const TIE = { partner: "เคยเป็นคู่ชีวิตของคนในครอบครัวคุณ", friend: "เพื่อนของครอบครัวคุณ",
  enemy: "เคยเป็นศัตรูของครอบครัวคุณ", owes: "มีบุญคุณต่อกันกับครอบครัวคุณ" };

export function storyLine(s) {
  const f = C.followedStory(s);
  if (!f) return "";
  return `<div class="storyline"><span class="dim">เรื่องที่ติดตาม:</span> <b>${esc(f.title)}</b>`
    + `${f.last ? ` — ${esc(f.last)}` : ""}</div>`;
}

// Only people this life has really met: someone with a shared memory.
export function peopleView(s) {
  const rows = Object.entries(s.relations ?? {})
    .filter(([id, r]) => r.memories?.length && C.personById(s, id))
    .map(([id, r]) => {
      const p = C.personById(s, id), role = p.tags.map((t) => ROLE[t]).find(Boolean) ?? "คนรู้จัก";
      const gone = p.diedWorldM != null ? " · จากไปแล้ว" : "";
      // this life's own spouse is "your partner"; the family words are for what earlier lives were to them
      const tie = p.partnerOf === s.lifeId ? " · คู่ชีวิตของคุณ" : "";
      return `<div class="item person"><span><b>${esc(p.name)}</b> · ${role}${gone}${tie}`
        + `<small>${esc(C.trustWord(r.trust))} · ${esc(r.memories.at(-1).text)}</small></span></div>`;
    }).join("")
    // people an earlier generation knew: what they were to the family, in words
    + Object.values(s.world?.people ?? {})
      .filter((p) => TIE[p.ties?.[s.familyId]] && !s.relations?.[p.id]?.memories?.length)
      .map((p) => `<div class="item person"><span><b>${esc(p.name)}</b> · ${TIE[p.ties[s.familyId]]}`
        + `${p.diedWorldM != null ? " · จากไปแล้ว" : ""}</span></div>`).join("");
  return rows ? `<h3>คนที่รู้จัก</h3>${rows}` : "";
}
