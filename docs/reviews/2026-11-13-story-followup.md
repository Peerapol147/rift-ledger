# Story follow-up review — 2026-11-13

Reviewed branch: `claude/dreamy-ptolemy-1cxsdc`, commit `4eb649d`.
Comparison baseline: main `65e5621`. At review time these changes were not merged into main.
Original feedback: [STORY-AUDIT-FEEDBACK.md](../STORY-AUDIT-FEEDBACK.md).

## Conclusion

Several original issues are resolved, but the handoff claim that all six findings are fixed is premature. Three follow-up items remain below. This review changes documentation only; it does not implement fixes or approve a merge.

## 1. P2 — Support finale still invents a loss regardless of the player's choice

Locations: `src/data/stories/hunters.js:119–121`, `src/core/stories.js`, `test/story-continuity.test.mjs:29`.

The fatal narrative outcome now increments `spLost`, but no runtime code reads that counter. The next chapter always says:

> หลายปีในแนวหลังทำให้คนในวงการรู้จักชื่อคุณ ทั้งทีมที่คุณพากลับมาครบ และทีมที่คุณพากลับมาไม่ครบ

Controlled reproduction through openEvent/choose:
- Give the player enough money, open support:3, choose the medicine option: `spLost` remains 0; support:4 nevertheless mentions teams brought home incomplete.
- Choose “ยอมรับว่าช่วยไม่ได้”: `spLost` becomes 1; the same finale appears. An existing member in `s.team` remains alive.

The new counter records the choice, but the narrative still does not distinguish the outcomes. The frontliner's identity is also unresolved: if this is a real team member, the death is not reflected in team state; if it is a temporary NPC, make that explicit. Do not silently kill an arbitrary member to match the prose.

Suggested correction: use the actual loss history to select the finale, or use neutral text that assumes neither universal survival nor an unrecorded death. Add a behavioral regression for both saved and lost routes; merely forbidding the old sentence misses this issue.

## 2. P2 — Honest shop route remains unavailable to existing saves

Locations: `src/data/stories/careers.js:63,76`, `src/core/save.js`.

New games record `shopClean` when declining the uncertified stones, and the new honest inspection option works for them. Existing saves made after declining under the old version have no such counter. Deserialization does not recover that history.

Reproduction:
1. With baseline main's core/data, create an adult with 10,000 gold; open shop:1 and choose “ปฏิเสธทั้งหมด”.
2. Serialize using the baseline implementation.
3. Deserialize using the reviewed branch; open shop:3.
4. Available choices remain only “ซ่อนของไม่มีใบรับรอง” and “จ่ายใต้โต๊ะ”.

A new-version refusal correctly adds “ให้ตรวจตามสบาย ร้านไม่เคยรับหินมานา”. Thus the fix is confirmed for new choices but incomplete for returning players.

Suggested correction: provide a safe honest route for legacy saves using reliable existing evidence, or a neutral inspection option that does not invent past purchases. Do not infer innocence from a missing counter alone without considering other routes. Test old-save loading as well as new clean/legal/grey routes.

## 3. P3 — Ticket dialogue promises one night, then waits months without explanation

Location: `src/data/secrets.js:25–30` (`sq:ticket:0–1`).

The added motivation improves why the businessman hands over the blade. However, the first outcome now says “ขอเวลาคิดหนึ่งคืน” while the quest still has `gap: [6, 12]` months.

Controlled reproduction with seed `review-ticket`, adult age 360 months, `silentTicket=1`, secrets=['ticket']: after accepting the first step, the next scheduled step is 9 months away.

This is a narrative timing inconsistency, not an engine crash. Keep the intended pacing and remove the precise one-night promise, or explain the delayed contact. Changing the scheduler is unnecessary for a wording-only correction.

## Confirmed improvements

- office:4 no longer claims the first customer is a hunter previously helped.
- office:2 now describes a one-off transfer bonus rather than an unimplemented salary raise.
- seven no longer claims seven years elapsed since the player's first encounter; the next opening is described as approaching.
- phoenix applies the three-scene draft with addresses/contact details and a clearer reason to pass on the token; existing gates and reward action remain.
- shop's honest inspection option works after a new-version refusal.
- ticket now supplies a reason for the transfer of the blade, subject to the timing issue above.

## Validation performed on the reviewed commit

- `npm test`: 204 passed, 0 failed, 0 skipped.
- `node tools/artcheck.mjs`: passed; 11 open requests.
- `node tools/playtest.mjs 40`: completed 40 lives; runner reported no bugs.
- Additional controlled core probes reproduced the support, legacy-save and ticket-timing findings above.

Passing suites do not establish narrative correctness. Several new tests check particular substrings rather than outcome-dependent story behavior. The probes use controlled states, not full playthrough coverage of every route. No new claim about an updated build or deployed game is made here.
