# Animation rebuild

Owner rejected procedural region displacement, whole-image rotation and code-drawn infant style. Use Superpowers systematic-debugging + create-game-assets pipeline. Owner delegated visual decisions.

Root cause: geometric row/region cuts do not follow joints; CSS rotation changes pixel-grid alignment; code-native infant style differs from original raster family.

Implementation: generate original four-frame sprite sequences using existing assets as references; preserve palette, costume, facing and scale. All ages, classes and occupations use shared frame playback in stage and portrait. Normalize sheets into fixed cells with stable baselines. No per-region runtime distortion or CSS rotation. Reduced-motion and busy stage select rest frame. Keep audio/defaults/save rules unchanged.

Tasks: generation and contact-sheet review; deterministic sheet slicing/metadata; shared frame playback; integration; browser visual checks, core/art/build/package; Claude handoff and push. Test source/frame dimensions, complete identity coverage, deterministic bounded frame selection, stable pivot, reduced-motion, and music regression. Artistic judgement requires inspecting actual frames, not just passing tests.

Execution record:
- Confirmed existing own branch claude/responsive-ui; owner authorized code/UI edits and push.
- Ruling: owner delegated visual selection; selected original-reference pixel family with separate
  female identities. Cost if wrong: visual revision, not save/schema changes.
- 17 source atlases generated with image_gen; 68 sequences, 272 frames, both sexes throughout.
- Identity/playback tests observed RED (missing module), then GREEN after shared selection logic.
- Deterministic normalization via ImageMagick; read-only alpha/margin/baseline/frame QA passed 68/68.
- Removed region-motion renderer and CSS rotation; preserved audio/default settings and combat FX.
- Technical review includes full female routing, young-age precedence, reduced-motion, stable
  atlas sampling and monthly refresh continuity. Native visual review required separately.

- Final independent review: no outstanding Critical/Important. Foot drift issue reproduced by
  stricter QA (29 failing sequences), fixed by actual alpha foot-centroid anchoring; 68/68 pass,
  maximum measured horizontal drift 1.86 px. This was a whole-frame alignment fix, not deformation.
- Two review documentation notes resolved as part of required Claude handoff accuracy: mark old
  art instructions superseded and list Pillow normalization dependency. No runtime changes.
- Declined scope: physical speaker output cannot be certified in headless tests; playback time
  is verified. Story/gameplay redesign remains in Claude roadmap. Artistic preference remains
  the owner's judgement. Cross-version ImageMagick byte-identical output is not promised;
  source and operations are preserved, validated on current installed tools.
- Verification: 208 core tests; 68 read-only raster checks; 68 browser PNG decode/frame/freeze
  checks; all female/male age/class/career portraits and audio regression; 10 UX scenarios;
  stale audio promise and portrait phase continuity; artcheck, line-length, build, ZIP equality.
  UX first run had one 80ms visibility timing failure; full rerun passed without code changes.
