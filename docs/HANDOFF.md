# Handoff for the next session

Read `CLAUDE.md`, `AGENTS.md` and this file before working. The binding design is
`docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`.

**Owner's latest continuation brief:** [CLAUDE-NEXT-BRIEF.md](CLAUDE-NEXT-BRIEF.md).
Read it before choosing the next task; it separates shipped UI work from remaining save/story work.

## Download packaging fix — 13 November 2026

The owner could not download the raw HTML link. HTTP verification showed GitHub serves it as
`text/plain`; it opens source rather than a playable page or download prompt. Distribute
`downloads/rift-ledger-play.zip` instead. It contains the current `play.html` and Thai instructions.
After every new build run `python tools/package-download.py` before distributing the ZIP;
the packager verifies ZIP integrity and byte equality with the built HTML.

## Character redraw — latest owner direction

The owner rejected the previous procedural region motion and rotating portrait art.
Those render paths are replaced by 68 generated four-frame strips (272 frames): both sexes,
eight ages, 15 classes and 11 shared career art identities. Read `art/animation/README.md`
and the latest Claude brief. Original reference PNGs are preserved. The stage and portrait
select the same identity from public age/class/career/sex. Stage idle freezes during actions.
Do not restore the rejected procedural animation from the historical motion plan.

Music button is reachable over the start screen, retries blocked autoplay on one tap and reports
actual playback state. Stale play rejection cannot overwrite successful playback feedback.
Validation commands include `tools/young-audio-regression.mjs` and
`tools/motion-continuity-regression.mjs` alongside existing UX regressions. Current verification: 205 core tests, 10 existing UX browser scenarios, plus new audio/motion and continuity checks passed; artcheck, linelen and build passed. Historical counts below belong to earlier commits.

## Responsive interface and original character frames — 13 November 2026

Branch `claude/responsive-ui` implements the owner-authorized UI subset of phases A/B.
See [implementation and verification](feedback/ux-refresh-2026-11-13.md).
Includes completed-tap choices, modal focus isolation, inventory refresh, reading pauses,
mobile monthly-plan access, original profession/rank frames, and age-correct portraits.
Infants under 12 months use the existing swaddled art; 12–35 months use toddler art.
Do not mark the full roadmap complete: persistence integrity and narrative phase C remain open.
Core tests: 201 passed; browser interaction regressions: 10 passed; artcheck/linelen/build passed.

## Original improvement roadmap — owner emphasized story (13 November 2026)

Start with [the Compare and evidence](research/rift-ledger-vs-way-of-xian.md), then
[the Claude roadmap](superpowers/plans/2026-11-13-improvement-roadmap.md).
The four detailed plans cover trust, readable decisions, **original narrative continuity**,
and validation. Story audit starts alongside UX work; civilian and hunter pilots plus
public heir memories are required. Do not copy reference-game code, plots, art or formulas.
The comparison commit da275a7 contains documentation only relative to 98e5332.
The UI subset implemented later is recorded above; the rest of the plans remain open.
The raw HAR/reference source remains outside Git. Preserve the existing default/music fix.

## Owner-requested defaults and music fix — 13 November 2026

Branch `claude/manual-defaults-bundled-music` implements UX-15: first play and pre-migration
settings start at 1× / Stop. `manualDefaults: 1` marks settings saved after this change;
subsequent explicit policy selections persist. Life saves are unchanged. Null settings
also fall back safely (UX-12 null case); this does not close all configuration-validation work.
The supplied Shadow's Resolve MP3 matches the existing audio file. The build now embeds it
in `play.html` as a data URL so downloading only that file retains music.
Validation: 198 core tests, artcheck, linelen and build pass. Chromium verified fresh/old/null
settings wait on a pending event, subsequent policy choice persists, and embedded audio plays
with external audio requests blocked. Direct file:// browser testing was blocked by managed
browser policy; the self-contained build was tested over HTTP. Other UX findings remain open.

## Owner-requested UX research — 13 November 2026 (Bangkok)

Read [the actionable UX feedback](feedback/ux-2026-11-13/REPORT.md) before the next UI work.
It contains 13 reproduced issues, 2 design recommendations, portable browser diagnostics,
and acceptance criteria. Prioritize data loss and accidental decisions. This is research,
not implemented fixes; preserve the owner’s saves and existing game rules.

## The owner
- Thai-speaking and not a programmer. Reply in Thai, plainly, with no jargon.
- Give a recommendation, not a menu. Push back with reasons when a request would hurt the game.
- Vision: no ending. The world keeps turning; you die and someone else takes your place; you are not necessarily the
  protagonist. Lives should be long, stable (seeded), varied, and fun to die and be reborn into.
- Wants token-efficient work.
- Has delegated about 95% of decisions. Asks for approval only on big direction changes, on publishing anything
  publicly, and on art.
- Class, skill and item names are in English on purpose. Never reveal secrets in the UI (spec §11.1).

## How we work
- Branch `claude/loving-dijkstra-ywn8qq`. Commit, open a PR, merge it yourself, then reset the branch to main.
- Before merging: `npm test`, `node tools/linelen.mjs`, `node tools/sim.mjs 1000 --policy careful|normal|reckless --seeds a,b,c,d,e`,
  `node tools/playtest.mjs 200`, `npm run build`, and commit `play.html`.
- Call an independent reviewer subagent only for big system changes. Content goes through tests, sims and the
  playtest instead.
- Balance: never tune to one seed set. `--seeds a,b,c,d,e` prints the mean and [lowest–highest] sample; judge the mean.
- Re-check against the spec before big merges. Send the owner the new `play.html` after each merge.
- Owner feedback form (private artifact): https://claude.ai/artifact/A3cDSFiDyyLiSPaEWeEKPw. Its data is read with
  ArtifactData, collection `feedback`.
- Game-dev skills live in `tools/skills/` (see its README).

## State (end of the first long session)
Built:
- life from birth to death, awakening, ranks and classes
- jobs, businesses, money, debt, storage, forging, loot tiers, role gear, tower sets
- team, party, guilds, five factions with patron and enemy arcs
- towers 1–50 for both towers, secret quests, three world-truth lines, the collection book
- heirs (play on as child or grandchild)
- endless world news (`src/core/pulse.js`), illness with a choice, the bot playtester, versioned saves with a backup

## Backlog (owner agreed, in order)
1. ~~Balance on many seeds~~ done: sim judges the mean of `--seeds`, CI runs 3 sets. Causes fixed: the awakening
   boost maxed out for everyone (now +0.5% a point), F→E took 29 gates and A→S 192 (now XP per rank), a careful
   retreat taught half of a timeout (now both 30%), board stipends paid 3× a salary. Left: normal F–E income sits
   ~0.5% over its +5% cap (inside one standard error); reckless civilians refuse treatment so their old-age row warns.
2. ~~Boss retreat~~ verified by `test/boss-retreat.test.mjs`. New finding: at their own level nearly every solo boss
   fight with the retreat plan ends in a retreat, and the careful bot never takes a boss gate at all; bosses are
   still too hard alone (fold into item 3's balance or a combat pass). A two-rank ceiling is almost never reached.
3. ~~Money as choices~~ first pass done (`src/core/spend.js`): a home (halves rent in its city, passes to the heir
   untaxed, sold at 90% on moving), a mentor for a year (30% are frauds; checking papers with INT spots them),
   a child's school (academic / hunter-prep / state, shapes the heir's start), a fund in your name (fame, mind, a
   grant for the heir at 18), and paid boss intel (boss −20% hp/atk, a fatal loss half as likely). `sim --frugal`
   plays a saver: 181k at death and no home vs 93k plus a home, and frugal civilians die of untreated illness
   more. Still: money piles up mid-life (median ~93k at death); `mind` sits at 100 for nearly everyone, so it
   measures nothing (look at mind sources/sinks).
   → fixed: adult work/study/train/hunt wear mind down each month, rest and people restore it, debt and open
   wounds weigh, a home and a marriage hold you up, fights end with a mind swing, and below 30 every check is
   harder (−1 a point). Sim row: working-age mind 40–75 (reckless 25–60); careful 67, normal 55, reckless 30.
3b. ~~Life-loop basics~~ done: the event roll was per tick, so 3-month childhood ticks gave children a third of
   the events (~1 choice a year vs ~3 for adults). It is now per month. `src/data/events/quiet.js` fills the
   thin ages (infancy, 17–20, 50s, 62–75, 70+) and adds a 20-year payoff chain (time capsule). Playtest prints
   choices a year by stage (child 2.1, teen 2.8, adult 3.6, old 2.6); the longest median silence went 3→2 years,
   distinct events per life 81→108. Save now keeps the `good` log tone.
3c. ~~Coherence pass~~ (owner: "the content drifted from the brief, and the opening is confusing"). Found by reading
   whole lives end to end and by playing `play.html` in a browser, not by the sims (which all passed). Fixed:
   a birth card that explains the world and the family, an optional name, no monthly plan before age 3, no snow in
   Thailand; the spec's missing "18–22 study or work" milestone (`ms18b`), a doctor needs medical school and a
   teacher a degree, promotion takes years (was a department head at 25), all 12 careers are offered (was the
   first 5); random tower records can no longer take a floor the calendar gives to a named NPC; notable hunters
   have full unique names; one-of-a-kind events happen once (`src/data/events/index.js`), repeats are capped at 3
   with 8 years between; events check the life they land in (rent, marriage, kindergarten order).
   `test/coherence.test.mjs` guards all of it. Known and left: the sim bot now works from 18 and so carries no
   debt, which lifts its mind row above target (bot habit, not retuned: mind row reads 81 normal / 86 careful against a 40–75 target).
   Second pass: `src/data/events/life.js` adds 24 adult events that check marriage, children, home and job
   (distinct stories a life 108→129, longest quiet stretch back to 2 years). Lesson: their stat rewards had to be
   cut to 0.2, because +0.5 charm a few times lifted every bot over the promotion stat gates (civilian income
   +32%). Money now shows as ฿ (₿ read as Bitcoin).
4. ~~Gate scenes repeat~~ now 8 themes (spec §15), each with its own backdrop from `place-art.js`; 5 new bosses
   borrow art (rows mon-32..36 in `art/requests.json`). Offers never list the same gate twice.
5. **Heir childhood repeats the parent's.** Weight down events the family line has already seen.
6. **Career-chain finales assume the hero.** Make finales depend on rank, fame and debt.
7. **Art.** 14 borrowed sprites in `art/requests.json`. The owner may send pictures; process them with
   `tools/skills/create-game-assets`.
8. Waiting on the owner: the long-life (eras) system, and publishing a public link (itch.io or GitHub Pages).

## PixelFX and story monster quartet

Uploaded MIT PixelFX skill installed at `tools/skills/pixelfx`; render/check tools under
`vendor/pixelfx`. Four story monsters now have unique original sprites. Review the newest
Claude brief before adding effects: bounded overlaps, low glow, calm-mode suppression,
explicit source facing; never replace the game's own characters with library stock actors.
