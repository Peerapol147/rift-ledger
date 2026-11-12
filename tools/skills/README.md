# Game-dev skills (vendored)

Selected skills from *awesome-gamedev-agent-skills* (Apache-2.0, see `LICENSE` and `NOTICE`), copied unchanged
except that per-agent `agents/` configs were dropped. Only the ones that fit this game (a browser text life-sim with
pixel art, no engine) are kept.

| Skill | Use it for |
|---|---|
| `create-game-assets` | Any new sprite: art direction, then `scripts/asset_report.py --expect-size 56x56 --require-alpha --max-colors 48` and `scripts/build_preview_sheet.py` for a contact sheet. Needs Pillow. |
| `procedural-gen` | Content made from rules instead of by hand (eras, long lives) |
| `rpg`, `roguelike` | Classes, skills, items, loot and replay value |
| `game-ui-ux`, `game-feel` | Screens, readability, feedback |
| `save-systems` | Save versioning and migration |
| `itch-publish` | Publishing `play.html` as a web game |

Agents read the matching `SKILL.md` before starting work in that area.
