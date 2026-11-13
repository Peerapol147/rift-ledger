# Hunter interface implementation plan

> Use superpowers:executing-plans for inline implementation and a fresh whole-branch review at the end.

**Goal:** Implement the owner-approved Hunter desktop/mobile concept as functional game UI.
**Architecture:** Keep core and canvas simulation unchanged; split presentation chrome/plan/navigation renderers from existing event/card rendering. Embed CSS and original image locally through the existing build.
**Tech stack:** JavaScript modules, HTML/CSS, esbuild, node:test, Playwright/Chromium.
**Spec:** ../specs/2026-11-14-hunter-interface-design.md

## Global constraints

Thai UI; actual live state; no secret disclosure; offline single HTML download; retain event handlers, touch/keyboard/save behavior; mobile 320px and large text; no core rule changes.

## Review focus

- Open plan/More disclosures survive redraw and remain keyboard reachable (T1/T3).
- Child/elderly/hunter/operation state and long names do not break layout (T1/T3).
- Active story context contains discovered history only, with escaped names (T1).
- Mobile navigation reaches all existing visible tabs without horizontal scrolling (T1/T3).
- New backdrop does not hide weather, sprites, enemies or effects (T2/T3).

### Task 1: Functional shell and renderers

Files: src/ui/layout.js, src/ui/hunter.js, src/ui/main.js, src/index.html; test/hunter-ui.test.mjs.
Consumes existing core, DOM helpers and data. Produces header(s,ui), planPanel(s), status(s,ui), tabs(s,cur) and updated real event presentation.
- [x] Write meaningful failing renderer tests for status precedence, actual main/secondary plans, complete age-filtered navigation, escaped live names and discovered story title.
- [x] Run targeted test RED.
- [x] Implement shell/renderers and wire state/actions, retaining old action IDs.
- [x] Run targeted and complete unit suite GREEN.

### Task 2: Hunter visual design and original scene art

Files: src/index.html, src/hunter.css, src/hunter-city-art.js, src/stage.js, art/ui/hunter-city.png, art/README.md; build.mjs.
- [x] Create original city backdrop using image generation; document tool/prompt.
- [x] Implement responsive blue/violet theme, typography, panels, menus, header, plan strip and five-place mobile navigation.
- [x] Embed style in HTML build; embed backdrop through esbuild; retain live city sprites, all other scene variants and fallbacks.
- [x] Build, artcheck, full tests; inspect desktop/mobile screenshots.

### Task 3: Browser validation and review

Files: tools/hunter-ui-check.mjs, tools/ux-check.mjs selector updates only where layout moved; docs evidence/screenshots.
- [x] Browser checks for mobile plan proximity, active state, disclosures/redraw, all tabs, real choice outcome, modal/input keyboard and 320px/large fonts.
- [x] Run existing UX tests via local HTTP/system Chromium when file access is unavailable.
- [x] Fix demonstrated failures and rerun affected checks and whole suite.
- [ ] Fresh independent review, then one verified fix pass for important findings.
- [ ] Commit functional UI, generated play.html and ZIP; push isolated feature branch and attempt PR. Do not merge or deploy.
