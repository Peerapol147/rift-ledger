# Responsive UX and character frames

Branch: `claude/responsive-ui`, based on comparison/planning commit `da275a7`.
The owner assigned this UI implementation to Codex after requesting the Claude roadmap.

## Shipped behavior

- Choices commit on completed activation. Cancelled touches and scroll gestures do not choose; a press is bound to the event shown when it began.
- Settings contain keyboard focus, isolate background shortcuts, preserve import drafts, and restore focus on close. Feedback is visible above the modal.
- Inventory actions refresh immediately without losing input focus/caret. Search updates while typing; the bulk-sale cutoff remains consistent with the selected value.
- Character, inventory, team, work and expanded monthly-plan views pause automatic time. An explicit return-to-life action resumes play.
- Monthly planning is accessible above the main content on mobile. Choices precede the scene; mobile controls have larger targets and the music button is in the header.
- Unsupported 16× control removed. Reduced-motion preference is respected. Ending/start overlays remain above mobile navigation.
- Original dossier frames use existing project character sprites, new CSS ornament and inline vector insignia. Occupations have distinct colors/symbols; visible hunter ranks determine decoration. Hidden rank and potential do not determine frame styling.
- Ages 0–11 months use the project's existing swaddled infant art in the scene and portrait. Ages 12–35 months use toddler art; older children use the existing child assets. No life simulation or story progression rules changed.
- The earlier 1×/Stop default migration and embedded Shadow's Resolve music remain included.

## Evidence

`npm test`: 201 passed. `node tools/artcheck.mjs`: passed, with 11 pre-existing open art requests.
`node tools/linelen.mjs` and `npm run build`: passed.

`node tools/ux-regression.mjs`: 10 Chromium browser scenarios passed, including native Space activation, modal isolation, cancelled touch, inventory refresh, draft preservation, mobile planning, reading pause/search focus, 320px large type, bulk-sale cutoff and ending-overlay hit testing. Serve the repository on port 5183 first, or set `UX_URL`; set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` for another environment.

Independent review caught two regressions: sale-cutoff visual/state mismatch and ending-overlay stacking. Both received failing regression cases before fixes and now pass. A follow-up review decoded 37 age/class/career portraits successfully; its age-model mismatch was resolved by sharing the scene’s civilian-art selection. Screenshots were inspected at desktop and mobile sizes. This is Chromium coverage, not a claim of testing every browser or physical device.

## Decisions and remaining Claude work

Implement the UI subset of A1/A2/B1 now; keep save-schema/integrity changes and narrative phase C separate. The cost is that this release does not resolve the previously documented persistence and story defects. Follow the existing comparison and detailed roadmap rather than marking whole phases complete.

Reuse existing original sprites and code-native infant art with newly designed frames. The cost is that characters retain the project's existing pixel-art resolution; no new painted portrait set was commissioned.

Reference-game findings informed readable action placement and feedback principles only. No reference code, sprites, plots or formulas were added. Raw HAR material stays outside Git.
