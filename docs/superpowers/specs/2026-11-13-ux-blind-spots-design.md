# UX blind spots in the browser checks — short design

Date: 2026-11-13. Owner: "test the UX/UI system GPT made for blind spots" — approved the proposal below.
Builds on `docs/feedback/ux-2026-11-13/REPORT.md` and `tools/ux-check.mjs` (one PASS/FAIL line per report id).

## Intent
`tools/ux-check.mjs` covers the report's findings except UX-01, and never tries what the report did not. Close the
gaps that cost a player most (lost saves, a lost keyboard place, an unreadable phone screen), each as a browser case
that fails while the bug is there.

## Goals
New cases in `tools/ux-check.mjs`, each named `B-<topic>`:
1. `B-save-fail` — a manual save whose write throws shows the failure banner, never "บันทึกแล้ว" (UX-01).
2. `B-autosave-fail` — when autosave's write throws during play, the failure banner is shown and not lost to another
   banner before the player can read it.
3. `B-two-tabs` — a tab holding an older state of a life cannot write over a newer save of the same slot made in
   another tab; the player is told.
4. `B-log-phone` — on a 390×844 phone, a long life's log has a height limit, so the monthly plan and event stay
   reachable without scrolling past the whole log.
5. `B-focus-return` — closing settings returns keyboard focus to the settings button even when the toolbar was
   redrawn while settings was open.
6. `B-big-font` — the largest text setting at 320×568 gives no sideways scroll and every settings button can be
   reached.
7. `B-landscape` — on a phone held sideways (844×390) the event's choices are reachable and nothing scrolls sideways.

Each case is proved twice: it fails against a broken build (the real bug, or a temporary break when the game is
already right), then passes on the fixed game.

## Non-goals
New UI features, visual redesign, art, changes to balance or saves' format.

## Anti-goals
A check that passes before the fix (the handoff's lesson); hiding a failing save from the player; a fix that changes
the 18 existing checks' results.

## Approaches
A **(picked, owner)**: add cases to `tools/ux-check.mjs` and fix what fails. B: a written report only — dropped, the owner
wants the game without blind spots, not a list.

## Left to the builder (calls)
- Two tabs **(call)**: on a save, if the slot already holds the same life (same `lifeId`) further on (`ageM` greater),
  the write is refused and the banner says another tab is further on; the existing "newer save is locked" rule is
  reused if it fits.
- Log height **(call)**: CSS max height with its own scroll on phones; desktop unchanged.
- Banner priority **(call)**: a save failure banner is not replaced by a tab/news banner for its 3.5 seconds.
