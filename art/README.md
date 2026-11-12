Original code-native pixel art, authored for Rift Ledger. No stock pixels copied. Source: src/hero-art.js. Shared 20px grid width, dark outline, warm skin palette. Age stages: <3 infant, <13 child, <18 teen, <60 adult, 60+ elder. Active career variants: doc, smith, cop. All preview samples validated for row width and palette coverage.

Weather: original procedural pixel art in src/weather-art.js; normal, winter, summer, sunny, rainy (adds the pixelfx rain ambient). Seasons follow the calendar in multi-month blocks (hot Mar-May, wet Jun-Oct, cool Nov-Feb); home, city and street each have their own look per season, and one roll per season per year can give an off year. Outdoor scenes only; no gameplay stat effects.

Cook (cook): original chef hat, teal apron and steel pan; shared age variants and palette.

Place scenery (src/place-art.js): original procedural pixel layers added over the old backdrops, never replacing them. Each of the 8 travel places (z_bridge … z_campus) and each of the 14 stage scenes has up to four depth layers (far, mid, near, front) on a 512px wrapping strip. stage.js scrolls them at different speeds during a trip (place change), dips the picture dark at the midpoint and floats the new place name. New place: add one function to ART keyed by the PLACES id.

Monster art (art/monsters): 23 original transparent pixel sprites generated in PixelLab on 2026-11-11, using the existing shade-class sprite as a style reference. Sixteen cover the standard monster roster and first four bosses; seven additional sprites cover the remaining story bosses except the disembodied broadcast voice. The other place-specific names are mapped to their closest creature silhouette and tinted by name. Source prompts and mapping live in src/monster-art.js. Imported images are bundled into play.html as data URLs; no runtime network request is made. Generation provenance: PixelLab MCP, Pixen model for seven individual bosses and 1-direction object batch for sixteen roster sprites. Terms: https://pixellab.ai/termsofservice .

### Drowned Tower trio — 2026-11-12

Original designs generated with OpenAI `image_gen` using `art/monsters/contact-sheet.png` as the style reference, then refined in a second image-generation pass. Shared prompt: transparent three-cell sheet, left-facing three-quarter view, eerie original dark fantasy creatures, top-left light, near-black tinted outline, limited stepped palette, no text, no ground shadow, no franchise designs. Reviewed each sprite beside existing references at native scale and enlarged scale in two rounds. PNG export used Pillow: isolated each cell, nearest-neighbour sampling onto a 56×56 canvas, 14 opaque colours, binary alpha (0/255), grounded feet at y=53 and hovering bird ending at y=47. The vine uses a curated olive/bone/wood palette to retain readable barnacles; all image generation and refinement used `image_gen`.

- `beast/ship-eating-vine.png` — OpenAI `image_gen`, 2026-11-12. Prompt: “A crawling knot of thick kelp-green and wet-olive seaweed vines, wide left-facing maw of curled tendrils with sick yellow-green glow, barnacles and a trapped broken ship plank.” Refinement: brighter separated olive highlights, thicker tendrils, clear glowing maw, three readable pale barnacles and one broken plank; preserve the original design and transparent background.
- `beast/container-crab.png` — OpenAI `image_gen`, 2026-11-12. Prompt: “A crab with a dented faded-blue corrugated shipping container shell, rust-orange stripes, grey steel corner hardware, tiny glowing eyes in an ajar left-facing door, one huge rust-orange claw reaching left and spindly grounded legs.” Refinement: simplify fine rust into broad bands and legs into chunky joints, keeping the large claw and door-gap eyes readable at 56×56.
- `beast/sky-lure-bird.png` — OpenAI `image_gen`, 2026-11-12. Prompt: “A hovering gaunt long-necked wading bird, pale grey-white body, charcoal wingtips, half-spread wings, dangling legs clear of the bottom, long beak pointing left and an inflated sky-blue luminous throat sac like a false patch of sky.” Refinement: broad stepped wing shading, less feather noise, preserve the gaunt neck, clear cyan throat focal point and airborne silhouette.

### Historical, superseded: young characters and procedural motion — 2026-11-13

The owner rejected this approach; the animation rebuild below replaces its stage/portrait render paths. Retained code art is a loading fallback only.

Original code-authored pixel rows in `src/hero-art.js`: round sparse-haired infant with a tiny tuft and swaddled body; short-haired toddler in a romper. User direction: “small and mischievous, with movement; every age and class should move.” Tool: JavaScript source authoring, no copied reference pixels or generated raster assets. Shared portrait/stage source. `src/character-motion.js` supplies original age/class/career gestures; stage uses small pixel-region offsets and portraits use CSS motion. Reduced-motion is respected. This supersedes the historical <3 infant description at the top of this file: infant is <1, toddler is 1–<3.

Character animation rebuild: see [animation/README.md](animation/README.md).
68 original reference-based image_gen strips, both sexes, with prompts/source atlases preserved.

### Story quartet — 2026-11-13

OpenAI image_gen, original existing-game references; two generation/review rounds. First draft
lost clarity at 56px, especially the pier shadow; refined to stronger cyan edge and simpler prop
silhouettes. Exact prompts and sources: `monsters/source-atlases/story-quartet.json`.
ImageMagick crops/resizes/quantizes to 56×56, max14 colors, binary alpha; no procedural monster drawing.
All four hover, face left, retain transparent margins. Viewed at native size, 4x and in stage combat.

- `beast/waterless-fish`: cracked dusty-teal fish, salt crust, gasping dark gills, dead-white eye.
- `spirit/pier-shadow`: inverted drowned silhouette, flowing hair/fingers, cyan edge and pale eyes.
- `spirit/last-passenger`: faceless commuter, briefcase, hanging train strap, fluorescent green edge.
- `spirit/teacher-still-teaching`: cardigan ghost, chalk and pointer, lecture frozen mid-sentence.

Effect integration uses existing MIT PixelFX claw-swipe/blunt-hit with restrained palette/glow;
source effects are unchanged. Installed skill and tools are documented in `tools/skills/README.md`.
