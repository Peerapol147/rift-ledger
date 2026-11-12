# Working on Rift Ledger (for every coding agent: Codex, Claude, others)

Rift Ledger is a Thai text life-sim in a hunter/gate world. Design: `docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`.
Code agent (Claude) owns the game itself: `src/core/`, `src/data/`, `test/`, `tools/`, `docs/`.
**Codex owns how it looks and feels:** `art/` and the art lines named below, and the screen: `src/ui/`,
`src/index.html`, `src/stage.js`, `src/place-art.js`, `src/weather-art.js`, `src/hero-art.js`, `src/monster-art.js`.

## Branches and pull requests
- Never push to `main`. Work on your own branch: art work on `codex/art-<topic>`, code work on `claude/<topic>`.
- Open a pull request into the current development branch named in the newest open PR, or into `main` if none.
- Branch names: screen work on `codex/ui-<topic>`.
- Keep each PR to one topic. A PR is ready when `npm test` and `node tools/artcheck.mjs` pass (CI runs both).

## The art contract
- **Start with `art/BRIEF.md`**: the full brief (world, style guide, every open request described, working method).
- **Where art requests live:** `art/requests.json`. Each row: `id`, `type`, `name` (Thai in-game name), `folder`,
  `size` [w, h], `fly` (hovers), `now` (the picture it borrows today), `status` (`open` or `done`).
- **To fulfil a monster request:**
  1. Draw an original transparent PNG, square, 56x56 (bosses may be 64x64), pixel art matching the existing sprites in
     `art/monsters/` (dark outline, limited palette, readable silhouette at 1x, facing left toward the hero).
  2. Save it as `art/monsters/<folder>/<english-kebab-name>.png`.
  3. In `src/data/monsters.js`, change only that monster's line from `as("<old>", ...)` to
     `own("<folder>/<english-kebab-name>", "<folder>"[, 1 if it flies])`. Touch nothing else in `src/`.
  4. Set the row's `status` to `"done"` in `art/requests.json`.
  5. Run `node tools/artcheck.mjs` and `npm test`; both must pass.
- New art the code needs is added as new `open` rows by the code agent. Do not invent rows for code that does not exist.
- Never copy a specific game's or manhwa's sprites, characters or logos. Note the tool and prompt used in `art/README.md`.
- Effects are code (`src/fx/rift/`, pixelfx style), not images; ask in a PR comment if you want one changed.

## The screen contract (UX/UI)
- **Start with `src/ui/BRIEF.md`**: what the screen must do (spec §11), what is known to be wrong, how to check it.
- **Where screen requests live:** `src/ui/requests.json`. Each row: `id`, `area`, `problem` (what a player sees),
  `want` (what they should see instead), `status` (`open` or `done`). Either agent adds `open` rows; Codex closes them.
- **The line between us:** the screen reads the game through `src/core/index.js` and shows it. It never changes a
  rule, a number, an event's text or what is hidden. If the screen needs something the game does not offer (a new
  value to show, a flag, different wording in an event), add an `open` row with `area: "core"` and the code agent
  does it. The code agent, in turn, does not restyle or rearrange the screen: it adds a row.
- **Secrets stay secret (spec §11.1):** never label a class, quest, option or ceiling as secret or rare beyond what
  `C.eventKind` and `C.optionView` already return; hidden options stay out of the page entirely.
- **A screen PR is ready when:** `npm test` passes, `npm run build` works, and you have played from the start screen
  to age 18 at 1280×800 and at 390×844 with no console error and no sideways scroll. Do not commit `play.html`:
  the code agent rebuilds it after merging, so two branches never fight over a 3 MB file.

## Checks
- `npm test` — core tests. `node tools/artcheck.mjs` — art contract. `npm run build` — rebuilds `play.html` (code agent does this).
