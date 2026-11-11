# Phase 7: Guilds — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Spec §6.3: "join a guild or found your own", and §9.2 "the guild locker". Guilds are a long-term home for a hunter. Each one trades a cut of your pay for a real perk.

**Spec:** §3.2 (fictional organisations only), §6.3, §9.2, §11.1 (standing shown as a word).

## Rules
- `src/data/guilds.js` holds 3 fictional guilds per country: one safe, one elite and one shady.
  - **safe:** a boss loss is half as likely to kill you, because the guild's rescue team is waiting.
  - **elite:** +20% hunter XP. Minimum rank D.
  - **shady:** smaller cut. Unregistered gates are offered from underground standing 10 (not 20). Joining needs underground standing ≥ 10.
- `s.guild = { id, n, role: "member" | "officer" | "master", standing 0..100, since }`. Guilds and an NPC party are exclusive.
- **Offer:** once a year (month 3), a 50% chance while you can hunt, are in no party and in no guild. The offer is an important event.
- **Cut:** gate and tower pay lose `cut`, or half of it for an officer (`ส่วนแบ่งกิลด์`). A master pays none.
- **Guild job:** while you are a member, the gate choice adds a guild job at your rank that pays ×1.3. A win raises standing by 4. Any won gate raises it by 1.
- **Promotion:** at standing ≥ 70, rank ≥ C and 3+ years in, you are promoted to officer (an event).
- **Leaving:** any time from the team tab. Locker items go home. Moving country leaves an NPC guild.
- **Founding:** rank ≥ C, fame ≥ 40, ₿50,000 and no party.
  - Your team cap becomes 6.
  - Monthly income is fame×40 + 600 per teammate, against ₿2,500 upkeep.
  - Association standing +5.
- **Guild locker:** 20 slots, open only while you are in a guild.
- **Legacy:** a founded guild is listed. The book records `guildMaster`.

## Tests
- the offer respects rank and the shady guild's underground requirement
- the cut is charged
- the safe perk halves boss death
- the guild job appears
- promotion
- founding needs every requirement and raises the team cap
- leaving moves the locker items home
- old saves without `s.guild` play
