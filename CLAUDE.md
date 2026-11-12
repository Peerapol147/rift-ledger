Read `AGENTS.md` first: it is the shared contract with Codex, who owns the art (`art/`) and the screen (`src/ui/`,
`src/index.html`, the stage and scene art files). Art requests go in `art/requests.json`, screen requests in
`src/ui/requests.json`: when the game needs a new picture or a screen change, add an `open` row instead of doing it.
After merging an art or screen PR, run `npm run build` and commit `play.html`.

Before work on art, content generation, items/classes, UI, saves or publishing, read the matching skill in
`tools/skills/` (see its README). Art checks: `tools/skills/create-game-assets/scripts/asset_report.py`.
