# Handoff for the next session

Read `CLAUDE.md`, `AGENTS.md` and this file before working. The binding design is
`docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`.

## Original improvement roadmap — owner emphasized story (13 November 2026)

Start with [the Compare and evidence](research/rift-ledger-vs-way-of-xian.md), then
[the Claude roadmap](superpowers/plans/2026-11-13-improvement-roadmap.md).
The four detailed plans cover trust, readable decisions, **original narrative continuity**,
and validation. Story audit starts alongside UX work; civilian and hunter pilots plus
public heir memories are required. Do not copy reference-game code, plots, art or formulas.
This branch contains documentation only relative to 98e5332; plans are not implemented.
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
4. **Gate scenes repeat.** `src/data/gates.js` has only 3 maps; add more, tied to rank.
5. **Heir childhood repeats the parent's.** Weight down events the family line has already seen.
6. **Career-chain finales assume the hero.** Make finales depend on rank, fame and debt.
7. **Art.** 14 borrowed sprites in `art/requests.json`. The owner may send pictures; process them with
   `tools/skills/create-game-assets`.
8. Waiting on the owner: the long-life (eras) system, and publishing a public link (itch.io or GitHub Pages).
