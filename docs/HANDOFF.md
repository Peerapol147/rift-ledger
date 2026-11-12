# Handoff for the next session

Read `CLAUDE.md`, `AGENTS.md` and this file before working. The binding design is
`docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`.

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
- Before merging: `npm test`, `node tools/linelen.mjs`, `node tools/sim.mjs 1000 --policy careful|normal|reckless`,
  `node tools/playtest.mjs 200`, `npm run build`, and commit `play.html`.
- Call an independent reviewer subagent only for big system changes. Content goes through tests, sims and the
  playtest instead.
- Balance: never tune to one seed set. Use `--seed a..e` and report the spread (see the backlog).
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
1. **Balance on many seeds.** Make sim report the mean and spread over several `--seed` sets, and run that in CI.
   Known: the awakening rate drifts to about 28% on some sets, normal-policy ceiling reach averages about 56%, and
   F–E income is slightly high. Fix causes; never move targets without a game reason.
2. **Check that retreating from a boss can actually happen** (a retreat below 35% hp). Bosses may kill in one hit.
3. **Money as choices, not automatic taxes.** People die with about 120k. Add things worth buying (house, training,
   a child's education, a legacy), and measure that frugal play is not over-rewarded.
4. **Gate scenes repeat.** `src/data/gates.js` has only 3 maps; add more, tied to rank.
5. **Heir childhood repeats the parent's.** Weight down events the family line has already seen.
6. **Career-chain finales assume the hero.** Make finales depend on rank, fame and debt.
7. **Art.** 14 borrowed sprites in `art/requests.json`. The owner may send pictures; process them with
   `tools/skills/create-game-assets`.
8. Waiting on the owner: the long-life (eras) system, and publishing a public link (itch.io or GitHub Pages).
