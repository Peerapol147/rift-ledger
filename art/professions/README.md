# Profession sprite family

22 civilian careers and 90 hunter classes, catalogued from src/data.js. Generated with the built-in image_gen tool as ten coherent atlases; approved art/shade/shade-generated.png used as the shared visual reference. Prompt system: same black-haired adult protagonist, manhwa-inspired pixel rendering, dark outlines and readable face, 3/4 right-facing stance, full boots, role-specific costume/tool/weapon and accent palette, transparent background, no baked aura. Row-major atlas positions follow catalog.json: careers then classes, twelve entries per atlas.

Source PNGs preserved alongside individually cropped sprites. Normalized proportionally to 56px using area filtering and alpha threshold; no palette truncation or body slicing. Runtime uses profession IDs and existing age-height rules. The approved original shade raster remains in use for shade. Childhood stays civilian. Effects use existing pixelfx, independently of sprite art.
