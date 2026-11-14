# Top bar and "where · doing" line (UX closer to the model game, part 2) — short design

Date: 2026-11-14. Owner: "รวมเลย และเริ่มส่วนที่ 2" after the part list (part 2 = the place/doing line under the
scene, and a top bar with name, age, realm and life-chapter chip). Calls marked **(call)**.

## What the model game does (our words)
A slim bar at the top of the game: the name in a display font; under it age, power level (in its colour) and the
current life chapter (in gold). Over the bottom of the scene, two short lines: **where you are** (display font) and
**what you are doing now**. On phones the bar keeps the name and the speed controls on one row.

## Where we are
The left card (`layout.js card`) has country · city, name, role line and date, but on phones it sits below the
stage and event (y ≈ 440+), so a phone player does not see who and where they are while playing. The stage shows a
scene (`art.js sceneOf`: room, home, tower, rift, arena, guild, city, street, clinic, market, ruins) with no words.
We have no life-chapter system yet (notes §5 not built).

## Goals
1. **Top bar** `#who` at the top of the centre column, above the stage, on every screen size: name (bold); one line
   `อายุ N ปี · <rank or role> · <chapter chip>`. Rank: the hunter rank letter (S..F) with class, else the job title,
   else the stage word (เด็ก/วัยรุ่น/ผู้ใหญ่/ผู้สูงวัย).
2. **Chapter chip** from the life's state, a pure core function `chapterOf(s): string` **(call: a label only, not the
   arcs system)**: dead ignored; abroad (country ≠ birth country) "ชีวิตต่างแดน"; a lasting injury "ช่วงพักฟื้น";
   hunting in a guild "ฮันเตอร์กิลด์ <guild>"; hunting alone "ฮันเตอร์อิสระ"; stopped hunting "เลิกล่าแล้ว"; a job
   "ชีวิตการงาน"; adult without job "ช่วงหางาน"; kid "วัยเด็ก"; teen "วัยเรียน"; old "บั้นปลาย". First match wins
   in that order **(call)**.
3. **Scene line** over the bottom-left of the stage `#ov .where`: place = Thai name of the scene + city
   (`ห้องนอน · เชียงใหม่`) **(call: names in a table in `art.js`)**; doing = the running operation's name if any,
   else "มีเรื่องรอตัดสินใจ · <tag>" if a decision waits, else "<main plan name>" (with the second plan after " · "
   when set).
4. Phones: the top bar is one compact block above the stage; the card's own name block stays (no removal).

## Non-goals / anti-goals
No life-arc mechanics, no balance change, no secret revealed (chapter words come only from visible state), the 40
browser checks keep passing, the stage art is not covered by more than two short lines.

## Approaches
A **(picked, call)**: new markup + two pure functions, card untouched. B: move the card's header into the bar and
remove it from the card — less repetition, but touches checks that read the card (UX-11 reads age from `#card`).

## Measured
Unit tests for `chapterOf` (each rule and the order). Browser cases `T-bar` (desktop and 390×844: `#who` above the
stage, shows name and age), `T-where` (the scene line shows a place and a doing text; with a waiting decision it
says so).
