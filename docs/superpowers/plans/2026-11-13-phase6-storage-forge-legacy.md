# Phase 6: Storage, Forge, Legacy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close the remaining first-round gaps in the spec: places to keep items (§9.2), upgrading gear at a smith (§9.1), and a legacy record at death (§6.9). Also ship the Phase 5 leftover: a hidden rank exposed at a gate break.

**Spec:** §6.6, §6.9, §9.1, §9.2, §11.1.

## Global Constraints
- Determinism (seeded streams only), the 120-character limit, and plain-JSON state, as before.
- Old saves without the new fields (`s.store`, `s.enemies`, item `plus`) must load and play.
- Item text shown in HTML goes through `esc()`.

## Task 1: Storage locations
- `src/core/storage.js`: `s.store = { home: [], vault: [], vaultCountry }`.
- Home: capacity 30, follows you. Moving country costs ₿40 per stored item (`ค่าขนของย้ายประเทศ`).
- Bank vault: capacity 40, bound to the country where it was first filled. Rent is ₿150 a month while it holds anything (`books`).
- `stash(s, uid, where)` and `take(s, uid, where)`. Equipped items cannot be stashed. Taking out needs bag room. The vault is only reachable in its country.
- UI: a "ที่เก็บของ" section in the items tab.
- Tests: stash and take round-trip, equipped items blocked, vault country lock, rent charged.

Guild lockers wait for a guild system. Repair is left out because items have no durability.

## Task 2: Forge
- `src/core/forge.js`: `+1..+5` on gear (`plus` on the item instance).
- Each plus adds 10% of the item's base stats, in `gearHooks` and in `compare`.
- Cost is `price × 0.4 × (plus+1)`, 30% off with `ownForge`. Odds are `1 − plus × 0.15`. A failure only loses the fee.
- UI: a "ตีบวก" button with the cost and odds. The name shows `+n`.
- Tests: success raises stats, the cap is +5, and cost and odds follow the formulas.

## Task 3: Legacy and the Phase 5 leftover
- `src/core/legacy.js`:
  - `addEnemy(s, name, why)` is called by party betrayal and teammate betrayal.
  - `legacyOf(s) -> { kids, assets, enemies }`. Assets are gold plus half the value of every item in the bag and the stores.
- The death screen shows children, assets and enemies.
- The collection store keeps the last life's legacy (`setLegacy`) for the later play-as-your-child phase.
- Gate-break call: helping while the rank is hidden reveals it and costs association standing 5 (`act: "breakHelp"`).
- Tests: enemies are recorded, the legacy totals add up, and exposure clears the flag and costs standing.
