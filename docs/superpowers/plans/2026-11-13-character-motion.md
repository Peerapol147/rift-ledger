# Character Motion and Music Recovery Implementation Plan

> Use superpowers:executing-plans for inline execution. Owner explicitly delegated motion design; do not stop for another design approval.

**Goal:** Every age and class feels alive, infants look young, and music starts from one explicit tap.
**Architecture:** Original procedural pixel animation on existing sprites. A pure motion catalog selects by public age/class/job only; the stage deforms head, arms and upper body with feet grounded. Portraits use gentler whole-image motion. No simulation state, RNG, save schema or reference assets change.
**Tech Stack:** JavaScript, Canvas pixel renderer, CSS, Node tests, Chromium.

## Design decisions

Infant: bare rounded scalp with tiny tuft, small swaddled body, gentle wiggle. Toddler: sparse hair, short romper, short side steps and bounces. Child: curious glance and fidget. Teen: energetic weight shifts. Adult: breathing and head turn. Middle age: slower shoulder shift. Elder: gentle lean. Old: restrained movement around a planted stance.

Hunter motifs: Knight checks guard; Shield Bearer braces shield; Swordsman loosens sword arm; Fire Mage gathers flame; Archer checks bow arm; Healer presents a blessing; Trapper bends to inspect; Sharpshooter steadies aim; Blacksmith taps tool; Appraiser examines an object; Barrier Maker traces a seal; Magic Swordsman balances blade and casting hand; Necromancer beckons; Saint opens hands; Abyss Sovereign commands slowly. These are stylized pixel poses, not new skeletal animation or combat skills.

Civilian motifs: clerk notes, trader gestures, doctor checks, porter adjusts weight, reporter notes, officer scans, teacher points, lawyer explains, adjuster examines, rescuer checks readiness, cook stirs. The two medical jobs share their existing sprite and gesture.

Movement amplitude is small; combat and travel suppress idle gestures. Reduced-motion freezes added movement. Public occupation drives gestures; secret potential does not.

## Tasks and acceptance

- [x] Sparse-haired young code art shared by portrait/stage; boundary tests and screenshots.
- [x] Catalog and pure pose sampler: explicit coverage of all 15 class art ids and 12 careers; every life stage moves; reduced-motion/busy yield neutral pose; finite bounded offsets.
- [x] Stage pixel-region deformation and portrait motion from the same catalog. Verify class examples and all portraits load; no jitter in text or action targets.
- [x] Music: visible start-screen button, actual playback state rather than preference for toggling, explicit failure feedback, retry after denied autoplay, remembered off. Verify embedded MP3 currentTime advances after one click.
- [x] Run core/browser/art/build checks, update Claude brief with actual evidence and limits, commit/push own branch.

Review focus: renderer bounds, idle interfering with attacks, hair silhouette, reduced-motion, stale music promise, missing career mappings, portrait animation overriding infant styles.

## Verification and review outcome

205 core tests passed. Ten existing UX browser scenarios passed. New browser checks verified one-tap music after blocked autoplay, embedded MP3 time advancing, pause/stored-off, infant/toddler decode and reduced-motion, all 15 class and 12 career portrait animations, stale music rejection, and animation continuity after DOM replacement. Artcheck (11 existing open requests), linelen and build passed.

Independent review found two integration defects: monthly portrait animation restart and stale audio error feedback. Both were reproduced in `tools/motion-continuity-regression.mjs`, failed before the fix and passed afterward. No remaining blockers reported. Headless audio progression is evidence of decoding/playback, not a measurement of the user's speaker volume.

Implementation decisions: procedural pixel-region motion uses existing sprites, so poses are stylized approximations rather than hand-drawn weapon articulation. Frame animation is gentler whole-image motion. No reference assets were copied. Full narrative and persistence roadmap remains separate, as recorded in the Claude brief.
