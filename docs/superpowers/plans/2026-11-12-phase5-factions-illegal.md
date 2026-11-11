# Phase 5: Factions, Illegal Gates, Quick Items, Year Summary — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Spec §6.3 (illegal hunting, hidden rank), §6.7 (factions), §7.1 (quick items), §11.4 (year summary).

## Global constraints
Same as phases 2–4: deterministic, Thai text, ≤120-char lines in core/data, every event keeps a free option, never reveal hidden numbers (faction standing shows as a word).

### Task 1: Factions
- `src/data/factions.js`: `FACTIONS` (assoc สมาคมฮันเตอร์, state รัฐ, church ศาสนจักร, research นักวิจัย, under องค์กรใต้ดิน) and `FAC_FROM` mapping existing counters/flags to standing changes.
- `src/core/factions.js`: `s.fac` (−100..100) at birth; outcome key `fac: { id: n }`; `FAC_FROM` applied whenever an outcome raises a mapped counter or sets a mapped flag; `val("fac:<id>")`; `facWord(v)`.
- Effects: association standing ±30 → gate pay ±10%; association ≤ −40 → one "license review" event; underground ≥ 20 → illegal gates offered.
- UI: world tab lists factions with words.
- Tests: mapping applies once per outcome; pay modifier; word never shows numbers.

### Task 2: Illegal gates and hidden rank
- `openGateChoice` adds one unregistered gate when `fac:under ≥ 20`: pay ×2, boss chance 25%, taking it: association −5, underground +3, 15% caught → fine ₿(2000×rank+1) and association −10.
- Hidden rank: fame from ops halved; association standing −5 if exposed by a gate-break hunter call.
- Tests: offer appears only with standing; caught fine via ledger.

### Task 3: Quick items and year summary
- Prep: `defaultPrep.quick` = up to 2 healing potions in the bag; during an op, below 30% hp the first potion is used once (heals its amount as % of max hp, removed from the bag).
- Year summary: on each birthday the UI shows a banner with the count of notable lines and the log tab gets a "สรุปปีที่แล้ว" block from `yearSummary`.
- Tests: potion used once and removed.
