Read `AGENTS.md` first: it is the shared contract with the art agent (Codex). Art requests go in `art/requests.json`;
when code needs new pictures, add `open` rows there instead of drawing them. After merging an art PR, run
`npm run build` and commit `play.html`.

Before continuing this project, read `docs/HANDOFF.md` and
`docs/CLAUDE-NEXT-BRIEF.md`. They record the owner's latest priorities, shipped UI work,
remaining save/story work, and acceptance checks. Reconcile the actual branch before implementing;
do not redo completed work or treat roadmap checkboxes as proof that code shipped.

Before work on art, content generation, items/classes, UI, saves or publishing, read the matching skill in
`tools/skills/` (see its README). Art checks: `tools/skills/create-game-assets/scripts/asset_report.py`.
