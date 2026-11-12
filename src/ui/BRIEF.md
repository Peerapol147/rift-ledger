# The screen: brief for Codex (UX/UI)

Rift Ledger is a Thai text life-sim: you are born, time moves month by month, choices pop up, you die. The binding
design is `docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`; **§11 is yours**. The owner is
Thai-speaking and not a programmer; their words on the current screen: "confusing from the very first minute".

## What you own, and what you do not
See `AGENTS.md` (the screen contract). In short: everything the player sees and touches is yours; the rules, the
numbers and the story text are not. Ask through `src/ui/requests.json` (`area: "core"`).

## What the screen must do (spec §11, shortened)
- Layout: character card left, month plan under it, scene and time controls centre, event and choices right,
  tabs below (log, me, items, team, work and money, world, collection). Phone: everything works, portrait, tabs
  as a bottom bar.
- Show systems as they start to matter: a child sees stats and family; work, team and class appear when used.
- Tell plainly what the character can know (odds of an ordinary check, the stat it uses, prices). Tell nothing
  about what is hidden. A locked option shows 🔒 only when its condition is something the player already knows.
- One colour per rarity and per log tag, everywhere. Numbers right-aligned, tabular.
- Keyboard: 1–9 choose, Space pause, +/− speed, A autopilot mode.

## How to look at it
`npm ci && npm run build`, then open `play.html` (no server needed). To drive it by script, Playwright is enough:
start button `[data-a=new]`, options `[data-a^="choose:"]`, tabs `#tabs [data-a]`. The first card of a life is
the birth card (`C.openBirth`), then infancy has no month plan until age 3.

## Known problems
The open rows in `src/ui/requests.json`. They come from playing the built game at 1280×800 and 390×844; nothing
there is a guess, and the list is not complete: play it yourself first and add what you find.
