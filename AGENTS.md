# Working on Rift Ledger (for every coding agent: Codex, Claude, others)

Rift Ledger is a Thai text life-sim in a hunter/gate world. Design: `docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`.
Code agent (Claude) owns `src/`, `test/`, `tools/`, `docs/`. **Art agent (Codex) owns `art/`** and the art lines named below.

## Branches and pull requests
- Never push to `main`. Work on your own branch: art work on `codex/art-<topic>`, code work on `claude/<topic>`.
- Open a pull request into the current development branch named in the newest open PR, or into `main` if none.
- Keep each PR to one topic. A PR is ready when `npm test` and `node tools/artcheck.mjs` pass (CI runs both).

## The art contract
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

## Checks
- `npm test` — core tests. `node tools/artcheck.mjs` — art contract. `npm run build` — rebuilds `play.html` (code agent does this).
