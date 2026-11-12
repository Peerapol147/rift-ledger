# Art brief completion — 2026-11-13

The approved request queue is complete on `codex/art-brief-completion`: waterless fish (previous commit), five spirits and five bosses. No new requests were invented. See `monsters/brief-completion-preview.png` and provenance in `README.md`.

## Renderer integration required before shipping

As directed by `AGENTS.md`, this batch changes only the affected art mappings in `src/data/monsters.js`; it does not edit Claude's renderer or rebuild tracked `play.html`. The earlier waterless-fish commit on this branch already contains that one fish's import and registry entry.

`src/monster-art.js` maintains a separate static `ART` registry. Thirteen owned sprites are absent: the previously merged ship-eating vine, container crab and sky-lure bird, plus the ten new sprites in this batch. The current renderer returns null for those names even though artcheck and the build pass. The request statuses describe completion of the art contract, not completion of runtime integration.

A ready-to-apply patch is supplied as `art/renderer-registration.patch`. It adds only the thirteen imports and matching `ART` entries. From the repository root:

```bash
git apply --check art/renderer-registration.patch
git apply art/renderer-registration.patch
npm test
node tools/artcheck.mjs
npm run build
```

Review the patch before applying; if the registry changed meanwhile, adapt the same keys instead of applying blindly. The patch was checked against this branch and applied only in an ignored preview copy for validation.

## Validation performed

- Artcheck was observed failing when a spirit and boss request were marked done while still borrowing; request metadata was restored before production.
- Every new sprite was generated, inspected at native/4× scale, refined, exported and inspected again. Ten PNGs: 56×56 spirits, 64×64 bosses; binary alpha, 11–13 opaque colours, left-facing, hovering or grounded as requested.
- Grounded bosses finish at y=61 on the 64×64 canvas; airborne figures leave clear bottom rows. No PNG contains an opaque background.
- Spirit batch: `art ok · 5 open request(s)`; 198 tests passed, zero failures/skips.
- Boss/final batch: `art ok · 0 open request(s)`; 198 tests passed, zero failures/skips.
- Current build passes in an ignored copy (2947 KB JS, 69 effects), but does not embed the thirteen missing registry assets.
- Proposed registration patch: applies cleanly and builds in the ignored copy (2986 KB JS, 69 effects). Chromium checks all thirteen rasters, expected dimensions/fly/boss flags and CSS portraits without page errors; visually inspected on native-size 256×144 stage panels.
- No gameplay, UI layout, effects or tracked generated files were changed in the two new art batches.

## Review/publication

Work is committed and intended for an art PR, with Claude reviewing integration and the owner merging. GitHub API access was blocked by the environment proxy at the last check; Git HTTPS access works. A draft domain addition for `api.github.com` was saved in the prior turn but has not been applied to this runtime. Do not treat a comparison link as an opened PR.
