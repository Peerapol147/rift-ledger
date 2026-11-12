# Original character animation family

Created with OpenAI image_gen using this repository's existing `art/professions/*.png` and
`art/civilian-ages/*.png` as visual references. No competing game's art was used.
The owner requested a complete redo matching the original style, including female characters.
Source atlases are preserved in `sources/`; generation prompts (first seed summarized) and reference paths are in
`generation.json`. Original reference files remain unchanged.

68 identities: eight ages, 15 classes, 11 career costumes, each male and female.
The two doctor careers share a costume. Each identity contains four distinct idle frames.
Infants have sparse hair and swaddles, toddlers yellow play clothes, children green tops,
teens blue overshirts, adults olive jackets; old civilians have gray hair/canes.
Professions preserve original costume palette, equipment and role silhouette.

Technical contract: 256×64 transparent strips, four 64×64 cells, fixed baseline at y=60,
common scale across each sequence, at most 48 colors, binary alpha, nearest-neighbor display.
Small original hand/tool gestures replace runtime body distortion and whole-image rotation.
The original age height curve still determines body size on the stage.

Reproduce normalization: `python tools/normalize-character-sheets.py` (ImageMagick and Pillow required).
Verify raster fit: `python tools/check-character-sheets.py` (Pillow, read-only inspection).
`manifest.json` records output and source row. `src/character-sheets.gen.js` is generated.
`contact-sheet.png` is the first-frame review board, not a source texture.

Visual decision delegated by owner: retain original muted/dark-outline pixel family, use
separate feminine face/hair designs with practical full armor/uniforms; no competing art.
Generated art still requires native-scale and in-game review when changing it. Passing a
coverage test alone does not certify animation quality. Do not distort parts to repair frames.
