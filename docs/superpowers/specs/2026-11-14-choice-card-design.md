# The choice card (UX closer to the model game, part 1) — design

Date: 2026-11-14. Owner: make the play experience as close as possible to Way of Xian (mechanics and feel only:
never its code, text, names or art), refined one part at a time. Order agreed with the owner: **1 choice card** → 2
place/doing line and top bar → 3 person card and life highlights at death → 4 small things (theme, ½×, boot screen).
Reference: the model game's page structure and styles, read from the owner's HAR (scratchpad only, never committed;
summary below in our words). Calls not stated by the owner are marked **(call)**.

## 1. What the model game does (our words)

- A decision opens as a **card over the game screen** (a dimmed overlay), titled by the event, its top border coloured
  by how rare the event is, with a small rarity word next to the title.
- Under the title, a row of **the player's own numbers that matter to this decision**; then the text; then the
  options as a column of wide buttons, each with a short line under its label. The option that fits the main plan has
  a stronger border; the one that fits the second plan a dashed one; a life-changing option a red border with a badge;
  options show their odds with a small "why" that opens on tap.
- A **fold button** at the card's top right hides the card so the player can look at the screen (stats, log, scene)
  before deciding; a floating "open the choice" button brings it back. While folded the game stays paused and the
  speed buttons look dimmed. A checkbox on the card makes every new choice **start folded**.
- The card scrolls inside itself when long; the overlay never lets the page behind it scroll.

## 2. Where we are

`src/ui/layout.js` `eventPanel`/`eventCard` already draws most of the content in the side panel `#event`: tier word
and coloured top border (`t-rare`, `t-world`, `big`), tag, story part, the player's numbers for the tested stats
(`evstats`), options with keys 1–9, descriptions, effect chips, odds/risk badges, locks with "pin goal", "ให้ชะตาเลือก",
the gate preparation panel, and the fight status (`s.op`). Missing: the **overlay** presentation, **fold / unfold**,
**start folded**, plan-matching borders, the life-changing badge, and dialog behaviour (focus, keys, no page scroll).

## 3. Goals

1. When an event waits for the player (`s.ev`, and the autopilot leaves it), its card opens **over the stage**: a
   dimmed overlay `#choice` with a card centred on desktop and as a bottom sheet on phones (≤ 700 px) **(call)**.
   `#choice` lives inside `#game` (so the 44 px tap rule for `#game button` holds); the controls bar `#ctrl`
   (pause, speeds, settings) and the tab bar `#tabs` stay above the overlay and stay clickable, as in the model game
   whose speed buttons stay on screen **(call, builder check: 9+ ux-check cases press them while an event waits)**. The
   card holds exactly today's event content (same markup inside, same `data-a="choose:i"` buttons, same keys).
2. **Fold**: a button "พับไว้ดูก่อน" on the card; folded, the card is hidden, the overlay is transparent and lets taps
   through, and a floating button "เปิดตัวเลือก" (with the event's tag) sits above the bottom tabs. Folded or not, the
   life does not move on until a choice is made (as today). Speed buttons look dimmed while a choice waits **(call)**.
3. **Start folded**: a checkbox on the card ("เปิดเรื่องใหม่แบบพับไว้"), saved in the settings record (`cfg.fold`,
   default off): `cleanCfg` keeps a boolean `fold` (anything else → false) and `saveCfg` writes it; old settings
   without it stay valid.
4. **Plan borders**: an option "fits" a plan when its tested stat `o.s`, or a stat it raises (`o.y.st` keys), is one
   of the plan's stats (`FOCUS[id].st` in `src/core/clock.js`); the main plan's fit gets a solid accent border, the
   second plan's a dashed one; a plan with no stats (rest) or no second plan marks nothing **(call, builder check:
   options carry no plan data today)**. No "life-changing" badge in this part: `noAuto` marks 64 options of mixed
   kinds (lending money, rent), so a badge would mislead; a narrower data flag is a later part. No odds are added
   beyond the badges already shown (spec §11.1: no secrets).
5. **Dialog behaviour**: role dialog with the event title as its label; focus moves to the first enabled option when
   the card opens; Tab stays inside; keys 1–9 choose; **F** or **Esc** folds and unfolds **(call)** (Esc no longer has
   anything else to do while a choice waits); the page behind does not scroll; when the card closes after a choice,
   focus goes to the pause button. Settings opened while a card is open sits above it and keeps its own focus trap.
6. **Result line**: the outcome text of the last choice (today `ui.result` in `#event`) shows in the side panel as
   now, so it is read after the card closes. Choosing with keys 1–9 shows it too (today only clicks do).
7. The side panel `#event` keeps "no event yet / ongoing operation" text when nothing waits; while a card is open it
   shows a one-line placeholder "มีเรื่องรอคุณตัดสินใจ" with an "open" button (so desktop players see why the life
   stopped) **(call)**; the placeholder does not use the `.ev` class (UX-15 reads `.ev p` for the event text).

## 4. Non-goals

The place/doing line, the top bar, person cards, death highlights, theme, ½× (later parts); new odds or "why" text;
art; changes to events, balance, saves (besides the new `cfg.fold`).

## 5. Anti-goals

A choice made by accident (UX-02 touch rules and R-space-hold stay); a hidden choice the player cannot find again;
focus lost or stuck behind the overlay; the 25 ux-check cases regressing (update a case's selector only when the
element moved, never its expectation, and record that); an overlay on top of the settings dialog.

## 6. Approaches

| | Approach | Trade-off |
|---|---|---|
| **A** | **Move the existing event card markup into a new overlay `#choice`; keep `eventCard` as the single source of the content; add fold state in `ui`** | Smallest change; every option behaviour and test hook stays the same. |
| B | Rebuild the decision UI from scratch in the model game's shape | Closer copy of its markup, but re-implements locks, chips, prep, ops and every test hook; high risk. |
| C | Keep the side panel and only add a fold-less popup on phones | Cheap, but loses the model game's core feel (card over the scene, fold to look). |

**A** **(call; the owner handed over the how)**.

## 7. Measured

- ux-check new cases: `C-open` (a waiting event opens the overlay with its options; Tab stays inside), `C-fold`
  (fold hides the card, the floating button reopens it, the life did not move while folded), `C-start-folded`
  (with `cfg.fold` a new event opens folded), `C-phone` (390×844: the card is a bottom sheet, its options are
  reachable, no sideways scroll), `C-plan` (an option matching the main plan has the plan border). Each fails first.
- All 25 existing cases still pass; `npm test` green; lifecheck/playtest unaffected (UI only).

## 8. After the builder check

Esc with settings open closes settings first (its handler runs first), then folds the card on the next press.

## 9. Left to the builder

Exact CSS (colours from our tokens, not the model game's), animation (none or a short fade that respects
reduced motion), the floating button's exact place on desktop.
