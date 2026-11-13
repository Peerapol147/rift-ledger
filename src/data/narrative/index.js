// Branching stories (data only; core/narrative.js runs them). Spec: 2026-11-13-lives-that-remember-design.md.
import { OFFICE } from "./office.js";
import { FRIEND } from "./friend.js";
import { THONGBAI } from "./thongbai.js";
import { SILAWONG } from "./silawong.js";
import { YOON } from "./yoon.js";
import { HONG } from "./hong.js";
import { MINGYU } from "./mingyu.js";
import { DOHYUN } from "./dohyun.js";
import { SEOJIN } from "./seojin.js";
import { PORAMET } from "./poramet.js";

export const STORY_DEFS = { office: OFFICE, friend: FRIEND, thongbai: THONGBAI, silawong: SILAWONG, yoon: YOON,
  hong: HONG, mingyu: MINGYU, dohyun: DOHYUN,
  seojin: SEOJIN, poramet: PORAMET };
// Old chapter chains replaced by a story above: core/stories.js skips them for a life that started the story.
export const MIGRATED = ["office"];
