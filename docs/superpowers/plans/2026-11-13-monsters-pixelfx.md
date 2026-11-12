# Story monsters and restrained PixelFX

Use Superpowers writing-plans / executing-plans, create-game-assets and uploaded PixelFX skill.
Owner approved monster work and effects code. Continue own development branch without merging main.
Reference the competing game's readability only; retain original Rift Ledger world/art.

1. Install unchanged MIT PixelFX skill in tools/skills/pixelfx and its render/check tools in
   vendor/pixelfx. Verify uploaded core/effects match current vendor before retaining current runtime.
2. Make four approved art requests: waterless-fish (beast), pier-shadow, last-passenger,
   teacher-still-teaching (spirit). Match flying-fish / old-house-owner / ship-eating-vine.
   Transparent 56x56, left-facing, 14-color maximum, hover centered, no floor shadow.
   Fail artcheck with one premature done status, restore, generate, normalize, inspect twice.
3. Effects: keep attacks readable with one main effect, no new permanent monster aura.
   Cap short-lived effects, reduce glow, use physical beast vs spectral spirit strike palettes.
   Render uploaded candidates before selection; keep reduced-motion behavior and damage unchanged.
4. Verify art/core/effect budget tests, native contact sheet and browser combat.
   Update Claude brief/provenance, build and ZIP, push own branch. Independent final review.

Execution / decisions:
- Continued authorized code/art integration on claude/responsive-ui (not main).
- PixelFX v0.3.1 uploaded archive SHA256:
  31538a63057adc202964490f24df84491281c86662d80b6aafeb9706903b508c.
  Skill cmp and recursive runtime src diff both match upload; retained runtime avoids needless replacement.
- Artcheck observed RED on premature mon-9 done, restored immediately. Four completed sprites pass
  56x56/alpha/max14-colors; two image_gen rounds, inspected native/4x/in combat.
- FX budget tests RED missing module then GREEN (2); vendor check2/2 with no warnings.
- Ruling: new source PNGs face left, legacy PNGs keep prior flip; explicit orientation prevents regression.
  Cost if wrong: a creature faces away visually, no gameplay/save change.
- Final reviewer found duplicate critical impact still enabled. Browser stage-probe regression observed
  RED, removed extra spawn; re-ran same browser test plus core/art/build/package.
- Review note: preview captures must let previous victory smoke expire. Harness now waits before
  the next fight. Local .agents installation remains untracked and excluded from commit/ZIP.
- Scope: no claim about external-game art identity or physical sound output. Four requests completed,
  seven remain for future approved batches; story/balance rules unchanged.
- Final verification: core210/210; artcheck7 pending; selected vendor effects2/2; raster4/4;
  browser four combats and critical regression GREEN; line-length/diff checks; build and ZIP equality pass.
